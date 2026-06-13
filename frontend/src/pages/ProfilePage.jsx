import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { getDashboard } from "../services/api";

export default function ProfilePage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDashboard()
      .then((data) => mounted && setStats(data))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <TopBar />
      <div className="px-8 pb-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Profile</h1>
        <p className="text-slate-500 mb-6">Your account and learning activity</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-2xl flex-shrink-0">
            A
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Alex</p>
            <p className="text-sm text-slate-400">alex@learn.app</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="DOCUMENTS UPLOADED" value={loading ? "—" : stats?.totalDocuments ?? 0} color="bg-blue-100 text-blue-600" icon={<DocIcon className="w-5 h-5" />} />
          <StatCard label="FLASHCARDS GENERATED" value={loading ? "—" : stats?.totalFlashcards ?? 0} color="bg-pink-100 text-pink-600" icon={<CardIcon className="w-5 h-5" />} />
          <StatCard label="QUIZ ATTEMPTS" value={loading ? "—" : stats?.totalQuizzes ?? 0} color="bg-emerald-100 text-emerald-600" icon={<QuizIcon className="w-5 h-5" />} />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">About</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            AI Learning Assistant helps you study smarter by turning any PDF into an interactive chat,
            summaries, flashcards, and quizzes — all powered by AI based strictly on your document's content.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-400 tracking-wide mb-2">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
    </div>
  );
}

function DocIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function CardIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function QuizIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  );
}
