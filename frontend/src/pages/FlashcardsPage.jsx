import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import { listDocuments, getFlashcards } from "../services/api";

export default function FlashcardsPage() {
  const [groups, setGroups] = useState([]); // [{ doc, flashcards }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Fetch all documents (paginate through everything)
        let all = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const data = await listDocuments(page, 50);
          all = all.concat(data.documents);
          hasMore = data.hasMore;
          page += 1;
        }

        const withCards = all.filter((d) => d.flashcardCount > 0);

        const results = await Promise.all(
          withCards.map(async (doc) => {
            try {
              const data = await getFlashcards(doc._id);
              return { doc, flashcards: data.flashcards };
            } catch {
              return { doc, flashcards: [] };
            }
          })
        );

        if (mounted) {
          setGroups(results);
          if (results.length > 0) setOpenId(results[0].doc._id);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalCards = groups.reduce((sum, g) => sum + g.flashcards.length, 0);

  return (
    <div>
      <TopBar />
      <div className="px-8 pb-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Flashcards</h1>
        <p className="text-slate-500 mb-6">
          {totalCards > 0
            ? `${totalCards} flashcards across ${groups.length} document${groups.length === 1 ? "" : "s"}`
            : "All your flashcards in one place"}
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && <p className="text-sm text-slate-400">Loading...</p>}

        {!loading && groups.length === 0 && !error && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <CardIcon className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">No flashcards yet</p>
            <p className="text-xs text-slate-400 mb-4">
              Open a document and generate flashcards from its Flashcards tab.
            </p>
            <Link
              to="/documents"
              className="inline-block text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2 transition-colors"
            >
              Go to Documents
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {groups.map(({ doc, flashcards }) => {
            const isOpen = openId === doc._id;
            return (
              <div key={doc._id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : doc._id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                      <DocIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-400">{flashcards.length} flashcards</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                    {flashcards.map((card, i) => (
                      <FlashcardPreview key={i} card={card} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FlashcardPreview({ card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped((f) => !f)} className="cursor-pointer select-none h-40" style={{ perspective: "1000px" }}>
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className="absolute inset-0 bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center text-center overflow-y-auto"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-sm font-medium text-slate-800">{card.question}</p>
        </div>
        <div
          className="absolute inset-0 bg-emerald-500 rounded-xl p-4 flex items-center justify-center text-center overflow-y-auto"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-sm font-medium text-white">{card.answer}</p>
        </div>
      </div>
    </div>
  );
}

function CardIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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

function ChevronDown(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
