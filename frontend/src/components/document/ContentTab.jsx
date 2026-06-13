import { useMemo } from "react";

export default function ContentTab({ doc }) {
  const pdfUrl = useMemo(() => {
    if (!doc.pdfBase64) return null;
    return `data:application/pdf;base64,${doc.pdfBase64}`;
  }, [doc.pdfBase64]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-medium text-slate-700">Document Viewer</p>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
          >
            Open in new tab
            <ExternalIcon className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {pdfUrl ? (
        <iframe title={doc.name} src={pdfUrl} className="w-full" style={{ height: "75vh" }} />
      ) : (
        <p className="p-6 text-sm text-slate-400">Unable to load PDF preview.</p>
      )}
    </div>
  );
}

function ExternalIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
