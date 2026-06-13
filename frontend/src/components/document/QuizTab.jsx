import { useEffect, useState } from "react";
import { getQuiz, generateQuiz, submitQuizAttempt, exportQuizUrl } from "../../services/api";

export default function QuizTab({ doc, setDoc }) {
  const [quiz, setQuiz] = useState(doc.quiz || { questions: [], attempts: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // In-progress attempt state
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null); // { score, total, results }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getQuiz(doc._id)
      .then((data) => {
        if (mounted) {
          setQuiz(data.quiz);
          setAnswers(new Array(data.quiz.questions.length).fill(-1));
        }
      })
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [doc._id]);

  const startQuiz = (questions) => {
    setAnswers(new Array(questions.length).fill(-1));
    setCurrent(0);
    setResult(null);
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    try {
      const data = await generateQuiz(doc._id);
      setQuiz(data.quiz);
      setDoc((prev) => ({ ...prev, quiz: data.quiz }));
      startQuiz(data.quiz.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const data = await submitQuizAttempt(doc._id, answers);
      setResult(data);
      setQuiz((prev) => ({ ...prev, attempts: data.attempts }));
      setDoc((prev) => ({ ...prev, quiz: { ...prev.quiz, attempts: data.attempts } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    startQuiz(quiz.questions);
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const hasQuiz = quiz.questions && quiz.questions.length > 0;

  // --- No quiz yet ---
  if (!hasQuiz) {
    return (
      <div>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <QuizIcon className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">No quiz yet</p>
          <p className="text-xs text-slate-400 mb-4">Generate a 5-question multiple choice quiz from this document.</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2 transition-colors disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>
    );
  }

  // --- Results view ---
  if (result) {
    return (
      <div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5 text-center">
          <p className="text-xs font-semibold text-emerald-500 tracking-wide mb-2">QUIZ COMPLETE</p>
          <p className="text-4xl font-bold text-slate-900 mb-1">
            {result.score} / {result.total}
          </p>
          <p className="text-sm text-slate-400 mb-4">Attempt #{result.attemptNumber}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetake}
              className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2 transition-colors"
            >
              Retake Quiz
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-sm font-medium border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-600 rounded-xl px-4 py-2 transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate New Quiz"}
            </button>
            <a
              href={exportQuizUrl(doc._id)}
              className="flex items-center gap-2 text-sm font-medium border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-600 rounded-xl px-4 py-2 transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
              Export PDF
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {result.results.map((r, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm font-medium text-slate-900 mb-3">
                {i + 1}. {r.question}
              </p>
              <div className="flex flex-col gap-2">
                {r.options.map((opt, oi) => {
                  const isCorrect = oi === r.correctIndex;
                  const isSelected = oi === r.selected;
                  let cls = "border-slate-200 text-slate-600";
                  if (isCorrect) cls = "border-emerald-400 bg-emerald-50 text-emerald-700";
                  else if (isSelected && !isCorrect) cls = "border-red-300 bg-red-50 text-red-600";
                  return (
                    <div key={oi} className={`flex items-center justify-between border rounded-xl px-3 py-2 text-sm ${cls}`}>
                      <span>{opt}</span>
                      {isCorrect && <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      {isSelected && !isCorrect && <XIcon className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
              {r.selected === -1 && (
                <p className="text-xs text-slate-400 mt-2">You skipped this question.</p>
              )}
            </div>
          ))}
        </div>

        {quiz.attempts.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">Attempt History</p>
            <div className="flex flex-col gap-2">
              {quiz.attempts.map((a) => (
                <div key={a.attemptNumber} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Attempt #{a.attemptNumber}</span>
                  <span className="font-medium text-slate-800">
                    {a.score} / {a.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- In-progress quiz ---
  const q = quiz.questions[current];
  const allAnswered = answers.every((a) => a !== -1);
  const isLast = current === quiz.questions.length - 1;

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500">
          Question {current + 1} of {quiz.questions.length}
        </p>
        <a
          href={exportQuizUrl(doc._id)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 rounded-xl px-3 py-1.5 transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          Export PDF
        </a>
      </div>

      <div className="flex gap-1.5 mb-5">
        {quiz.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i === current ? "bg-emerald-500" : answers[i] !== -1 ? "bg-emerald-200" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-base font-medium text-slate-900 mb-5">{q.question}</p>

        <div className="flex flex-col gap-2.5">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => selectAnswer(oi)}
              className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                answers[current] === oi
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-slate-50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={() => setCurrent((c) => Math.min(quiz.questions.length - 1, c + 1))}
              className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-5 py-2.5 transition-colors"
            >
              Next →
            </button>
          )}
        </div>

        {!allAnswered && isLast && (
          <p className="text-xs text-slate-400 mt-3 text-right">Answer all questions to submit.</p>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />;
}

function QuizIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  );
}

function DownloadIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 12l4.5-4.5M12 12V3" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
