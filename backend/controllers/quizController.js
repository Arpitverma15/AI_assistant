import Document from "../models/Document.js";
import Activity from "../models/Activity.js";
import { callGeminiWithPdf, parseJsonResponse } from "../utils/gemini.js";
import { buildQuizPdf } from "../utils/pdfExport.js";

const QUIZ_QUESTION_COUNT = 5;

// POST /api/documents/:id/quiz/generate
// Generates a fresh 5-question quiz (replaces any existing questions,
// but keeps past attempts/scores for history).
export const generateQuiz = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const prompt = `You are an expert exam writer. Read the attached PDF document and create exactly ${QUIZ_QUESTION_COUNT} multiple-choice questions covering important concepts from it.

Respond with ONLY a JSON array (no markdown fences, no extra text) in exactly this format:
[
  { "question": "...", "options": ["option A", "option B", "option C", "option D"], "correctIndex": 0 }
]
Rules:
- The array must contain exactly ${QUIZ_QUESTION_COUNT} items.
- "options" must always have exactly 4 strings.
- "correctIndex" is the 0-based index (0-3) of the correct option.
- Questions should be clear and based strictly on the document content.`;

    const raw = await callGeminiWithPdf(doc.pdfBase64, prompt);
    const parsed = parseJsonResponse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("AI did not return a valid quiz.");
    }

    const questions = parsed
      .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length === 4)
      .slice(0, QUIZ_QUESTION_COUNT)
      .map((q) => ({
        question: String(q.question),
        options: q.options.map(String),
        correctIndex: Math.min(Math.max(parseInt(q.correctIndex) || 0, 0), 3),
      }));

    if (questions.length !== QUIZ_QUESTION_COUNT) {
      throw new Error("AI did not return the expected number of questions.");
    }

    doc.quiz.questions = questions;
    await doc.save();

    res.json({ quiz: doc.quiz });
  } catch (error) {
    console.error("Generate quiz error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz. Please try again." });
  }
};

// GET /api/documents/:id/quiz
export const getQuiz = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id, "quiz name");
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ quiz: doc.quiz });
  } catch (error) {
    console.error("Get quiz error:", error);
    res.status(500).json({ error: "Failed to load quiz." });
  }
};

// POST /api/documents/:id/quiz/attempt
// body: { answers: [number, ...] } (selected option index per question, -1 if skipped)
// Scores the attempt server-side and saves it. Correct answers are
// returned in the response (revealed only at the end, by the frontend).
export const submitQuizAttempt = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const { answers } = req.body;
    const questions = doc.quiz.questions;

    if (!questions.length) {
      return res.status(400).json({ error: "No quiz has been generated for this document yet." });
    }

    if (!Array.isArray(answers) || answers.length !== questions.length) {
      return res.status(400).json({ error: "Invalid answers submitted." });
    }

    let score = 0;
    const results = questions.map((q, i) => {
      const selected = Number.isInteger(answers[i]) ? answers[i] : -1;
      const correct = selected === q.correctIndex;
      if (correct) score += 1;
      return {
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        selected,
        correct,
      };
    });

    const attemptNumber = doc.quiz.attempts.length + 1;
    doc.quiz.attempts.push({
      attemptNumber,
      score,
      total: questions.length,
      answers,
    });
    await doc.save();

    await Activity.create({
      type: "attempted_quiz",
      documentId: doc._id,
      documentName: doc.name,
      meta: { score, total: questions.length, attemptNumber },
    });

    res.json({
      attemptNumber,
      score,
      total: questions.length,
      results,
      attempts: doc.quiz.attempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        score: a.score,
        total: a.total,
        takenAt: a.takenAt,
      })),
    });
  } catch (error) {
    console.error("Submit quiz attempt error:", error);
    res.status(500).json({ error: "Failed to submit quiz attempt." });
  }
};

// GET /api/documents/:id/quiz/export -> downloadable PDF (Q + 4 options + correct answer)
export const exportQuiz = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id, "quiz name");
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!doc.quiz.questions.length) {
      return res.status(400).json({ error: "No quiz to export yet." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilename(doc.name)}-quiz.pdf"`
    );

    const pdfDoc = buildQuizPdf(doc.name, doc.quiz.questions);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Export quiz error:", error);
    res.status(500).json({ error: "Failed to export quiz." });
  }
};

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80) || "document";
}
