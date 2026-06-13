export default function TopBar() {
  return (
    <div className="flex items-center justify-end gap-4 px-8 py-5">
      <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <span className="absolute top-1.5 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
      </button>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-sm">
          A
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Alex</p>
          <p className="text-xs text-slate-400">alex@learn.app</p>
        </div>
      </div>
    </div>
  );
}
