import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import UploadModal from "../components/UploadModal";
import { listDocuments, renameDocument, deleteDocument } from "../services/api";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const navigate = useNavigate();

  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (pageToLoad) => {
    setLoading(true);
    setError("");
    try {
      const data = await listDocuments(pageToLoad, 10);
      setDocuments((prev) => (pageToLoad === 1 ? data.documents : [...prev, ...data.documents]));
      setHasMore(data.hasMore);
      setPage(pageToLoad);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPage(page + 1);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, loadPage]);

  const handleUploaded = (doc) => {
    setShowUpload(false);
    navigate(`/documents/${doc._id}`);
  };

  const startRename = (doc, e) => {
    e.stopPropagation();
    e.preventDefault();
    setRenamingId(doc._id);
    setRenameValue(doc.name);
  };

  const submitRename = async (id) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    try {
      const data = await renameDocument(id, name);
      setDocuments((prev) => prev.map((d) => (d._id === id ? { ...d, name: data.document.name } : d)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Delete this document and all its flashcards, quizzes, and chat history?")) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <TopBar />
      <div className="px-8 pb-10">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
            <p className="text-slate-500">Manage and organize your learning materials</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl px-4 py-2.5 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {documents.map((doc) => (
            <Link
              key={doc._id}
              to={`/documents/${doc._id}`}
              className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                  <DocIcon className="w-5 h-5" />
                </div>
                <button
                  onClick={(e) => handleDelete(doc._id, e)}
                  className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete document"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              {renamingId === doc._id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onClick={(e) => e.preventDefault()}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => submitRename(doc._id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRename(doc._id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="w-full text-base font-semibold text-slate-900 border border-emerald-300 rounded-lg px-2 py-1 mb-1 outline-none"
                />
              ) : (
                <h3
                  className="text-base font-semibold text-slate-900 mb-1 truncate"
                  title={doc.name}
                  onDoubleClick={(e) => startRename(doc, e)}
                >
                  {doc.name}
                </h3>
              )}

              <p className="text-xs text-slate-400 mb-3">{formatSize(doc.size)}</p>

              <div className="flex items-center gap-2 mb-3">
                <Badge color="purple">{doc.flashcardCount} Flashcards</Badge>
                <Badge color="green">{doc.quizAttemptCount} Quiz Attempts</Badge>
              </div>

              <p className="text-xs text-slate-400">Uploaded {timeAgo(doc.createdAt)}</p>
              <button
                onClick={(e) => startRename(doc, e)}
                className="mt-3 text-xs text-emerald-600 hover:underline"
              >
                Rename
              </button>
            </Link>
          ))}
        </div>

        {documents.length === 0 && !loading && (
          <div className="mt-16 text-center text-slate-400">
            <p className="text-sm">No documents yet. Upload a PDF to get started.</p>
          </div>
        )}

        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
          {loading && <p className="text-sm text-slate-400">Loading...</p>}
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
    </div>
  );
}

function Badge({ children, color }) {
  const colors = {
    purple: "bg-purple-50 text-purple-600",
    green: "bg-emerald-50 text-emerald-600",
  };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[color]}`}>{children}</span>;
}

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function PlusIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function DocIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
