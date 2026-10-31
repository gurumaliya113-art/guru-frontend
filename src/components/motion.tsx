// Small decorative motion pieces shared by the student/teacher panels.
// Styles live in src/app-motion.css.

/** 4-point twinkling star used on purple gradient headers. */
export function Sparkle({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={`am-twinkle pointer-events-none ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <path d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12C8 10 11 7 12 0z" />
    </svg>
  );
}

/** Purple gradient header with drifting blobs + sparkles. */
export function GradientHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`am-grad relative overflow-hidden rounded-b-[28px] text-white ${className}`}>
      <span className="am-blob-a pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-white/[0.07]" />
      <span className="am-blob-b pointer-events-none absolute -bottom-10 left-6 h-32 w-32 rounded-full bg-fuchsia-300/10" />
      <Sparkle className="absolute right-[36%] top-10 h-3 w-3 text-white/60" />
      <Sparkle className="absolute bottom-6 right-6 h-3.5 w-3.5 text-violet-200/80" delay={1.6} />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Animated "building your paper" overlay shown while a paper is generated. */
export function PaperBuilding({ label = "Building your paper…" }: { label?: string }) {
  return (
    <div className="am-fade-in fixed inset-0 z-[70] flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
      <div className="am-float relative">
        <div className="relative h-44 w-36 rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_24px_50px_-20px_rgba(76,29,149,.55)]">
          <div className="am-grad mx-auto -mt-7 mb-3 h-6 w-14 rounded-md" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-3 flex items-center gap-2">
              <span
                className="am-paper-check flex h-4 w-4 items-center justify-center rounded bg-violet-600 text-[9px] font-bold text-white"
                style={{ animationDelay: `${0.2 + i * 0.18}s` }}
              >
                ✓
              </span>
              <span
                className="am-paper-line h-2 rounded-full bg-violet-200"
                style={{ width: `${[70, 56, 64, 44][i]}%`, animationDelay: `${0.1 + i * 0.18}s` }}
              />
            </div>
          ))}
        </div>
        <span className="am-pencil absolute -bottom-3 -left-3 block h-3 w-16 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-pink-300 shadow" />
        <Sparkle className="absolute -right-5 -top-3 h-5 w-5 text-violet-500" />
      </div>
      <div className="mt-8 text-[15px] font-bold text-violet-800">{label}</div>
      <div className="mt-1 text-[12px] text-gray-500">Picking questions and arranging sections</div>
    </div>
  );
}
