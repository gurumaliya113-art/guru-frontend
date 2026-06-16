import { useState } from "react";
import {
  Zap,
  FileText,
  Monitor,
  ClipboardList,
  LayoutGrid,
  Shuffle,
  Star,
  Globe,
  Smartphone,
  Play,
  Brain,
  CheckSquare,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Users,
  TrendingUp,
  Award,
  Building2,
  CheckCircle,
} from "lucide-react";
import "../teachers.css";

/* ─────────────── Design tokens ─────────────── */
const GOLD = "#EEB32B";
const BG = "#040718";
const CARD = "#0c1129";
const BORDER = "rgba(238,179,43,0.18)";
const CREAM = "#f7f4ee";

/* ─────────────── Data ─────────────── */
const NAV_LINKS = [
  { label: "For Students", href: "/landing" },
  { label: "For Teachers", href: "/teachers" },
  { label: "For Schools", href: "/schools" },
  { label: "Exams", href: "#exams" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

// Screenshot 1 — interactive feature list
const PREVIEW_FEATURES = [
  {
    icon: Brain,
    tag: "FEATURE",
    title: "AI Question Paper Builder",
    desc: "Generate complete Question Papers with Solutions and Answer Keys as polished PDFs — in one click, branded with your institute.",
  },
  {
    icon: Monitor,
    tag: "FEATURE",
    title: "Digital Board Presentations",
    desc: "Auto-create slide decks from your question bank — one question per slide, ready for class projection or digital boards.",
  },
  {
    icon: ClipboardList,
    tag: "FEATURE",
    title: "Live Assessment Mode",
    desc: "Launch real-time assessments with timer, live leaderboard and instant per-student performance reports.",
  },
  {
    icon: LayoutGrid,
    tag: "FEATURE",
    title: "3 Powerful Modes",
    desc: "Practice, Assignment, or Live Exam — choose the mode that fits your classroom moment, anytime.",
  },
];

// Screenshot 2 — 6 feature cards
const FEATURE_CARDS = [
  {
    icon: FileText,
    title: "Smart Paper Export",
    desc: "Print-ready Question Papers, Solutions and Answer Keys — fully branded with your institute logo, exported in seconds.",
  },
  {
    icon: ClipboardList,
    title: "Live Assessments",
    desc: "Real exam interface with countdown timer, OMR-style palette and live performance tracking for every student.",
  },
  {
    icon: Monitor,
    title: "Slide Deck Generator",
    desc: "Classroom-ready presentations built from your question bank — auto-formatted, one question per slide.",
  },
  {
    icon: CheckSquare,
    title: "Chapter-wise Curation",
    desc: "Pick questions precisely by chapter, topic, difficulty and type — surgical control for every class test you design.",
  },
  {
    icon: Shuffle,
    title: "One-Click Paper Builder",
    desc: "Set your filters and let Gurtron assemble a balanced, non-repeating paper instantly — zero manual effort.",
  },
  {
    icon: Star,
    title: "Pre-built Templates",
    desc: "Exam-pattern-accurate templates crafted by expert educators — ready to deploy for JEE, NEET, UPSC and more.",
  },
];

const EXAMS = [
  "JEE Main", "JEE Advanced", "NEET", "UPSC", "SSC CGL",
  "GATE", "CAT", "Class 10 Board", "Class 12 Board", "NDA",
];

const HERO_STATS = [
  { value: "3", label: "Modes", sub: "Assessment Types" },
  { value: "10+", label: "Exams Covered" },
  { value: "Live", label: "Online Mode" },
  { value: "4.8★", label: "Play Store" },
];

const SCHOOLS_FEATURES = [
  { icon: Users, label: "Bulk Teacher Onboarding" },
  { icon: ClipboardList, label: "Custom Exam Sets" },
  { icon: TrendingUp, label: "Institution Analytics" },
  { icon: Award, label: "Institute Branding" },
];

const FAQS = [
  {
    q: "What is Gurtron for Teachers?",
    a: "Gurtron for Teachers is an AI-powered platform that lets educators build question papers, launch live assessments, generate slide decks, and track student performance — all in one place.",
  },
  {
    q: "Which exams does Gurtron support for paper creation?",
    a: "We support JEE Main, JEE Advanced, NEET, UPSC, SSC CGL, GATE, CAT, Class 10 & 12 Boards, and NDA. More boards and competitive exams are being added regularly.",
  },
  {
    q: "How does the Live Assessment work?",
    a: "Create a test, share a Session Code or invite link with your students. They join instantly on Gurtron's app or web — you see live progress, scores, and analysis the moment they finish.",
  },
  {
    q: "Is there an iOS version?",
    a: "Currently Gurtron is available on the web and Google Play Store. iOS support is in progress — stay tuned!",
  },
  {
    q: "Can my entire school use Gurtron under one account?",
    a: "Yes — Gurtron for Schools lets you onboard all teachers, manage tests centrally, apply institute branding, and access school-wide analytics. Contact us for a demo.",
  },
];

/* ─────────────── Phone Mockup Shell ─────────────── */
function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 230, height: 460 }}>
      <div
        className="absolute inset-0 rounded-[2.5rem] border-[6px]"
        style={{
          borderColor: "rgba(238,179,43,0.45)",
          background: "#080d20",
          boxShadow: `0 0 70px rgba(238,179,43,0.18), 0 30px 70px rgba(0,0,0,0.65)`,
        }}
      />
      {/* Notch */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full z-10"
        style={{ background: BG }}
      />
      {/* Screen */}
      <div className="absolute inset-[6px] rounded-[2rem] overflow-hidden" style={{ background: CARD }}>
        {children}
      </div>
    </div>
  );
}

/* Teacher app screen content inside phone */
function TeacherAppScreen() {
  return (
    <div className="w-full h-full p-3 flex flex-col gap-2 overflow-hidden pt-8">
      {/* Header */}
      <div
        className="rounded-xl p-2.5 flex items-center gap-2"
        style={{ background: "rgba(238,179,43,0.1)", border: `1px solid ${BORDER}` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: GOLD }}
        >
          <Zap className="w-3.5 h-3.5" style={{ color: BG }} />
        </div>
        <div>
          <div className="font-black text-white" style={{ fontSize: 10, fontFamily: "'Outfit', sans-serif" }}>
            GURTRON
          </div>
          <div style={{ fontSize: 8, color: GOLD }}>For Teachers</div>
        </div>
      </div>

      <div style={{ fontSize: 9, color: "#8b95b0", fontWeight: 700 }}>Institute</div>
      {["DPS Vasant Kunj", "Ryan International", "Kendriya Vidyalaya"].map((s) => (
        <div
          key={s}
          className="rounded-lg px-2 py-1.5 flex items-center gap-1.5"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
          <span className="text-white font-semibold" style={{ fontSize: 9 }}>{s}</span>
        </div>
      ))}

      <div style={{ fontSize: 9, color: "#8b95b0", fontWeight: 700 }}>Select Exam</div>
      <div className="flex gap-1 flex-wrap">
        {["NEET", "JEE", "UPSC", "SSC"].map((e, i) => (
          <span
            key={e}
            className="rounded px-1.5 py-0.5 font-bold"
            style={{
              background: i === 0 ? GOLD : "rgba(238,179,43,0.12)",
              color: i === 0 ? BG : GOLD,
              fontSize: 8,
            }}
          >
            {e}
          </span>
        ))}
      </div>

      {["AI Question Paper", "Live Assessment", "Slide Deck"].map((a, i) => (
        <div
          key={a}
          className="rounded-lg px-2 py-1.5"
          style={{
            background: i === 0 ? "rgba(238,179,43,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${i === 0 ? GOLD : BORDER}`,
          }}
        >
          <div className="font-bold" style={{ fontSize: 8, color: i === 0 ? GOLD : "#cbd5e1" }}>{a}</div>
        </div>
      ))}

      {/* Session code */}
      <div
        className="mt-auto rounded-xl px-3 py-2 flex items-center justify-between"
        style={{ background: "rgba(238,179,43,0.08)", border: `1px solid ${GOLD}` }}
      >
        <span style={{ fontSize: 8, color: "#8b95b0" }}>Session Code</span>
        <span className="font-black" style={{ fontSize: 12, color: GOLD, fontFamily: "'Outfit', sans-serif" }}>GT7X9</span>
      </div>
    </div>
  );
}

/* ─────────────── Main App ─────────────── */
export default function Teachers() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeExam, setActiveExam] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ fontFamily: "'Nunito Sans', sans-serif", background: BG, color: "#fff" }}
    >

      {/* ══════════ NAVBAR ══════════ */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(4,7,24,0.93)", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/landing" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD }}>
              <Zap className="w-4 h-4" style={{ color: BG }} />
            </div>
            <span className="text-xl font-black tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Gurtron
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-semibold transition-colors"
                style={{ color: "#8b95b0" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8b95b0")}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
              <a href="/onboarding" className="text-sm font-semibold transition-colors" style={{ color: GOLD }}>
              Web Login
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full hover:scale-105 transition-transform"
              style={{ background: GOLD, color: BG }}
            >
              <Smartphone className="w-3.5 h-3.5" /> Get on Play Store
            </a>
          </div>

          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: "#8b95b0" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden px-4 py-4 flex flex-col gap-3" style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-semibold py-1" style={{ color: "#cbd5e1" }} onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <a href="/onboarding" className="text-sm font-semibold text-center py-2" style={{ color: GOLD }}>Web Login</a>
              <a href="#" className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-full" style={{ background: GOLD, color: BG }}>
                <Smartphone className="w-4 h-4" /> Get on Play Store
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ══════════ HERO — Screenshot 3 layout ══════════ */}
      <section
        id="teachers"
        className="relative overflow-hidden py-20 md:py-28"
        style={{ background: CREAM }}
      >
        {/* Gold glow top-right */}
        <div
          className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full blur-[130px] opacity-25 pointer-events-none"
          style={{ background: GOLD }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5 border"
                style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.08)" }}
              >
                For Teachers &amp; Coaching Institutes
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5"
                style={{ fontFamily: "'Outfit', sans-serif", color: "#0f0a2e" }}
              >
                Conduct{" "}
                <span style={{ color: GOLD }}>Live Online</span>
                <br />
                Assessments
                <br />
                <span style={{ color: "#0f0a2e" }}>in Minutes</span>
              </h1>
              <p className="text-slate-500 mb-8 leading-relaxed text-lg">
                Build a JEE, NEET or Board test, share a{" "}
                <strong className="text-slate-700">Session Code or invite link</strong>, and let students
                attempt it instantly on Gurtron — web or app.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <a
                  href="#"
                  className="flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform"
                  style={{ background: GOLD, color: BG }}
                >
                  <Play className="w-4 h-4" style={{ fill: BG }} /> Get on Play Store
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full border hover:scale-105 transition-transform"
                  style={{ border: "1.5px solid rgba(0,0,0,0.15)", color: "#0f0a2e", background: "rgba(0,0,0,0.04)" }}
                >
                  <Globe className="w-4 h-4" /> Try on Web
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {HERO_STATS.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-black" style={{ fontFamily: "'Outfit', sans-serif", color: "#0f0a2e" }}>
                      {s.value}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 leading-tight">{s.label}</div>
                    {s.sub && <div className="text-slate-400" style={{ fontSize: 9 }}>{s.sub}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — phone */}
            <div className="flex justify-center md:justify-end relative">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-25 pointer-events-none"
                style={{ background: GOLD, transform: "scale(0.55)" }}
              />
              <PhoneMockup>
                <TeacherAppScreen />
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TICKER ══════════ */}
      <div
        className="py-3 overflow-hidden"
        style={{ background: "rgba(238,179,43,0.08)", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
      >
        <div
          className="flex gap-12 text-sm font-bold whitespace-nowrap"
          style={{ animation: "marquee 20s linear infinite", color: GOLD }}
        >
          {[...Array(3)].map((_, i) =>
            EXAMS.map((e) => <span key={`${i}-${e}`} className="shrink-0">✦ {e}</span>)
          )}
        </div>
        <style>{`@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-33.33%)} }`}</style>
      </div>

      {/* ══════════ SEE GURTRON IN ACTION — Screenshot 1 layout ══════════ */}
      <section id="features" className="py-20 md:py-28" style={{ background: CREAM }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-4 border"
              style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.08)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
              APP PREVIEW
            </span>
            <h2
              className="text-4xl md:text-5xl font-black leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif", color: "#0f0a2e" }}
            >
              See <span style={{ color: GOLD }}>Gurtron</span> in action
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Every screen built for efficient, distraction-free class management. Click a feature to
              see it reflected live on the phone preview.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Feature list */}
            <div className="flex flex-col gap-3">
              {PREVIEW_FEATURES.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => setActiveFeature(i)}
                  className="text-left rounded-2xl border transition-all"
                  style={{
                    background: activeFeature === i ? "#fff" : "rgba(255,255,255,0.55)",
                    borderColor: activeFeature === i ? "rgba(238,179,43,0.5)" : "rgba(0,0,0,0.08)",
                    boxShadow: activeFeature === i ? "0 4px 28px rgba(238,179,43,0.13)" : "none",
                    padding: activeFeature === i ? "20px" : "14px 20px",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: activeFeature === i ? "rgba(238,179,43,0.12)" : "rgba(0,0,0,0.05)",
                        color: activeFeature === i ? GOLD : "#888",
                      }}
                    >
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div
                        className="text-xs font-bold uppercase tracking-wider mb-0.5"
                        style={{ color: activeFeature === i ? GOLD : "#aaa" }}
                      >
                        {f.tag}
                      </div>
                      <div className="font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif", color: "#0f0a2e" }}>
                        {f.title}
                      </div>
                      {activeFeature === i && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{f.desc}</p>
                      )}
                    </div>
                    <div
                      className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-sm font-black"
                      style={{
                        borderColor: activeFeature === i ? GOLD : "rgba(0,0,0,0.1)",
                        color: activeFeature === i ? GOLD : "#ccc",
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      0{i + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Phone */}
            <div className="flex justify-center">
              <PhoneMockup>
                <TeacherAppScreen />
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ EVERYTHING YOU NEED — Screenshot 2 layout ══════════ */}
      <section
        className="py-20 md:py-28"
        style={{ background: `linear-gradient(160deg, ${BG} 0%, ${CARD} 50%, ${BG} 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2
              className="text-4xl md:text-6xl font-black text-white leading-tight mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Everything You Need
              <br />
              to <span style={{ color: GOLD }}>Run Class Tests</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Skip the late-night formatting and manual copy-paste. Gurtron converts your question
              bank into branded papers, live assessments and slide decks — ready before the bell rings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl p-7 border transition-all hover:-translate-y-1 group cursor-default"
                style={{ background: CARD, borderColor: BORDER }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 32px rgba(238,179,43,0.13)`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(238,179,43,0.1)" }}
                >
                  <card.icon className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <h3 className="font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8b95b0" }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ EXAMS COVERED ══════════ */}
      <section id="exams" className="py-20 md:py-24" style={{ background: CREAM }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span
            className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border"
            style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.08)" }}
          >
            Exams We Support
          </span>
          <h2
            className="text-3xl md:text-4xl font-black mb-3"
            style={{ fontFamily: "'Outfit', sans-serif", color: "#0f0a2e" }}
          >
            10+ Competitive Exams
          </h2>
          <p className="mb-10 text-slate-500">Click an exam to explore Gurtron's question bank for it.</p>

          <div className="flex flex-wrap gap-3 justify-center">
            {EXAMS.map((exam) => (
              <button
                key={exam}
                onClick={() => setActiveExam(activeExam === exam ? null : exam)}
                className="px-5 py-2.5 rounded-full text-sm font-bold border transition-all hover:scale-105"
                style={
                  activeExam === exam
                    ? { background: GOLD, color: BG, borderColor: GOLD }
                    : { background: "rgba(238,179,43,0.07)", color: "#0f0a2e", borderColor: "rgba(238,179,43,0.3)" }
                }
              >
                {exam}
              </button>
            ))}
          </div>

          {activeExam && (
            <div
              className="mt-8 rounded-3xl p-8 max-w-xl mx-auto border"
              style={{ background: BG, borderColor: GOLD, boxShadow: `0 0 40px rgba(238,179,43,0.15)` }}
            >
              <div className="text-2xl font-black mb-2" style={{ fontFamily: "'Outfit', sans-serif", color: GOLD }}>
                {activeExam}
              </div>
              <p className="text-sm mb-5" style={{ color: "#8b95b0" }}>
                Build question papers, run live tests and generate slide decks for {activeExam} — instantly.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full hover:scale-105 transition-transform"
                style={{ background: GOLD, color: BG }}
              >
                Start Building Papers <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ══════════ FOR SCHOOLS ══════════ */}
      <section
        id="schools"
        className="py-20 md:py-28"
        style={{ background: BG }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-8 md:p-12 border"
            style={{
              background: "rgba(238,179,43,0.04)",
              borderColor: GOLD,
              boxShadow: `0 0 60px rgba(238,179,43,0.08)`,
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-10">
              <div className="flex-1">
                <span
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 border"
                  style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.1)" }}
                >
                  For Schools &amp; Institutions
                </span>
                <h2
                  className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Bring Gurtron to
                  <br />
                  <span style={{ color: GOLD }}>Your Entire School</span>
                </h2>
                <p className="text-sm leading-relaxed mb-7 max-w-lg" style={{ color: "#8b95b0" }}>
                  Give every teacher in your institution AI-powered assessment tools under one roof.
                  Central dashboard, custom branding, bulk onboarding — no chaos, just results.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {SCHOOLS_FEATURES.map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center text-center gap-2 rounded-2xl p-3 border"
                      style={{ background: "rgba(238,179,43,0.06)", borderColor: BORDER }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: GOLD }} />
                      <span className="text-xs font-semibold" style={{ color: "#cbd5e1", fontSize: 11 }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <ul className="space-y-2 mb-6">
                  {[
                    "School-wide performance analytics in one dashboard",
                    "All papers branded with your institute's logo",
                    "Dedicated account manager & priority support",
                  ].map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm" style={{ color: "#cbd5e1" }}>
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shrink-0 flex flex-col gap-3">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-full hover:scale-105 transition-transform justify-center"
                  style={{ background: GOLD, color: BG }}
                >
                  <Building2 className="w-4 h-4" /> Partner with Us
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-full border hover:scale-105 transition-transform justify-center text-sm"
                  style={{ borderColor: BORDER, color: "#fff", background: "rgba(255,255,255,0.04)" }}
                >
                  Request a Demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" className="py-20 md:py-28" style={{ background: CARD }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border"
              style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}
            >
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Got Questions?
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden"
                style={{ background: BG, borderColor: openFaq === i ? GOLD : BORDER }}
              >
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-sm text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    style={{ color: GOLD }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm leading-relaxed pt-4" style={{ color: "#8b95b0", borderTop: `1px solid ${BORDER}` }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: BG }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[280px] rounded-full blur-[120px] opacity-20" style={{ background: GOLD }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2
            className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Start Teaching Smarter
            <br />
            <span style={{ color: GOLD }}>with Gurtron Today</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: "#8b95b0" }}>
            Available on Web &amp; Google Play Store · India ka #1 AI Teaching Platform
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#"
              className="flex items-center gap-2 font-bold text-base px-8 py-4 rounded-full hover:scale-105 transition-transform"
              style={{ background: GOLD, color: BG }}
            >
              <Globe className="w-5 h-5" /> Start on Web Now
            </a>
            <a
              href="#"
              className="flex items-center gap-2 font-bold text-base px-8 py-4 rounded-full border hover:scale-105 transition-all"
              style={{ border: `1.5px solid ${BORDER}`, color: "#fff", background: "rgba(255,255,255,0.05)" }}
            >
              <Play className="w-4 h-4" style={{ fill: GOLD, color: GOLD }} /> Download on Play Store
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="py-12" style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD }}>
                  <Zap className="w-4 h-4" style={{ color: BG }} />
                </div>
                <span className="text-xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Gurtron</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#8b95b0" }}>
                India's most powerful AI assessment platform for teachers and institutions.
              </p>
            </div>

            {[
              { heading: "Platform", links: ["Web App", "Android App", "AI Paper Builder", "Live Assessments"] },
              { heading: "Exams", links: ["JEE", "NEET", "UPSC", "SSC CGL", "GATE"] },
              { heading: "Company", links: ["About Us", "Careers", "Blog", "Contact", "Privacy Policy"] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-white font-bold text-sm mb-3">{col.heading}</h4>
                <ul className="space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        style={{ color: "#8b95b0" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#8b95b0")}
                        className="transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{ borderTop: `1px solid ${BORDER}`, color: "#8b95b0" }}
          >
            <span>© 2024 Gurtron. All rights reserved. Made with ❤️ in India.</span>
            <span>Available on Web &amp; Google Play Store</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
