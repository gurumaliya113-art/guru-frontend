import { useState } from "react";
import {
  Brain,
  BookOpen,
  Zap,
  FileText,
  ClipboardList,
  Star,
  ChevronDown,
  Menu,
  X,
  CheckCircle,
  ArrowRight,
  Play,
  MessageCircle,
  TrendingUp,
  Award,
  Users,
  Globe,
  Smartphone,
  Layers,
  Target,
} from "lucide-react";
import "../landing.css";

const NAV_LINKS = [
  { label: "For Students", href: "#students" },
  { label: "For Teachers", href: "/teachers" },
  { label: "For Schools", href: "/schools" },
  { label: "Exams", href: "#exams" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Doubt Solving",
    desc: "Ask any question — get instant, step-by-step explanations powered by AI. Works 24/7, never judges, always patient.",
    badge: "AI Powered",
  },
  {
    icon: Layers,
    title: "Smart Flashcards",
    desc: "Auto-generated flashcards from your notes and syllabus. Spaced repetition ensures you remember what matters most.",
    badge: "Adaptive",
  },
  {
    icon: FileText,
    title: "Revision Notes",
    desc: "Crisp, exam-ready notes for every chapter. Curated by toppers, updated regularly, available offline.",
    badge: "Updated",
  },
  {
    icon: ClipboardList,
    title: "Mock Tests",
    desc: "Full-length, timed mock tests with real exam patterns. Detailed analysis tells you exactly where to improve.",
    badge: "1000+ Tests",
  },
  {
    icon: Target,
    title: "Practice by Topic",
    desc: "Drill individual topics with 50,000+ questions categorized by difficulty. From basics to advanced.",
    badge: "50K+ Qs",
  },
  {
    icon: TrendingUp,
    title: "Performance Tracker",
    desc: "Visual graphs of your progress over time. Know your weak spots, celebrate your growth.",
    badge: "Analytics",
  },
];

const EXAMS = [
  "JEE Main", "JEE Advanced", "NEET", "UPSC", "SSC CGL",
  "GATE", "CAT", "Class 10 Board", "Class 12 Board", "NDA",
];

const STATS = [
  { value: "50K+", label: "Questions", icon: BookOpen },
  { value: "10+", label: "Exams Covered", icon: ClipboardList },
  { value: "Free*", label: "To Start", icon: Star },
  { value: "4.8★", label: "Play Store", icon: Award },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    exam: "JEE Main 2024",
    score: "99.2 percentile",
    text: "Gurtron's AI doubt solver saved me hours every day. I could get answers to complex physics problems at 2 AM without waiting for anyone!",
    avatar: "PS",
  },
  {
    name: "Rohan Mehta",
    exam: "NEET 2024",
    score: "680 / 720",
    text: "The flashcards are insane — I revised all of Biology in just 3 days before my exam. The spaced repetition actually works.",
    avatar: "RM",
  },
  {
    name: "Ananya Singh",
    exam: "UPSC Prelims",
    score: "Cleared",
    text: "Best revision notes I found anywhere. Concise, accurate, and they cover everything in the syllabus. Gurtron is a game changer.",
    avatar: "AS",
  },
];

const FAQS = [
  {
    q: "Is Gurtron free to use?",
    a: "Gurtron is currently in its initial phase with basic features accessible to get started. Pricing details for premium features will be announced soon — stay tuned!",
  },
  {
    q: "Which exams does Gurtron cover?",
    a: "We currently cover JEE Main, JEE Advanced, NEET, UPSC, SSC CGL, GATE, CAT, Class 10 & 12 Board exams, and NDA. More coming soon.",
  },
  {
    q: "Is there an iOS / App Store version?",
    a: "Currently Gurtron is available on the web and Google Play Store. We are working on the iOS version — stay tuned!",
  },
  {
    q: "How does AI Doubt Solving work?",
    a: "Simply type or upload a photo of your doubt. Our AI instantly gives you a clear, step-by-step explanation tailored to your level and exam.",
  },
  {
    q: "Can teachers use Gurtron?",
    a: "Absolutely. Teachers can assign practice tests, track student performance, and share revision notes. A dedicated teacher dashboard is rolling out soon.",
  },
];

const GOLD = "#EEB32B";
const BG = "#040718";
const CARD = "#0c1129";
const BORDER = "rgba(238,179,43,0.18)";

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeExam, setActiveExam] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ fontFamily: "'Nunito Sans', sans-serif", background: BG, color: "#fff" }}
    >
      {/* ── NAVBAR ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(4,7,24,0.92)", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/landing" className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
              style={{ background: GOLD }}
            >
              <Zap className="w-4 h-4" style={{ color: BG }} />
            </div>
            <span
              className="text-xl font-black tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif", color: "#fff" }}
            >
              Gurtron
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
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

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
              <a
                href="/onboarding"
                className="text-sm font-semibold transition-colors bg-transparent"
                style={{ color: GOLD }}
              >
                Web Login
              </a>
            <a
              href="#"
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full shadow hover:scale-105 transition-transform"
              style={{ background: GOLD, color: BG }}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Get on Play Store
            </a>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: "#8b95b0" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            className="md:hidden px-4 py-4 flex flex-col gap-3"
            style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-semibold py-1"
                style={{ color: "#cbd5e1" }}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <a href="/onboarding" className="text-sm font-semibold text-center py-2" style={{ color: GOLD }} onClick={() => setMobileOpen(false)}>
                Web Login
              </a>
              <a
                href="#"
                className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-full"
                style={{ background: GOLD, color: BG }}
              >
                <Smartphone className="w-4 h-4" />
                Get on Play Store
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-24 md:py-36">
        {/* Glow blobs */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-25 pointer-events-none"
          style={{ background: GOLD }}
        />
        <div
          className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full blur-[100px] opacity-10 pointer-events-none"
          style={{ background: "#fff" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border"
            style={{ borderColor: BORDER, color: GOLD, background: "rgba(238,179,43,0.08)" }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOLD }} />
            Empowering India's Future Doctors, Engineers & Leaders
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6"
            style={{ fontFamily: "'Outfit', sans-serif", color: "#fff" }}
          >
            India's Most{" "}
            <span style={{ color: GOLD }}>Powerful AI</span>
            <br />
            Learning Platform
          </h1>

          <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#8b95b0" }}>
            AI Doubt Solving · Smart Flashcards · Revision Notes · Mock Tests
            <br className="hidden sm:block" />
            <span className="font-bold" style={{ color: "#fff" }}>Ek app, poori taiyari — ab India ka baari.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="/onboarding"
              className="flex items-center gap-2 font-bold text-base px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-transform"
              style={{ background: GOLD, color: BG }}
            >
              <Globe className="w-5 h-5" />
              Try on Web Now
            </a>
            <a
              href="#"
              className="flex items-center gap-2 font-bold text-base px-8 py-4 rounded-full border hover:scale-105 transition-transform"
              style={{ border: `1.5px solid ${BORDER}`, color: "#fff", background: "rgba(255,255,255,0.05)" }}
            >
              <Play className="w-4 h-4" style={{ fill: GOLD, color: GOLD }} />
              Download on Play Store
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl py-5 px-3 text-center border"
                style={{ background: CARD, borderColor: BORDER }}
              >
                <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: GOLD }} />
                <div
                  className="text-2xl font-black"
                  style={{ fontFamily: "'Outfit', sans-serif", color: GOLD }}
                >
                  {s.value}
                </div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: "#8b95b0" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div
        className="py-3 overflow-hidden border-y"
        style={{ background: "rgba(238,179,43,0.08)", borderColor: BORDER }}
      >
        <div
          className="flex gap-12 text-sm font-bold whitespace-nowrap"
          style={{ animation: "marquee 20s linear infinite", color: GOLD }}
        >
          {[...Array(3)].map((_, i) =>
            EXAMS.map((e) => (
              <span key={`${i}-${e}`} className="shrink-0">✦ {e}</span>
            ))
          )}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }`}</style>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 md:py-28" style={{ background: BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border"
              style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}
            >
              Everything You Need
            </span>
            <h2
              className="text-3xl md:text-5xl font-black mb-4"
              style={{ fontFamily: "'Outfit', sans-serif", color: "#fff" }}
            >
              Study Smarter, Not Harder
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#8b95b0" }}>
              Gurtron brings the power of AI and expert curation into one seamless platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl p-7 border group cursor-default transition-all hover:-translate-y-1"
                style={{
                  background: CARD,
                  borderColor: BORDER,
                  boxShadow: "0 0 0 0 transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = `0 0 32px rgba(238,179,43,0.12)`)
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(238,179,43,0.12)", color: GOLD }}
                  >
                    <f.icon className="w-6 h-6" />
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full border"
                    style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}
                  >
                    {f.badge}
                  </span>
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ fontFamily: "'Outfit', sans-serif", color: "#fff" }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8b95b0" }}>{f.desc}</p>
                <div
                  className="mt-5 flex items-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: GOLD }}
                >
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI DOUBT SOLVING SPOTLIGHT ── */}
      <section
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: CARD }}
      >
        <div
          className="absolute left-0 top-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: GOLD }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider border"
                style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}
              >
                🧠 AI Doubt Solving
              </span>
              <h2
                className="text-3xl md:text-5xl font-black mb-5 leading-tight"
                style={{ fontFamily: "'Outfit', sans-serif", color: "#fff" }}
              >
                Never Get Stuck{" "}
                <span style={{ color: GOLD }}>Again.</span>
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: "#8b95b0" }}>
                Got a doubt at midnight? No problem. Gurtron's AI gives you instant, step-by-step
                solutions with explanations — in Hindi or English, whichever you prefer.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Type or photograph your doubt",
                  "Get detailed, step-by-step explanation",
                  "Ask follow-ups until you truly understand",
                  "Works for Maths, Physics, Chemistry, Biology & more",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#cbd5e1" }}>
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: GOLD }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full transition-all hover:scale-105"
                style={{ background: GOLD, color: BG }}
              >
                Try AI Doubt Solver <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Chat UI */}
            <div
              className="rounded-3xl p-6 border"
              style={{ background: BG, borderColor: BORDER }}
            >
              <div
                className="flex items-center gap-2 mb-5 pb-4"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: GOLD }}
                >
                  <Zap className="w-4 h-4" style={{ color: BG }} />
                </div>
                <span className="font-bold text-sm text-white">Gurtron AI</span>
                <span className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: "#4ade80" }}>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Online
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-end">
                  <div
                    className="text-sm px-4 py-3 rounded-2xl rounded-br-sm max-w-[80%]"
                    style={{ background: "rgba(238,179,43,0.15)", color: "#fff", border: `1px solid ${BORDER}` }}
                  >
                    Why is the time period of a simple pendulum independent of mass?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div
                    className="text-sm px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%] leading-relaxed border"
                    style={{ background: CARD, color: "#cbd5e1", borderColor: BORDER }}
                  >
                    Great question! The formula for time period is:{" "}
                    <strong style={{ color: GOLD }}>T = 2π√(L/g)</strong>
                    <br /><br />
                    Mass (m) doesn't appear because the restoring force <em>mg·sinθ</em> and
                    inertia both scale with m — they cancel out, leaving only{" "}
                    <strong style={{ color: "#4ade80" }}>length (L)</strong> and{" "}
                    <strong style={{ color: "#4ade80" }}>gravity (g)</strong>. 🎯
                  </div>
                </div>
                <div className="flex justify-end">
                  <div
                    className="text-sm px-4 py-3 rounded-2xl rounded-br-sm max-w-[80%] border"
                    style={{ background: "rgba(238,179,43,0.15)", color: "#fff", borderColor: BORDER }}
                  >
                    What if I double the length?
                  </div>
                </div>
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3 border"
                  style={{ background: CARD, borderColor: BORDER }}
                >
                  <MessageCircle className="w-4 h-4" style={{ color: "#8b95b0" }} />
                  <span className="text-sm" style={{ color: "#8b95b0" }}>Ask your doubt...</span>
                  <div
                    className="ml-auto w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: GOLD }}
                  >
                    <ArrowRight className="w-3 h-3" style={{ color: BG }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXAMS COVERED ── */}
      <section id="exams" className="py-20 md:py-24" style={{ background: BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span
            className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border"
            style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}
          >
            Exams We Cover
          </span>
          <h2
            className="text-3xl md:text-4xl font-black mb-3"
            style={{ fontFamily: "'Outfit', sans-serif", color: "#fff" }}
          >
            10+ Competitive Exams
          </h2>
          <p className="mb-10" style={{ color: "#8b95b0" }}>
            Click an exam to explore its content on Gurtron.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {EXAMS.map((exam) => (
              <button
                key={exam}
                onClick={() => setActiveExam(activeExam === exam ? null : exam)}
                className="px-5 py-2.5 rounded-full text-sm font-bold border transition-all hover:scale-105"
                style={
                  activeExam === exam
                    ? { background: GOLD, color: BG, borderColor: GOLD, transform: "scale(1.05)" }
                    : { background: "rgba(238,179,43,0.06)", color: "#fff", borderColor: BORDER }
                }
              >
                {exam}
              </button>
            ))}
          </div>

          {activeExam && (
            <div
              className="mt-8 rounded-3xl p-8 max-w-xl mx-auto border"
              style={{ background: CARD, borderColor: GOLD, boxShadow: `0 0 40px rgba(238,179,43,0.15)` }}
            >
              <div
                className="text-2xl font-black mb-2"
                style={{ fontFamily: "'Outfit', sans-serif", color: GOLD }}
              >
                {activeExam}
              </div>
              <p className="text-sm mb-5" style={{ color: "#8b95b0" }}>
                Study material, mock tests, AI doubt solving and revision notes — all ready for{" "}
                {activeExam}.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full hover:scale-105 transition-transform"
                style={{ background: GOLD, color: BG }}
              >
                Start Preparing <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 md:py-28" style={{ background: CARD }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border"
              style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}
            >
              Student Stories
            </span>
            <h2
              className="text-3xl md:text-5xl font-black"
              style={{ fontFamily: "'Outfit', sans-serif", color: "#fff" }}
            >
              Toppers Love Gurtron
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-3xl p-7 border hover:-translate-y-1 transition-all"
                style={{ background: BG, borderColor: BORDER }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = `0 0 32px rgba(238,179,43,0.10)`)
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" style={{ fill: GOLD, color: GOLD }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "#cbd5e1" }}>
                  "{t.text}"
                </p>
                <div
                  className="flex items-center gap-3 pt-4"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: GOLD, color: BG }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{t.name}</div>
                    <div className="text-xs" style={{ color: "#8b95b0" }}>
                      {t.exam} ·{" "}
                      <span className="font-semibold" style={{ color: GOLD }}>
                        {t.score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVAILABILITY ── */}
      <section className="py-20 md:py-28" id="students" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Web */}
            <div
              className="rounded-3xl p-8 flex flex-col justify-between min-h-[220px] border"
              style={{ background: CARD, borderColor: BORDER }}
            >
              <div>
                <Globe className="w-8 h-8 mb-4" style={{ color: GOLD }} />
                <h3
                  className="text-2xl font-black mb-2 text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Available on Web
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8b95b0" }}>
                  No downloads needed. Open your browser and start studying instantly from any device.
                </p>
              </div>
              <a
                href="#"
                className="mt-6 self-start inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full hover:scale-105 transition-transform"
                style={{ background: GOLD, color: BG }}
              >
                Open Gurtron Web <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Play Store */}
            <div
              className="rounded-3xl p-8 flex flex-col justify-between min-h-[220px] border"
              style={{
                background: "rgba(238,179,43,0.08)",
                borderColor: GOLD,
                boxShadow: `0 0 40px rgba(238,179,43,0.08)`,
              }}
            >
              <div>
                <Smartphone className="w-8 h-8 mb-4" style={{ color: GOLD }} />
                <h3
                  className="text-2xl font-black mb-2 text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Available on Play Store
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8b95b0" }}>
                  Download the Gurtron app on Android for offline access, notifications, and a native
                  experience.
                </p>
              </div>
              <a
                href="#"
                className="mt-6 self-start inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full hover:scale-105 transition-transform"
                style={{ background: GOLD, color: BG }}
              >
                <Play className="w-3.5 h-3.5" style={{ fill: BG }} /> Get on Play Store
              </a>
            </div>
          </div>

          {/* For Teachers */}
          <div
            id="teachers"
            className="mt-6 rounded-3xl p-8 border"
            style={{ background: CARD, borderColor: BORDER }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <span
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 border"
                  style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}
                >
                  For Teachers
                </span>
                <h3
                  className="text-2xl font-black mb-2 text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Empower Your Classroom with Gurtron
                </h3>
                <p className="text-sm leading-relaxed max-w-xl" style={{ color: "#8b95b0" }}>
                  Assign tests, track student progress, share custom revision notes, and let AI handle
                  doubt resolution — so you can focus on teaching.
                </p>
              </div>
              <div className="shrink-0">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full transition-all hover:scale-105"
                  style={{ background: GOLD, color: BG }}
                >
                  <Users className="w-4 h-4" /> Teacher Dashboard
                </a>
              </div>
            </div>
          </div>

          {/* For Schools */}
          <div
            id="schools"
            className="mt-6 rounded-3xl p-8 border"
            style={{
              background: "rgba(238,179,43,0.05)",
              borderColor: GOLD,
              boxShadow: `0 0 48px rgba(238,179,43,0.07)`,
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <span
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 border"
                  style={{ color: GOLD, borderColor: GOLD, background: "rgba(238,179,43,0.12)" }}
                >
                  For Schools
                </span>
                <h3
                  className="text-2xl font-black mb-2 text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Bring Gurtron to Your Entire School
                </h3>
                <p className="text-sm leading-relaxed max-w-xl mb-5" style={{ color: "#8b95b0" }}>
                  Partner with Gurtron to give every student in your institution access to AI-powered
                  learning. Get a school-wide dashboard, bulk student management, custom exam sets,
                  and detailed performance reports — all under your school's brand.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Users, label: "Bulk Student Onboarding" },
                    { icon: ClipboardList, label: "Custom Exam Sets" },
                    { icon: TrendingUp, label: "School-wide Analytics" },
                    { icon: Award, label: "Institution Branding" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center text-center gap-2 rounded-2xl p-3 border"
                      style={{ background: "rgba(238,179,43,0.06)", borderColor: BORDER }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: GOLD }} />
                      <span className="text-xs font-semibold" style={{ color: "#cbd5e1" }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-3">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full transition-all hover:scale-105 text-center justify-center"
                  style={{ background: GOLD, color: BG }}
                >
                  <Globe className="w-4 h-4" /> Partner with Us
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full border transition-all hover:scale-105 text-center justify-center text-sm"
                  style={{ borderColor: BORDER, color: "#fff", background: "rgba(255,255,255,0.04)" }}
                >
                  Request a Demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 md:py-28" style={{ background: CARD }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border"
              style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}
            >
              FAQ
            </span>
            <h2
              className="text-3xl md:text-4xl font-black text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
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
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-sm text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    style={{ color: GOLD }}
                  />
                </button>
                {openFaq === i && (
                  <div
                    className="px-6 pb-5 text-sm leading-relaxed pt-4"
                    style={{ color: "#8b95b0", borderTop: `1px solid ${BORDER}` }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: BG }}>
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-[600px] h-[300px] rounded-full blur-[120px] opacity-20"
            style={{ background: GOLD }}
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2
            className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Start Your Journey
            <br />
            <span style={{ color: GOLD }}>with Gurtron Today</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: "#8b95b0" }}>
            Available on Web & Google Play Store · India ka #1 AI Learning App
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#"
              className="flex items-center gap-2 font-bold text-base px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-2xl"
              style={{ background: GOLD, color: BG }}
            >
              <Globe className="w-5 h-5" />
              Start on Web Now
            </a>
            <a
              href="#"
              className="flex items-center gap-2 font-bold text-base px-8 py-4 rounded-full border hover:scale-105 transition-all"
              style={{ border: `1.5px solid ${BORDER}`, color: "#fff", background: "rgba(255,255,255,0.05)" }}
            >
              <Play className="w-4 h-4" style={{ fill: GOLD, color: GOLD }} />
              Download on Play Store
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: CARD, borderTop: `1px solid ${BORDER}` }} className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: GOLD }}
                >
                  <Zap className="w-4 h-4" style={{ color: BG }} />
                </div>
                <span
                  className="text-xl font-black text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Gurtron
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#8b95b0" }}>
                India's most powerful AI learning platform for students and teachers.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                {["Web App", "Android App", "AI Doubt Solver", "Mock Tests"].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="transition-colors"
                      style={{ color: "#8b95b0" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#8b95b0")}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-3">Exams</h4>
              <ul className="space-y-2 text-sm">
                {["JEE", "NEET", "UPSC", "SSC CGL", "GATE"].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="transition-colors"
                      style={{ color: "#8b95b0" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#8b95b0")}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                {["About Us", "Careers", "Blog", "Contact", "Privacy Policy"].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="transition-colors"
                      style={{ color: "#8b95b0" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#8b95b0")}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{ borderTop: `1px solid ${BORDER}`, color: "#8b95b0" }}
          >
            <span>© 2024 Gurtron. All rights reserved. Made with ❤️ in India.</span>
            <span>Available on Web & Google Play Store</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
