import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Atom,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Gift,
  GraduationCap,
  Layers,
  Medal,
  Menu,
  MessageCircle,
  Play,
  School,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import "../landing.css";

/* ───────────────────────────── Data ───────────────────────────── */

const NAV_LINKS = [
  { label: "Mock Tests", href: "#exams" },
  { label: "Toppers", href: "#toppers" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "For Teachers", href: "/teachers" },
  { label: "For Schools", href: "/schools" },
  { label: "Refer & Earn", href: "#referral", badge: "NEW" },
];

// Photos live in frontend/public/toppers/ (see file names below).
const TOPPERS = [
  { name: "Jyoti",    photo: "/toppers/jyoti.jpg",    score: 577, outOf: 720, exam: "NEET" },
  { name: "Anjali",   photo: "/toppers/anjali.jpg",   score: 552, outOf: 720, exam: "NEET" },
  { name: "Himanshu", photo: "/toppers/himanshu.jpg", score: 563, outOf: 720, exam: "NEET" },
  { name: "Mahi",     photo: "/toppers/mahi.jpg",     score: 495, outOf: 720, exam: "NEET", extra: "BITSAT Cleared" },
  { name: "Jhanvi",   photo: "/toppers/jhanvi.jpg",   score: 100, outOf: 100, exam: "Mathematics" },
];

const EXAM_CARDS = [
  { icon: Atom,          title: "JEE Main",       sub: "Engineering entrance", tag: "Mock tests · PYQs" },
  { icon: Trophy,        title: "JEE Advanced",   sub: "IIT entrance",          tag: "Full-length tests" },
  { icon: Stethoscope,   title: "NEET",           sub: "Medical entrance",      tag: "NCERT based" },
  { icon: Medal,         title: "Olympiads",      sub: "Science & Maths",       tag: "Level-wise practice" },
  { icon: GraduationCap, title: "Class 12 Board", sub: "CBSE & State boards",   tag: "Chapter tests" },
  { icon: Award,         title: "Class 10 Board", sub: "CBSE & State boards",   tag: "Sample papers" },
  { icon: BookOpen,      title: "Class 9 & 11",   sub: "Foundation years",      tag: "Concept practice" },
  { icon: School,        title: "Class 1 – 8",    sub: "School syllabus",       tag: "Daily practice" },
];

const QUICK_ACCESS = [
  { icon: ClipboardCheck, title: "Mock Tests",      desc: "Timed tests on the real exam pattern.",      tint: "#7c3aed", bg: "#f3efff", wave: "#e7defd" },
  { icon: Brain,          title: "AI Doubt Solving", desc: "Step-by-step answers, any time of day.",    tint: "#2563eb", bg: "#eef4ff", wave: "#dde8fe" },
  { icon: Layers,         title: "Flashcards & Notes", desc: "Revise faster with crisp notes and cards.", tint: "#16a34a", bg: "#ecfbf1", wave: "#d6f3e0" },
  { icon: TrendingUp,     title: "Progress Tracker", desc: "See weak topics and track your growth.",    tint: "#ea8a0c", bg: "#fff6e8", wave: "#fde9c8" },
];

const PRICING_PLANS = [
  {
    name: "Free", monthly: 0, yearly: 0, note: "free forever · no card needed", popular: false, cta: "Start Free",
    features: ["Sample chapter summaries & notes", "AI tutor & daily practice", "2 practice tests / month", "3 chapter unlocks / day"],
  },
  {
    name: "Plus", monthly: 249, yearly: 2490, note: "auto-renews · cancel anytime", popular: true, cta: "Choose Plus",
    features: ["Full-syllabus summaries & notes", "8 practice tests / month", "40 chapter unlocks / day", "Basic progress analytics"],
  },
  {
    name: "Pro", monthly: 499, yearly: 4990, note: "auto-renews · cancel anytime", popular: false, cta: "Choose Pro",
    features: ["Everything in Plus", "Unlimited practice tests", "Board-pattern test series (10 & 12)", "Full analytics + parent reports", "Video lessons"],
  },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", exam: "JEE Main 2024", score: "99.2 percentile", rating: 5, icon: Star,
    text: "Gurtron's AI doubt solver saved me hours every day. I could get answers to complex physics problems at 2 AM without waiting for anyone!" },
  { name: "Rohan Mehta", exam: "NEET 2024", score: "680 / 720", rating: 5, icon: TrendingUp,
    text: "The flashcards are insane — I revised all of Biology in just 3 days before my exam. The spaced repetition actually works." },
  { name: "Ananya Singh", exam: "UPSC Prelims", score: "Cleared", rating: 5, icon: Award,
    text: "Best revision notes I found anywhere. Concise, accurate, and they cover everything in the syllabus. Gurtron is a game changer." },
];

const STATS = [
  { value: "50K+",  label: "Questions",     icon: BookOpen,       tint: "#7c3aed", bg: "#f3efff" },
  { value: "10+",   label: "Exams Covered", icon: ClipboardCheck, tint: "#2563eb", bg: "#eef4ff" },
  { value: "Free*", label: "To Start",      icon: Zap,            tint: "#16a34a", bg: "#ecfbf1" },
  { value: "4.8★",  label: "Play Store",    icon: Star,           tint: "#ea8a0c", bg: "#fff6e8" },
];

const WHY = [
  { n: "01", icon: ClipboardCheck, title: "Mock Tests That Feel Like the Real Exam", tint: "#16a34a", bg: "#ecfbf1",
    desc: "Full-length, timed tests on the latest pattern so exam day feels familiar." },
  { n: "02", icon: Brain, title: "AI Doubt Solving, 24×7", tint: "#7c3aed", bg: "#f3efff",
    desc: "Stuck on a question? Get a clear, step-by-step explanation in seconds." },
  { n: "03", icon: BarChart3, title: "Detailed Analysis & Feedback", tint: "#ea8a0c", bg: "#fff6e8",
    desc: "Know your weak topics, track accuracy and improve with every test." },
];

const REFERRAL_TIERS = [
  { icon: Wallet, who: "Teacher → Student", headline: "Earn 10% Cash", example: "₹1,000 plan → ₹100 aapke",
    desc: "Aapka refer kiya student jab paid plan le, aapko uski value ka 10% commission milega." },
  { icon: GraduationCap, who: "Teacher → Teacher", headline: "Earn 10% Cash", example: "₹2,000 plan → ₹200 aapke",
    desc: "Doosre teachers ko invite karo. Wo plan lenge to har purchase pe 10% commission." },
  { icon: Coins, who: "Student → Student", headline: "Coins + Premium", example: "10 referrals → 1 month Premium",
    desc: "Har successful referral pe 100 coins. 10 friends invite karo, 1 month Premium free." },
];

const REFERRAL_STEPS = [
  { icon: Share2, title: "Code share karo" },
  { icon: Users,  title: "Friend join kare" },
  { icon: Gift,   title: "Reward paao" },
];

const FAQS = [
  { q: "Is Gurtron free to use?",
    a: "Yes, you can start free. Premium plans unlock more tests, notes and analytics." },
  { q: "Which exams does Gurtron cover?",
    a: "Class 1–12 (CBSE & State boards), JEE Main, JEE Advanced, NEET and Olympiads." },
  { q: "How does AI Doubt Solving work?",
    a: "Type or upload a photo of your doubt. The AI gives a clear, step-by-step explanation for your level and exam." },
  { q: "Can teachers use Gurtron?",
    a: "Yes. Teachers can create papers, assign tests to their classes and track student performance." },
];

/* ─────────────────────────── Helpers ─────────────────────────── */

/** Fade-up on first scroll into view (same feel as mocktestt's Framer Motion setup). */
function R({
  children, delay = 0, y = 22, scale = 1, className = "", style, as: Tag = "div",
}: {
  children: ReactNode; delay?: number; y?: number; scale?: number; className?: string;
  style?: CSSProperties; as?: "div" | "section" | "article" | "li";
}) {
  const vars = { "--rd": `${delay}s`, "--ry": `${y}px`, "--rs": scale, ...style } as CSSProperties;
  return <Tag className={`gl-reveal ${className}`} style={vars}>{children}</Tag>;
}

function useRevealOnScroll(root: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>(".gl-reveal");
    if (!("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }),
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" },
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [root]);
}

function usePerView(sm: number, md: number, lg: number) {
  const get = () => (window.innerWidth >= 1024 ? lg : window.innerWidth >= 640 ? md : sm);
  const [n, setN] = useState(get);
  useEffect(() => {
    const on = () => setN(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return n;
}

/** Auto-advancing page index; pauses while hovered. */
function useAutoPage(pages: number, ms: number) {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (page >= pages) setPage(0); }, [page, pages]);
  useEffect(() => {
    if (pages <= 1 || paused) return;
    const t = window.setInterval(() => setPage((p) => (p + 1) % pages), ms);
    return () => window.clearInterval(t);
  }, [pages, ms, paused]);
  const hover = { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) };
  return { page, setPage, hover };
}

/** Counts from 0 to `to` once the number scrolls into view. */
function CountUp({ to, ms = 1400 }: { to: number; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setVal(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / ms);
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, ms]);
  return <span ref={ref}>{val}</span>;
}

function Laurel({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 60 120" aria-hidden className={`gl-sway h-24 w-12 text-violet-200 md:h-32 md:w-16 ${flip ? "-scale-x-100" : ""}`}
      style={{ animationDelay: flip ? "1.5s" : "0s" }} fill="currentColor">
      <path d="M44 116C20 98 10 70 16 40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {[[30, 100, -30], [22, 84, -40], [17, 66, -50], [16, 48, -60], [19, 31, -70]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x - 9} cy={y} rx="9" ry="4.5" transform={`rotate(${r} ${x - 9} ${y})`} />
          <ellipse cx={x + 8} cy={y - 4} rx="9" ry="4.5" transform={`rotate(${r + 80} ${x + 8} ${y - 4})`} />
        </g>
      ))}
      <ellipse cx="20" cy="18" rx="5" ry="10" transform="rotate(20 20 18)" />
    </svg>
  );
}

function TopperPhoto({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative block h-[92px] w-[92px] shrink-0">
      {/* rotating gradient ring */}
      <span className="gl-spin-slow absolute -inset-[5px] rounded-full"
        style={{ background: "conic-gradient(from 0deg, #c4b5fd, #7c3aed, #f0abfc, #c4b5fd)" }} />
      <span className="absolute -inset-[2px] rounded-full bg-white" />
      {failed ? (
        <span className="gl-grad relative flex h-full w-full items-center justify-center rounded-full text-2xl font-bold text-white">
          {name[0]}
        </span>
      ) : (
        <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)}
          className="relative h-full w-full rounded-full object-cover object-top" />
      )}
    </span>
  );
}

function Spark({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={`gl-twinkle ${className}`} style={{ animationDelay: `${delay}s` }}>
      <path d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12C8 10 11 7 12 0z" />
    </svg>
  );
}

function Kicker({ icon: Icon, children, dark = false }: { icon: any; children: ReactNode; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
      style={dark
        ? { background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.25)" }
        : { background: "var(--p50)", color: "var(--p600)", border: "1px solid var(--p100)" }}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </span>
  );
}

function SectionTitle({ kicker, icon, title, accent, sub }: { kicker: string; icon: any; title: string; accent: string; sub?: string }) {
  return (
    <R className="mx-auto max-w-2xl text-center">
      <Kicker icon={icon}>{kicker}</Kicker>
      <h2 className="gl-h mt-4 text-3xl font-extrabold md:text-[42px] md:leading-[1.15]">
        {title} <span className="gl-grad-text">{accent}</span>
      </h2>
      {sub && <p className="mt-3 text-[15px]" style={{ color: "var(--text)" }}>{sub}</p>}
    </R>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-2.5 shrink-0">
      <span className="gl-grad flex h-9 w-9 items-center justify-center rounded-xl shadow-md">
        <GraduationCap className="h-5 w-5 text-white" />
      </span>
      <span className="gl-h text-xl font-extrabold" style={{ color: light ? "#fff" : "var(--ink)" }}>Gurtron</span>
    </a>
  );
}

/** Hero visual: a mock-test card with a timer and score chip (no stock art). */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden>
      <div className="gl-float rounded-[22px] border border-white/20 bg-white/95 p-5 shadow-[0_30px_60px_-20px_rgba(15,5,40,.6)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-500">JEE Main · Mock 12</div>
            <div className="gl-h text-[17px] font-bold" style={{ color: "var(--ink)" }}>Physics — Kinematics</div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[12px] font-bold text-violet-700">
            <Timer className="h-3.5 w-3.5" /> 42:18
          </span>
        </div>
        {["A ball is thrown vertically upward…", "Velocity-time graph shows…", "Relative velocity of two trains…"].map((q, i) => (
          <div key={q} className="mb-2.5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${i < 2 ? "bg-violet-600 text-white" : "border-2 border-violet-300 text-violet-500"}`}>
              {i < 2 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </span>
            <span className="truncate text-[13px] text-gray-600">{q}</span>
          </div>
        ))}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-violet-100">
          <div className="gl-grad h-full w-[64%] rounded-full" />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-gray-500"><span>16 / 25 answered</span><span>64%</span></div>
      </div>

      <div className="gl-float-2 absolute -left-6 -bottom-8 hidden rounded-2xl bg-white px-4 py-3 shadow-xl sm:block">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50"><BarChart3 className="h-5 w-5 text-emerald-600" /></span>
          <div><div className="text-[11px] text-gray-500">Accuracy</div><div className="gl-h text-lg font-extrabold text-emerald-600">86%</div></div>
        </div>
      </div>
      <div className="gl-float-3 absolute -right-5 -top-6 hidden rounded-2xl bg-white px-4 py-3 shadow-xl sm:block">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50"><Brain className="h-5 w-5 text-amber-500" /></span>
          <div><div className="text-[11px] text-gray-500">AI Doubt</div><div className="text-[13px] font-bold" style={{ color: "var(--ink)" }}>Solved in 8s</div></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useRevealOnScroll(root);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const perView = usePerView(1, 2, 3);
  const tPages = Math.max(1, TESTIMONIALS.length - perView + 1);
  const t = useAutoPage(tPages, 4000);

  const topPerView = usePerView(1, 2, 4);
  const topPages = Math.max(1, TOPPERS.length - topPerView + 1);
  const top = useAutoPage(topPages, 6000);

  const muted = { color: "var(--text)" };

  return (
    <div ref={root} className="gl min-h-screen w-full overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="flex items-center gap-1.5 text-[14px] font-medium text-gray-700 transition-colors hover:text-violet-700">
                {l.label}
                {l.badge && <span className="animate-pulse rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{l.badge}</span>}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2.5 lg:flex">
            <a href="/onboarding" className="rounded-lg bg-gray-100 px-4 py-2 text-[14px] font-semibold text-gray-800 transition-colors hover:bg-gray-200">Login</a>
            <a href="/signup" className="gl-grad rounded-lg px-4 py-2 text-[14px] font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5">Sign Up</a>
          </div>
          <button className="rounded-lg p-2 text-gray-700 lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className="gl-grad h-[3px] w-full" />
        {mobileOpen && (
          <div className="flex flex-col gap-1 border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-2 py-2 text-[15px] font-medium text-gray-700 hover:bg-violet-50">
                {l.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a href="/onboarding" className="rounded-lg bg-gray-100 py-2.5 text-center text-sm font-semibold text-gray-800">Login</a>
              <a href="/signup" className="gl-grad rounded-lg py-2.5 text-center text-sm font-semibold text-white">Sign Up</a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="gl-grad relative overflow-hidden">
        <span className="gl-blob-a pointer-events-none absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-white/[0.06]" />
        <span className="gl-blob-b pointer-events-none absolute -right-24 -top-16 h-[28rem] w-[28rem] rounded-full bg-fuchsia-400/10" />
        <Spark className="absolute left-[8%] top-[18%] h-3 w-3 text-white/60" />
        <Spark className="absolute left-[46%] top-[12%] h-4 w-4 text-violet-200/80" delay={1.2} />
        <Spark className="absolute right-[6%] bottom-[16%] h-3.5 w-3.5 text-white/50" delay={2.1} />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <R><Kicker icon={Sparkles} dark>Class 1–12 · JEE · NEET · Olympiads</Kicker></R>
            <R delay={0.09}>
              <h1 className="gl-h mt-5 text-[40px] font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-[64px]">
                Master Your<br />Preparation with<br /><span className="gl-shine">Gurtron</span>
              </h1>
            </R>
            <R delay={0.18}>
              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-violet-100/90">
                Mock tests, AI doubt solving, flashcards and revision notes — all in one place.
                Ek app, poori taiyari.
              </p>
            </R>
            <R delay={0.27}>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-violet-100/90">
                {[["Real exam pattern", ShieldCheck], ["AI doubt solving", Brain], ["Detailed analysis", BarChart3]].map(([label, Icon]: any) => (
                  <span key={label} className="flex items-center gap-1.5"><Icon className="h-4 w-4" /> {label}</span>
                ))}
              </div>
            </R>
            <R delay={0.36}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="/onboarding" className="gl-glow group inline-flex items-center gap-2.5 rounded-full bg-white py-3 pl-6 pr-3 text-[15px] font-bold text-violet-800">
                  Start Your Test
                  <span className="gl-grad flex h-8 w-8 items-center justify-center rounded-full"><ArrowRight className="gl-arrow h-4 w-4 text-white" /></span>
                </a>
                <a href="#features" className="group inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10">
                  Explore Features <ArrowRight className="gl-arrow h-4 w-4" />
                </a>
              </div>
            </R>
          </div>
          <R delay={0.1} y={0} scale={0.94}><HeroVisual /></R>
        </div>
      </section>

      {/* ── TOPPERS ── */}
      <section id="toppers" className="relative overflow-hidden py-20">
        <span className="gl-dots pointer-events-none absolute left-8 top-10 hidden h-16 w-16 text-violet-300 md:block" />
        <span className="gl-dots pointer-events-none absolute right-8 top-28 hidden h-16 w-16 text-violet-300 md:block" />
        <Spark className="absolute left-[18%] top-[62%] hidden h-3 w-3 text-violet-300 md:block" delay={0.6} />
        <Spark className="absolute right-[16%] top-[14%] hidden h-4 w-4 text-violet-400 md:block" delay={2} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 md:gap-10">
            <Laurel />
            <R className="max-w-xl text-center">
              <Kicker icon={Trophy}>Our toppers</Kicker>
              <h2 className="gl-h mt-4 text-3xl font-extrabold md:text-[42px] md:leading-[1.15]">
                From Students to <span className="gl-grad-text">Achievers</span>
              </h2>
              <p className="mt-3 text-[15px]" style={muted}>Celebrating Gurtron students who worked hard and made it to the top.</p>
            </R>
            <Laurel flip />
          </div>

          <div className="relative mt-12" {...top.hover}>
            <div className="overflow-hidden px-1 py-4">
              <div className="gl-track" style={{ transform: `translateX(-${(top.page * 100) / topPerView}%)` }}>
                {TOPPERS.map((s, i) => (
                  <div key={s.name} className="shrink-0 px-2.5" style={{ width: `${100 / topPerView}%` }}>
                    <R delay={0.08 + Math.min(i, 3) * 0.1} y={26} className="h-full">
                      <article className="gl-lift gl-sheen group relative flex h-full items-center gap-5 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_14px_34px_-22px_rgba(46,16,101,.4)]">
                        <TopperPhoto src={s.photo} name={s.name} />
                        <div className="min-w-0">
                          <div className="gl-h text-[28px] font-extrabold leading-none text-violet-700">
                            <CountUp to={s.score} /><span className="text-[15px] font-bold text-violet-400">/{s.outOf}</span>
                          </div>
                          <div className="mt-1.5 text-[13px] text-gray-500">{s.exam}</div>
                          <span className="mt-2 block h-[2px] w-8 rounded-full bg-violet-500 transition-all duration-500 group-hover:w-14" />
                          <div className="mt-2 text-[15px] font-extrabold uppercase tracking-wide" style={{ color: "var(--ink)" }}>{s.name}</div>
                          {s.extra && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> {s.extra}
                            </span>
                          )}
                        </div>
                        {s.score === s.outOf && (
                          <span className="gl-pop absolute right-3 top-3 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">Perfect</span>
                        )}
                      </article>
                    </R>
                  </div>
                ))}
              </div>
            </div>
            {topPages > 1 && (
              <div className="mt-4 flex justify-center gap-2.5">
                {Array.from({ length: topPages }).map((_, i) => (
                  <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => top.setPage(i)} className={`gl-dot ${i === top.page ? "is-active" : ""}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS ── */}
      <section id="features" className="relative bg-[#faf9ff] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle kicker="Everything you need" icon={Zap} title="Quick" accent="Access" sub="Jump into your preparation with the most used features." />
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACCESS.map((c, i) => (
              <R key={c.title} delay={0.1 + i * 0.12} y={26}>
                <a href="/onboarding" className="gl-lift group relative block h-full overflow-hidden rounded-[22px] p-6 shadow-[0_14px_34px_-22px_rgba(46,16,101,.4)]" style={{ background: c.bg }}>
                  <span className="gl-dots absolute right-5 top-5 h-12 w-12" style={{ color: c.tint, opacity: 0.18 }} />
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md" style={{ background: c.tint }}>
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="gl-h mt-6 text-[19px] font-bold">{c.title}</h3>
                  <span className="mt-2 block h-[3px] w-8 rounded-full" style={{ background: c.tint }} />
                  <p className="mt-3 text-[14px]" style={muted}>{c.desc}</p>
                  <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
                    <path d="M0,40 C90,10 160,70 260,40 C320,22 370,30 400,44 L400,100 L0,100 Z" fill={c.wave} />
                  </svg>
                  <span className="relative mt-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow">
                    <ArrowRight className="gl-arrow h-4 w-4" style={{ color: c.tint }} />
                  </span>
                </a>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAMS ── */}
      <section id="exams" className="relative py-20">
        <span className="gl-dots pointer-events-none absolute left-6 top-10 hidden h-16 w-20 text-violet-300 md:block" />
        <span className="gl-dots pointer-events-none absolute bottom-10 right-6 hidden h-16 w-20 text-violet-300 md:block" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle kicker="Mock tests for every goal" icon={Target} title="Pick Your" accent="Exam" sub="From school classes to competitive entrances." />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {EXAM_CARDS.map((e, i) => (
              <R key={e.title} delay={0.05 + (i % 4) * 0.09}>
                <a href="/onboarding" className="gl-lift group flex h-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_-20px_rgba(46,16,101,.35)]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 ring-4 ring-violet-50/60 transition-colors group-hover:bg-violet-100">
                    <e.icon className="h-5 w-5 text-violet-600" />
                  </span>
                  <span className="min-w-0">
                    <span className="gl-h block text-[16px] font-bold text-violet-700">{e.title}</span>
                    <span className="block truncate text-[12px]" style={muted}>{e.sub}</span>
                    <span className="mt-1 block h-[2px] w-6 rounded-full bg-violet-300" />
                    <span className="mt-1 block truncate text-[12px] font-semibold text-gray-800">{e.tag}</span>
                  </span>
                </a>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-[#faf9ff] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <R className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="gl-h text-3xl font-extrabold md:text-[40px]" style={{ color: "#1f1653" }}>Popular Plans</h2>
              <p className="mt-1 text-[14px]" style={muted}>Start free. Upgrade when you're ready.</p>
            </div>
            <div className="inline-flex rounded-full border border-violet-100 bg-white p-1 text-[13px] font-semibold">
              {(["monthly", "yearly"] as const).map((b) => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`rounded-full px-4 py-1.5 capitalize transition-colors ${billing === b ? "gl-grad text-white" : "text-gray-600"}`}>
                  {b}{b === "yearly" && <span className="ml-1 text-[11px] opacity-80">(2 months free)</span>}
                </button>
              ))}
            </div>
          </R>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {PRICING_PLANS.map((p, i) => {
              const price = billing === "monthly" ? p.monthly : p.yearly;
              const hi = p.popular;
              return (
                <R key={p.name} delay={0.1 + i * 0.12} y={26}>
                  <div className={`gl-lift relative flex h-full flex-col overflow-hidden rounded-[20px] p-6 ${hi ? "gl-grad text-white shadow-[0_24px_50px_-24px_rgba(76,29,149,.8)]" : "border border-gray-200 bg-white"}`}>
                    {hi && <>
                      <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
                      <span className="absolute right-4 top-4 rounded-md bg-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-900">Most Popular</span>
                    </>}
                    <h3 className="gl-h text-[22px] font-bold">{p.name}</h3>
                    <div className={`gl-h mt-2 text-[44px] font-extrabold leading-none ${hi ? "" : "text-violet-700"}`}>
                      ₹{price.toLocaleString("en-IN")}
                    </div>
                    <div className={`mt-1 text-[13px] ${hi ? "text-violet-100" : "text-gray-500"}`}>
                      {price === 0 ? "forever" : billing === "monthly" ? "per month" : "per year"} · {p.note}
                    </div>
                    <ul className="mt-5 flex-1 space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className={`flex items-start gap-2 text-[14px] ${hi ? "text-violet-50" : "text-gray-700"}`}>
                          <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${hi ? "text-white/80" : "text-emerald-500"}`} /> {f}
                        </li>
                      ))}
                    </ul>
                    <a href="/onboarding"
                      className={`mt-6 rounded-xl py-3 text-center text-[14px] font-bold transition-colors ${hi ? "bg-white text-violet-800 hover:bg-violet-50" : "border border-violet-300 text-violet-700 hover:bg-violet-50"}`}>
                      {p.cta}
                    </a>
                  </div>
                </R>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS + STATS ── */}
      <section className="relative py-20">
        <span className="gl-dots pointer-events-none absolute left-6 top-8 hidden h-14 w-24 text-violet-200 md:block" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle kicker="Voices of our community" icon={MessageCircle} title="What Gurtron" accent="Users Say"
            sub="Real stories from students learning and improving with Gurtron." />
          <div className="relative mt-12" {...t.hover}>
            <div className="overflow-hidden px-1 py-2">
              <div className="gl-track" style={{ transform: `translateX(-${(t.page * 100) / perView}%)` }}>
                {TESTIMONIALS.map((r) => (
                  <div key={r.name} className="shrink-0 px-2.5" style={{ width: `${100 / perView}%` }}>
                    <article className="relative h-full overflow-hidden rounded-[18px] border border-gray-100 bg-white p-6 shadow-[0_14px_34px_-22px_rgba(46,16,101,.35)]">
                      <div className="flex items-start justify-between">
                        <span className="gl-h text-4xl leading-none text-violet-300">“</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50"><r.icon className="h-4 w-4 text-violet-600" /></span>
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <p className="mt-3 text-[14px] leading-relaxed" style={muted}>{r.text}</p>
                      <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                        <span className="gl-grad flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold text-white">
                          {r.name.split(" ").map((w) => w[0]).join("")}
                        </span>
                        <div>
                          <div className="text-[14px] font-bold">{r.name}</div>
                          <div className="text-[12px] italic text-gray-500">{r.exam} · {r.score}</div>
                        </div>
                      </div>
                      <span className="gl-grad absolute inset-x-6 bottom-0 h-[3px] rounded-full opacity-70" />
                    </article>
                  </div>
                ))}
              </div>
            </div>
            {tPages > 1 && <>
              <button aria-label="Previous" onClick={() => t.setPage((t.page - 1 + tPages) % tPages)}
                className="absolute -left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-105">
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button aria-label="Next" onClick={() => t.setPage((t.page + 1) % tPages)}
                className="gl-grad absolute -right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105">
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
              <div className="mt-5 flex justify-center gap-2">
                {Array.from({ length: tPages }).map((_, i) => (
                  <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => t.setPage(i)} className={`gl-dot ${i === t.page ? "is-active" : ""}`} />
                ))}
              </div>
            </>}
          </div>

          <R delay={0.1} className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-y-6 rounded-2xl border border-gray-100 bg-white px-4 py-6 shadow-[0_14px_34px_-24px_rgba(46,16,101,.35)] md:grid-cols-4 md:divide-x md:divide-gray-100">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center justify-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: s.bg }}>
                  <s.icon className="h-4 w-4" style={{ color: s.tint }} />
                </span>
                <div>
                  <div className="gl-h text-[22px] font-extrabold leading-none" style={{ color: s.tint }}>{s.value}</div>
                  <div className="mt-1 text-[12px] text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </R>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="gl-grad relative overflow-hidden py-20">
        <span className="gl-blob-a pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/[0.06]" />
        <span className="gl-blob-b pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-white/[0.05]" />
        <span className="gl-dots pointer-events-none absolute left-6 top-8 h-14 w-16 text-white/25" />
        <span className="gl-dots pointer-events-none absolute right-6 top-24 h-14 w-16 text-white/25" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <R className="mx-auto max-w-2xl text-center">
            <Kicker icon={Star} dark>Why choose us</Kicker>
            <h2 className="gl-h mt-4 text-3xl font-extrabold text-white md:text-[44px]">
              Why Students Trust <span className="text-violet-200">Gurtron</span>
            </h2>
            <span className="mx-auto mt-4 block h-[3px] w-14 rounded-full bg-white/60" />
            <p className="mt-4 text-[15px] text-violet-100/90">Smart practice, instant help and real exam experience — everything you need to score better.</p>
          </R>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {WHY.map((w, i) => (
              <R key={w.n} delay={0.1 + i * 0.12} y={26}>
                <article className="gl-tilt h-full rounded-[20px] bg-white p-7 shadow-[0_24px_50px_-24px_rgba(15,5,40,.6)]"
                  style={{ transform: `rotate(${[-2, 0, 2][i]}deg)` }}>
                  <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full" style={{ background: w.bg }}>
                    <w.icon className="h-10 w-10" style={{ color: w.tint }} />
                  </span>
                  <div className="mt-6 flex items-start gap-3">
                    <span className="gl-h rounded-lg px-2 py-1 text-[13px] font-bold" style={{ background: w.bg, color: w.tint }}>{w.n}</span>
                    <h3 className="gl-h text-[18px] font-bold leading-snug">{w.title}</h3>
                  </div>
                  <span className="mt-4 block h-[3px] w-10 rounded-full" style={{ background: w.tint }} />
                  <p className="mt-4 text-[14px] leading-relaxed" style={muted}>{w.desc}</p>
                </article>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ── REFER & EARN ── */}
      <section id="referral" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTitle kicker="Refer & Earn" icon={Gift} title="Invite Friends," accent="Earn Rewards"
            sub="Teachers earn cash commission, students earn coins and free Premium." />
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {REFERRAL_TIERS.map((r, i) => (
              <R key={r.who} delay={0.1 + i * 0.12} y={26}>
                <div className="gl-lift h-full rounded-[20px] border border-gray-100 bg-white p-6 shadow-[0_14px_34px_-24px_rgba(46,16,101,.35)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50"><r.icon className="h-5 w-5 text-violet-600" /></span>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700">{r.who}</span>
                  </div>
                  <h3 className="gl-h mt-5 text-[20px] font-bold">{r.headline}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed" style={muted}>{r.desc}</p>
                  <div className="mt-4 rounded-lg bg-[#faf9ff] px-3 py-2 text-[13px] font-semibold text-violet-700">{r.example}</div>
                </div>
              </R>
            ))}
          </div>
          <R delay={0.1} className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[13px] font-semibold text-gray-700">
            {REFERRAL_STEPS.map((s, i) => (
              <span key={s.title} className="flex items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2">
                  <s.icon className="h-4 w-4 text-violet-600" /> {i + 1}. {s.title}
                </span>
                {i < REFERRAL_STEPS.length - 1 && <ArrowRight className="h-4 w-4 text-violet-300" />}
              </span>
            ))}
          </R>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-[#faf9ff] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionTitle kicker="FAQ" icon={MessageCircle} title="Questions?" accent="Answered." />
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <R key={f.q} delay={i * 0.06}>
                  <div className="rounded-2xl border border-gray-100 bg-white">
                    <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                      <span className="text-[15px] font-semibold">{f.q}</span>
                      <ChevronDown className={`h-5 w-5 shrink-0 text-violet-600 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`gl-faq-body ${open ? "is-open" : ""}`}>
                      <div><p className="px-5 pb-4 text-[14px] leading-relaxed" style={muted}>{f.a}</p></div>
                    </div>
                  </div>
                </R>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden bg-[#fbfaff]">
        <span className="gl-blob-a pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#f0ecfd]" />
        <span className="gl-blob-b pointer-events-none absolute -right-28 -top-10 h-96 w-96 rounded-full bg-[#f5f2fe]" />
        <span className="gl-dots pointer-events-none absolute left-6 top-8 h-12 w-12 text-violet-200" />
        <span className="gl-dots pointer-events-none absolute bottom-8 right-6 h-12 w-12 text-violet-200" />
        <Spark className="absolute right-[8%] top-[18%] h-5 w-5 text-violet-500" />
        <Spark className="absolute bottom-[18%] left-[6%] h-3.5 w-3.5 text-violet-400" delay={1.5} />
        <span className="gl-twinkle absolute right-[12%] top-[34%] hidden h-3.5 w-3.5 rounded-full border-2 border-violet-200 md:block" style={{ animationDelay: ".8s" }} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20 lg:px-8">
          <div>
            <R><span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-violet-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100"><Sparkles className="h-3.5 w-3.5" /></span>
              Challenge yourself
            </span></R>
            <R delay={0.09}>
              <h2 className="gl-h mt-4 text-4xl font-extrabold leading-[1.1] md:text-[52px]">
                Ready to Test<br />Your <span className="gl-grad-text">Knowledge?</span>
              </h2>
            </R>
            <R delay={0.18}><p className="mt-4 max-w-sm text-[15px]" style={muted}>Take a test, track your progress and step closer to your goal.</p></R>
            <R delay={0.27}>
              <div className="relative mt-8 inline-block">
                <span className="gl-ring" aria-hidden />
                <a href="/onboarding" className="gl-grad group relative inline-flex items-center gap-4 rounded-full py-3 pl-6 pr-3 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(76,29,149,.7)]">
                  Explore the Tests
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><ArrowRight className="gl-arrow h-4 w-4 text-violet-700" /></span>
                </a>
              </div>
            </R>
          </div>
          <R delay={0.1} y={0} scale={0.94} className="flex justify-center md:order-2">
            <div className="gl-float relative" aria-hidden>
              <div className="gl-grad flex h-56 w-44 flex-col gap-3 rounded-[26px] p-5 shadow-[0_30px_50px_-20px_rgba(76,29,149,.7)]">
                <span className="mx-auto -mt-8 h-7 w-16 rounded-lg bg-[#1e0b47]" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/95 p-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600"><CheckCircle2 className="h-4 w-4 text-white" /></span>
                    <span className="h-2 flex-1 rounded-full bg-violet-200" />
                  </div>
                ))}
              </div>
              <span className="absolute -bottom-6 -right-12 flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-[#1e0b47] bg-white shadow-xl">
                <Timer className="h-10 w-10 text-violet-700" />
              </span>
            </div>
          </R>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0d0826] text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Logo light />
              <p className="mt-4 text-[14px] leading-relaxed text-gray-400">AI-powered exam preparation for Class 1–12, JEE, NEET and Olympiads.</p>
            </div>
            {[
              { h: "Platform", links: [["Start on Web", "/onboarding"], ["For Teachers", "/teachers"], ["For Schools", "/schools"], ["Exams", "/exams"]] },
              { h: "Explore", links: [["Features", "#features"], ["Pricing", "#pricing"], ["Refer & Earn", "#referral"], ["FAQ", "#faq"]] },
            ].map((col) => (
              <div key={col.h}>
                <h4 className="text-[16px] font-bold">{col.h}</h4>
                <span className="gl-grad mt-2 block h-[3px] w-10 rounded-full" />
                <ul className="mt-4 space-y-1">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="group flex items-center justify-between border-b border-white/5 py-2 text-[14px] text-gray-300 transition-colors hover:text-violet-300">
                        {label} <ChevronRight className="gl-arrow h-4 w-4 text-gray-500" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h4 className="text-[16px] font-bold">Get the App</h4>
              <span className="gl-grad mt-2 block h-[3px] w-10 rounded-full" />
              <p className="mt-4 text-[14px] text-gray-400">Practice anytime, anywhere.</p>
              <a href="#" className="mt-3 inline-flex items-center gap-2.5 rounded-lg border border-white/30 bg-black px-4 py-2 transition-colors hover:border-white/60">
                <Play className="h-5 w-5 fill-white text-white" />
                <span className="leading-none"><span className="block text-[9px] uppercase text-gray-300">Get it on</span><span className="text-[15px] font-semibold">Google Play</span></span>
              </a>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-6 text-center text-[13px] text-gray-500">
            © {new Date().getFullYear()} Gurtron. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
