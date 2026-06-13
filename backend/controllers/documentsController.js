import Document from "../models/Document.js";
import Activity from "../models/Activity.js";

// POST /api/documents  (multipart, field: pdf)
export const uploadDocument = async (req, res) => {
  try {
    const pdfFile = req.file;
    if (!pdfFile) {
      return res.status(400).json({ error: "No PDF file provided" });
    }

    const name = (req.body.name && req.body.name.trim()) || pdfFile.originalname.replace(/\.pdf$/i, "");

    const doc = await Document.create({
      name,
      originalFileName: pdfFile.originalname,
      mimeType: pdfFile.mimetype,
      size: pdfFile.size,
      pdfBase64: pdfFile.buffer.toString("base64"),
    });

    await Activity.create({
      type: "accessed_document",
      documentId: doc._id,
      documentName: doc.name,
    });

    res.status(201).json({ document: toSummary(doc) });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload document. Please try again." });
  }
};

// GET /api/documents?page=1&limit=10
// Infinite-scroll friendly: returns documents sorted by most recently
// uploaded, with `hasMore` indicating whether further pages exist.
export const listDocuments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Document.find({}, Document.listProjection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(),
    ]);

    res.json({
      documents: docs.map(toSummary),
      page,
      limit,
      total,
      hasMore: skip + docs.length < total,
    });
  } catch (error) {
    console.error("List documents error:", error);
    res.status(500).json({ error: "Failed to load documents." });
  }
};

// GET /api/documents/:id  -> full document including pdfBase64 (for viewer)
export const getDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    doc.lastAccessedAt = new Date();
    await doc.save();

    await Activity.create({
      type: "accessed_document",
      documentId: doc._id,
      documentName: doc.name,
    });

    res.json({ document: toFull(doc) });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ error: "Failed to load document." });
  }
};

// PATCH /api/documents/:id  { name }
export const renameDocument = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name cannot be empty." });
    }

    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, projection: Document.listProjection }
    );

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ document: toSummary(doc) });
  } catch (error) {
    console.error("Rename document error:", error);
    res.status(500).json({ error: "Failed to rename document." });
  }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    await Activity.deleteMany({ documentId: doc._id });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document." });
  }
};

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const docs = await Document.find({}, "flashcards quiz.attempts");

    const totalDocuments = docs.length;
    const totalFlashcards = docs.reduce((sum, d) => sum + d.flashcards.length, 0);
    const totalQuizzes = docs.reduce((sum, d) => sum + (d.quiz?.attempts?.length || 0), 0);

    const recentActivity = await Activity.find({}).sort({ createdAt: -1 }).limit(10);

    res.json({
      totalDocuments,
      totalFlashcards,
      totalQuizzes,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard." });
  }
};

// ---- helpers ----

function toSummary(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    originalFileName: doc.originalFileName,
    size: doc.size,
    flashcardCount: doc.flashcards?.length || 0,
    quizAttemptCount: doc.quiz?.attempts?.length || 0,
    hasQuiz: (doc.quiz?.questions?.length || 0) > 0,
    chatMessageCount: doc.chatHistory?.length || 0,
    summaryGenerated: doc.summary?.generated || false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastAccessedAt: doc.lastAccessedAt,
  };
}

function toFull(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    size: doc.size,
    pdfBase64: doc.pdfBase64,
    chatHistory: doc.chatHistory,
    summary: doc.summary,
    flashcards: doc.flashcards,
    quiz: doc.quiz,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
