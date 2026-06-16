import { useState } from "react";
import { Zap, Globe, Smartphone, Play, ChevronDown, Menu, X, CheckCircle, ArrowRight, Users, TrendingUp, Shield, Layers, Star, RefreshCw, MonitorSmartphone, Palette, Database, Settings, Building2, MessageCircle, Phone as PhoneIcon, Check, Minus, BookOpen, Award } from "lucide-react";
import "../schools.css";

const GOLD = "#EEB32B"; const BG = "#040718"; const CARD = "#0c1129"; const BORDER = "rgba(238,179,43,0.18)"; const CREAM = "#f7f4ee"; const DARK2 = "#080e22";
const NAV = [
  { label: "For Students", href: "/landing" },
  { label: "For Teachers", href: "/teachers" },
  { label: "For Schools", href: "/schools" },
  { label: "Exams", href: "#exams" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

const AUDIENCE = [
  { icon: Building2, title: "Schools", desc: "Provide a branded AI exam-prep platform for 9th–12th students preparing for competitive exams.", tags: ["10th–12th Science", "CBSE · State Boards"] },
  { icon: Users, title: "Coaching Institutes", desc: "JEE, NEET and CET-focused coaching centres get a professional app experience under your name.", tags: ["JEE · NEET · CET", "Multi-branch ready"] },
  { icon: BookOpen, title: "Tuition Classes", desc: "Subject-specific or exam-specific tutors scale their teaching with technology — no app build required.", tags: ["Subject-wise", "Small batches OK"] },
  { icon: Globe, title: "Online Educators", desc: "Independent teachers running their own brand — get a professional app without building from scratch.", tags: ["Personal brand", "YouTube · Instagram"] },
];

const PLATFORM_FEATURES = [
  { icon: Smartphone, title: "Your Branded Android App", desc: "Published on Google Play under YOUR brand name. Students search for and download YOUR app.", tag: "Play Store", tagColor: "#22c55e" },
  { icon: Globe, title: "Your Branded Web App", desc: "Custom subdomain (e.g. yourschool.gurtron.app) with your logo, colours and complete brand identity.", tag: "Custom Subdomain", tagColor: GOLD },
  { icon: Palette, title: "Full Brand Customisation", desc: "Your logo, colour theme, app icon, splash screen and brand assets throughout the entire platform.", tag: "100% Your Brand", tagColor: "#a78bfa" },
  { icon: Database, title: "50K+ Questions & All Features", desc: "MCQs, mock tests, chapter-wise practice, multi-language support, performance analytics — day one.", tag: "Ready on Day 1", tagColor: GOLD },
  { icon: Settings, title: "Powerful Admin Panel", desc: "Upload students, manage classes, assign tests, track performance — complete control from one dashboard.", tag: "Full Control", tagColor: "#22c55e" },
  { icon: RefreshCw, title: "Continuous Improvements", desc: "Every new Gurtron feature automatically available in your branded app — no extra cost, no effort.", tag: "Auto Updates", tagColor: "#60a5fa" },
];

const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "UPSC", "SSC CGL", "GATE", "CAT", "Class 10 Board", "Class 12 Board", "NDA"];
const ADMIN_TABS = ["User Management", "Custom Content", "Online Exams", "Continuous Updates"];
const ADMIN_FEATURES = [
  { icon: Shield, title: "Approval-based sign-in", desc: "Only admin-approved students can access your app — no public sign-ups, complete control." },
  { icon: Users, title: "Bulk student upload", desc: "Upload entire student lists via Excel or CSV — students get user ID and password directly, no sign-up needed." },
  { icon: Layers, title: "Class management", desc: "Organise students into classes (e.g. 11th Science A, 12th Science B) for targeted content delivery." },
];
const SAMPLE_STUDENTS = [
  { name: "Aarav Patel", roll: "24-001", status: "Active", color: "#22c55e" },
  { name: "Diya Sharma", roll: "24-002", status: "Active", color: "#22c55e" },
  { name: "Krish Joshi", roll: "24-003", status: "Active", color: "#22c55e" },
  { name: "Meera Iyer", roll: "24-004", status: "Pending", color: GOLD },
];

const HOW_STEPS = [
  { day: "DAY 1", icon: PhoneIcon, title: "Discovery Call", desc: "We understand your needs — student count, exam focus, branding requirements — over WhatsApp or a quick call." },
  { day: "DAY 2-5", icon: Palette, title: "Branding & Setup", desc: "Share your logo and colours. Our team configures your complete branded app and web platform." },
  { day: "DAY 6-10", icon: Smartphone, title: "Platform Launch", desc: "Your branded platform goes live on Google Play and as a web app on your custom subdomain." },
  { day: "DAY 10+", icon: TrendingUp, title: "Onboard & Grow", desc: "Bulk-upload your students and teachers via the admin panel. Training provided. Start using immediately." },
];

const PARTNERS = ["DPS Vasant Kunj", "Quantum Academy", "Excel G Bank", "KDS Classes", "Vidya Mandir"];
const TRUST_STATS = [
  { value: "50+", label: "Schools & Institutes partnered" },
  { value: "12,000+", label: "Students on branded apps" },
  { value: "4.8★", label: "Avg rating across partner apps" },
  { value: "7 days", label: "Median launch time" },
];

const WHY = [
  { icon: Award, title: "Strengthen your brand", desc: "Students associate the learning platform with YOUR institute — not a third-party app. Build long-term brand loyalty.", tag: "Your name on every screen" },
  { icon: Zap, title: "Skip months of development", desc: "Don't spend 12–18 months building an app from scratch. Launch in days with a proven, battle-tested platform.", tag: "7–10 days vs 12–18 months" },
  { icon: Database, title: "50K+ questions — day one", desc: "No content creation needed. Your students get a curated, verified question bank from launch day across 10 exams.", tag: "10 exams · 4 subjects" },
];

const COMPARE_ROWS = [
  { label: "Time to launch", self: "6–18 months", generic: "1–2 months", gurtron: "7–10 days" },
  { label: "Question bank", self: "Build from zero", generic: "Limited / generic", gurtron: "50K+ verified" },
  { label: "Custom branding", self: "Full (if you build)", generic: "Limited / none", gurtron: "Full branding" },
  { label: "Your brand on app", self: "If you publish", generic: "Their brand", gurtron: "YOUR brand" },
  { label: "Ongoing updates", self: "Your team builds", generic: "Their roadmap", gurtron: "Automatic" },
  { label: "Admin panel", self: "Build it yourself", generic: "Basic", gurtron: "Powerful & full" },
];

const FAQS = [
  { q: "What exactly do schools get with Gurtron?", a: "You get a fully branded Android app + web platform under your school's name, with 50K+ questions, live tests, admin panel for student/teacher management, and performance analytics — ready in 7–10 days." },
  { q: "Will our logo and branding appear throughout?", a: "Yes. Your logo, colours, app icon and splash screen are applied across the entire platform. Students see only your brand — not Gurtron's." },
  { q: "Is the iOS / App Store version included?", a: "Currently the branded app is on Google Play and the web. iOS support is on our roadmap — we'll notify you as soon as it's available." },
  { q: "How long does it take to go live?", a: "Most partners go live in 7–10 days after the initial call. The process: Discovery Call → Branding & Setup → Launch → Student Onboarding." },
  { q: "Do we need to create our own question bank?", a: "No. From day one, your students get access to Gurtron's 50,000+ verified questions across JEE, NEET, UPSC, SSC, GATE, CAT, Boards and more." },
];

function PhoneMockupCard({ school }: { school: string }) {
  return (
    <div className="relative mx-auto" style={{ width: 200, height: 400 }}>
      <div className="absolute inset-0 rounded-[2.2rem] border-[5px]" style={{ borderColor: "rgba(238,179,43,0.5)", background: "#08102a", boxShadow: `0 0 60px rgba(238,179,43,0.2), 0 24px 60px rgba(0,0,0,0.7)` }} />
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full z-10" style={{ background: BG }} />
      <div className="absolute inset-[5px] rounded-[1.8rem] overflow-hidden" style={{ background: CARD }}>
        <div className="w-full h-full p-3 flex flex-col gap-1.5 pt-7">
          <div className="rounded-xl p-2 flex items-center gap-2" style={{ background: "rgba(238,179,43,0.1)", border: `1px solid ${BORDER}` }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: GOLD }}><Zap className="w-3 h-3" style={{ color: BG }} /></div>
            <div><div className="font-black text-white" style={{ fontSize: 9, fontFamily: "'Outfit',sans-serif" }}>{school.toUpperCase()}</div><div style={{ fontSize: 7, color: GOLD }}>Powered by Gurtron</div></div>
          </div>
          <div style={{ fontSize: 8, color: "#8b95b0", fontWeight: 700 }}>Subjects</div>
          {["Physics", "Chemistry", "Biology", "Maths"].map((s, i) => (<div key={s} className="rounded-lg px-2 py-1 flex items-center gap-1.5" style={{ background: i === 0 ? "rgba(238,179,43,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? GOLD : BORDER}` }}><div className="w-1 h-1 rounded-full" style={{ background: i === 0 ? GOLD : "#555" }} /><span style={{ fontSize: 8, color: i === 0 ? GOLD : "#cbd5e1", fontWeight: 600 }}>{s}</span></div>))}
          <div style={{ fontSize: 8, color: "#8b95b0", fontWeight: 700, marginTop: 4 }}>Quick Actions</div>
          {["Practice Test", "Mock Exam", "Revision Notes"].map((a) => (<div key={a} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}><span style={{ fontSize: 8, color: "#cbd5e1", fontWeight: 600 }}>{a}</span></div>))}
          <div className="mt-auto rounded-xl px-2 py-1.5 text-center" style={{ background: "rgba(238,179,43,0.08)", border: `1px solid ${GOLD}` }}><div style={{ fontSize: 7, color: "#8b95b0" }}>Your Brand</div><div style={{ fontSize: 10, color: GOLD, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>{school}</div></div>
        </div>
      </div>
    </div>
  );
}

export default function Schools() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ fontFamily: "'Nunito Sans',sans-serif", background: BG, color: "#fff" }}>
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{ background: "rgba(4,7,24,0.94)", borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/landing" className="flex items-center gap-2 shrink-0"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD }}><Zap className="w-4 h-4" style={{ color: BG }} /></div><span className="text-xl font-black tracking-tight text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>Gurtron</span></a>
          <nav className="hidden md:flex items-center gap-5">{NAV.map((l) => (<a key={l.label} href={l.href} className="text-sm font-semibold transition-colors" style={{ color: "#8b95b0" }} onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)} onMouseLeave={(e) => (e.currentTarget.style.color = "#8b95b0")}>{l.label}</a>))}</nav>
          <div className="hidden md:flex items-center gap-3"><a href="/onboarding" className="text-sm font-semibold" style={{ color: GOLD }}>Web Login</a><a href="#" className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full hover:scale-105 transition-transform" style={{ background: GOLD, color: BG }}><PhoneIcon className="w-3.5 h-3.5" /> Talk to Us</a></div>
          <button className="md:hidden p-2" style={{ color: "#8b95b0" }} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
        {mobileOpen && (<div className="md:hidden px-4 py-4 flex flex-col gap-3" style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>{NAV.map((l) => (<a key={l.label} href={l.href} className="text-sm font-semibold py-1" style={{ color: "#cbd5e1" }} onClick={() => setMobileOpen(false)}>{l.label}</a>))}<a href="#" className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-full mt-2" style={{ background: GOLD, color: BG }}><PhoneIcon className="w-4 h-4" /> Talk to Us</a></div>)}
      </header>

      <section id="schools" className="relative overflow-hidden py-20 md:py-28" style={{ background: `linear-gradient(160deg, ${BG} 0%, #0a1535 60%, ${BG} 100%)` }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 pointer-events-none" style={{ background: GOLD }} />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: "#60a5fa" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5 border" style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.08)" }}>B2B · Schools &amp; Institutes</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5 text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>Launch Your Own<br /><span style={{ color: GOLD }}>Branded</span><br />Learning Platform</h1>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: "#8b95b0" }}>Your school, your branding, all of Gurtron's power —<br />50K+ questions, live tests, analytics and a powerful admin panel under <strong className="text-white">YOUR brand name</strong>.</p>
              <div className="flex flex-wrap gap-3 mb-10">
                <a href="#contact" className="flex items-center gap-2 font-bold px-6 py-3.5 rounded-full hover:scale-105 transition-transform" style={{ background: GOLD, color: BG }}><MessageCircle className="w-4 h-4" /> Talk to Us on WhatsApp</a>
                <a href="#how" className="flex items-center gap-2 font-bold px-6 py-3.5 rounded-full border hover:scale-105 transition-all" style={{ border: `1.5px solid ${BORDER}`, color: "#fff", background: "rgba(255,255,255,0.05)" }}><Play className="w-4 h-4" style={{ fill: GOLD, color: GOLD }} /> Watch a Demo</a>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "#8b95b0" }}><div className="flex -space-x-2">{["DPS", "RY", "KV", "EG"].map((a) => (<div key={a} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: BG, background: CARD, color: GOLD }}>{a}</div>))}</div>Trusted by 50+ schools &amp; institutes across India</div>
            </div>
            <div className="flex items-center justify-center gap-4 md:gap-6">
              <div style={{ transform: "rotate(-6deg) translateY(20px)" }}><PhoneMockupCard school="ABC School" /></div>
              <div style={{ transform: "rotate(4deg) translateY(-10px)" }}><PhoneMockupCard school="XYZ Classes" /></div>
              <div className="hidden lg:flex flex-col items-center gap-2 rounded-2xl p-4 border" style={{ background: "rgba(238,179,43,0.06)", borderColor: BORDER, transform: "rotate(3deg) translateY(30px)" }}><div className="text-xs font-bold" style={{ color: "#8b95b0" }}>Your Brand here?</div><div className="w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: GOLD }}><Zap className="w-5 h-5" style={{ color: GOLD }} /></div><div className="text-xs" style={{ color: GOLD, fontWeight: 700 }}>Your App · Your Identity</div></div>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            {[{ v: "50+", l: "Schools & Institutes" }, { v: "50K+", l: "Questions Available" }, { v: "7–10 days", l: "To Go Live" }, { v: "Android+Web", l: "Platform" }].map((s) => (<div key={s.l} className="rounded-2xl py-4 px-3 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER }}><div className="text-xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: GOLD }}>{s.v}</div><div className="text-xs font-semibold mt-0.5" style={{ color: "#8b95b0" }}>{s.l}</div></div>))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24" style={{ background: CREAM }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 border uppercase tracking-wider" style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.08)" }}>Who It's For</span>
            <h2 className="text-3xl md:text-5xl font-black leading-tight" style={{ fontFamily: "'Outfit',sans-serif", color: "#0f0a2e" }}>Built for <span style={{ color: GOLD }}>every</span> education business</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Whether you run a school, a coaching empire, or a one-teacher tuition class — Gurtron gives you the same enterprise-grade platform, branded as yours.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AUDIENCE.map((a) => (<div key={a.title} className="rounded-3xl p-6 border hover:-translate-y-1 transition-all" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}><div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(238,179,43,0.1)" }}><a.icon className="w-5 h-5" style={{ color: GOLD }} /></div><h3 className="font-bold text-slate-900 mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>{a.title}</h3><p className="text-sm text-slate-500 leading-relaxed mb-4">{a.desc}</p><div className="flex flex-wrap gap-1.5">{a.tags.map((t) => (<span key={t} className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ color: GOLD, borderColor: "rgba(238,179,43,0.35)", background: "rgba(238,179,43,0.07)" }}>{t}</span>))}</div></div>))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28" style={{ background: `linear-gradient(160deg, ${BG} 0%, ${CARD} 50%, ${BG} 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4" style={{ fontFamily: "'Outfit',sans-serif" }}>Everything you need to launch<br />your <span style={{ color: GOLD }}>branded platform</span></h2><p className="text-slate-400 max-w-xl mx-auto">A complete learning ecosystem — with your brand on every screen, across every device.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map((f, i) => (<div key={f.title} className="rounded-3xl p-7 border transition-all hover:-translate-y-1 group" style={{ background: CARD, borderColor: BORDER }} onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 32px rgba(238,179,43,0.13)`)} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}><div className="flex items-start justify-between mb-5"><div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(238,179,43,0.1)" }}><f.icon className="w-5 h-5" style={{ color: GOLD }} /></div><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${f.tagColor}18`, color: f.tagColor, border: `1px solid ${f.tagColor}40` }}>{f.tag}</span></div><div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#8b95b0" }}>0{i + 1}</div><h3 className="font-bold text-white mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>{f.title}</h3><p className="text-sm leading-relaxed" style={{ color: "#8b95b0" }}>{f.desc}</p></div>))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ background: CREAM }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 border uppercase tracking-wider" style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.08)" }}>Admin Panel</span><h2 className="text-3xl md:text-5xl font-black leading-tight" style={{ fontFamily: "'Outfit',sans-serif", color: "#0f0a2e" }}>A powerful admin panel —<br /><span style={{ color: GOLD }}>complete control</span><br />at your fingertips</h2><p className="text-slate-500 mt-3 max-w-lg mx-auto">Manage every aspect of your branded platform from one dashboard. Built for principals, directors and teaching teams.</p></div>
          <div className="flex flex-wrap justify-center gap-2 mb-10">{ADMIN_TABS.map((t, i) => (<button key={t} onClick={() => setActiveTab(i)} className="text-sm font-bold px-4 py-2 rounded-full border transition-all" style={activeTab === i ? { background: GOLD, color: BG, borderColor: GOLD } : { background: "rgba(238,179,43,0.06)", color: "#0f0a2e", borderColor: "rgba(238,179,43,0.3)" }}>{t}</button>))}</div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-4">{ADMIN_FEATURES.map((f) => (<div key={f.title} className="flex gap-4 p-5 rounded-2xl border" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}><div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(238,179,43,0.1)" }}><f.icon className="w-5 h-5" style={{ color: GOLD }} /></div><div><div className="flex items-center gap-1.5 mb-1"><Check className="w-3.5 h-3.5" style={{ color: "#22c55e" }} /><span className="font-bold text-sm text-slate-900">{f.title}</span></div><p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p></div></div>))}</div>
            <div className="rounded-3xl border overflow-hidden" style={{ background: BG, borderColor: BORDER }}><div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: BORDER }}><span className="font-bold text-sm text-white">Student Management</span><span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: GOLD, color: BG }}>Bulk Upload</span></div><div className="px-5 py-2"><div className="grid grid-cols-3 text-xs font-bold py-2 border-b" style={{ color: "#8b95b0", borderColor: BORDER }}><span>STUDENT</span><span>ROLL</span><span>STATUS</span></div>{SAMPLE_STUDENTS.map((s) => (<div key={s.name} className="grid grid-cols-3 text-sm py-3 border-b items-center" style={{ borderColor: "rgba(255,255,255,0.04)" }}><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(238,179,43,0.12)", color: GOLD }}>{s.name[0]}</div><span className="text-white text-xs font-semibold">{s.name}</span></div><span className="text-xs" style={{ color: "#8b95b0" }}>{s.roll}</span><span className="text-xs font-bold px-2 py-0.5 rounded-full w-fit" style={{ background: `${s.color}18`, color: s.color }}>{s.status}</span></div>))}</div></div>
          </div>
        </div>
      </section>

      <section id="how" className="py-20 md:py-28" style={{ background: BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 border uppercase tracking-wider" style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}>How It Works</span><h2 className="text-3xl md:text-5xl font-black text-white leading-tight" style={{ fontFamily: "'Outfit',sans-serif" }}>Go live in <span style={{ color: GOLD }}>days,</span> not months</h2><p className="text-slate-400 mt-3 max-w-md mx-auto">From first conversation to platform launch — a simple 4-step process. We do the heavy lifting; you focus on teaching.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px" style={{ background: `linear-gradient(90deg, ${GOLD}44, ${GOLD}, ${GOLD}44)` }} />
            {HOW_STEPS.map((step, i) => (<div key={step.title} className="rounded-3xl p-6 border text-center relative" style={{ background: CARD, borderColor: BORDER }}><div className="text-xs font-black mb-4 px-3 py-1 rounded-full inline-block" style={{ background: "rgba(238,179,43,0.12)", color: GOLD }}>{step.day}</div><div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(238,179,43,0.1)" }}><step.icon className="w-6 h-6" style={{ color: GOLD }} /></div><div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#8b95b0" }}>STEP 0{i + 1}</div><h3 className="font-bold text-white mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>{step.title}</h3><p className="text-xs leading-relaxed" style={{ color: "#8b95b0" }}>{step.desc}</p></div>))}
          </div>
          <p className="text-center mt-8 text-sm" style={{ color: "#8b95b0" }}><span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4" style={{ color: GOLD }} />Most schools are <strong className="text-white">live within 7–10 days</strong></span></p>
        </div>
      </section>

      <section className="py-20 md:py-24" style={{ background: CREAM }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 border uppercase tracking-wider" style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.08)" }}>Trusted by Schools</span><h2 className="text-3xl md:text-5xl font-black leading-tight mb-3" style={{ fontFamily: "'Outfit',sans-serif", color: "#0f0a2e" }}>Trusted by <span style={{ color: GOLD }}>schools &amp; institutes</span><br />across India</h2><p className="text-slate-500 mb-10 max-w-xl mx-auto">From single-branch tuition centres to multi-branch coaching empires — institutes across India launch their branded learning platform on Gurtron.</p>
          <div className="flex flex-wrap gap-3 justify-center mb-14">{PARTNERS.map((p) => (<div key={p} className="flex items-center gap-2 px-4 py-2 rounded-full border" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)" }}><div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: GOLD, color: BG }}>{p[0]}</div><span className="text-sm font-bold text-slate-700">{p}</span><span className="text-xs text-slate-400">Maharashtra</span></div>))}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-3xl mx-auto">{TRUST_STATS.map((s) => (<div key={s.label} className="rounded-2xl py-5 px-3 border text-center" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}><div className="text-3xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "#0f0a2e" }}>{s.value}</div><div className="text-xs text-slate-400 font-semibold mt-1 leading-tight">{s.label}</div></div>))}</div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ background: `linear-gradient(160deg, ${BG} 0%, #0b1530 50%, ${BG} 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 border uppercase tracking-wider" style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}>Why Gurtron</span><h2 className="text-3xl md:text-5xl font-black text-white leading-tight" style={{ fontFamily: "'Outfit',sans-serif" }}>Why schools choose <span style={{ color: GOLD }}>Gurtron</span></h2><p className="text-slate-400 mt-3 max-w-lg mx-auto">The smart way to give your students a competitive edge — without the time, cost or risk of building it yourself.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{WHY.map((w) => (<div key={w.title} className="rounded-3xl p-8 border hover:-translate-y-1 transition-all" style={{ background: CARD, borderColor: BORDER }} onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 32px rgba(238,179,43,0.12)`)} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}><div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(238,179,43,0.1)" }}><w.icon className="w-6 h-6" style={{ color: GOLD }} /></div><h3 className="font-bold text-white mb-3 text-lg" style={{ fontFamily: "'Outfit',sans-serif" }}>{w.title}</h3><p className="text-sm leading-relaxed mb-5" style={{ color: "#8b95b0" }}>{w.desc}</p><span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}>{w.tag}</span></div>))}</div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ background: CREAM }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 border uppercase tracking-wider" style={{ color: GOLD, borderColor: "rgba(238,179,43,0.4)", background: "rgba(238,179,43,0.08)" }}>A Comparison</span><h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ fontFamily: "'Outfit',sans-serif", color: "#0f0a2e" }}>Build it, buy generic,<br />or <span style={{ color: GOLD }}>partner with Gurtron?</span></h2><p className="text-slate-500 mt-3">The numbers speak for themselves.</p></div>
          <div className="rounded-3xl overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="grid grid-cols-4 text-sm font-bold" style={{ background: "#f0ede6" }}><div className="px-5 py-4 text-slate-500">Criteria</div><div className="px-5 py-4 text-slate-700 border-l" style={{ borderColor: "rgba(0,0,0,0.08)" }}>Build Yourself<span className="block text-xs font-normal text-slate-400">DIY — Your dev team</span></div><div className="px-5 py-4 text-slate-700 border-l" style={{ borderColor: "rgba(0,0,0,0.08)" }}>Generic Platform<span className="block text-xs font-normal text-slate-400">Off-the-shelf SaaS</span></div><div className="px-5 py-4 border-l" style={{ borderColor: GOLD, background: "rgba(238,179,43,0.06)" }}><span className="inline-block text-xs font-black px-2.5 py-0.5 rounded-full mb-1.5" style={{ background: GOLD, color: BG }}>✦ Recommended</span><span className="block font-bold" style={{ color: GOLD }}>Partner with Gurtron</span><span className="block text-xs font-normal" style={{ color: "#8b95b0" }}>Your brand · Your platform</span></div></div>
            {COMPARE_ROWS.map((row, i) => (<div key={row.label} className="grid grid-cols-4 text-sm border-t" style={{ borderColor: "rgba(0,0,0,0.07)", background: i % 2 === 0 ? "#fff" : "#faf9f6" }}><div className="px-5 py-4 font-semibold text-slate-600">{row.label}</div><div className="px-5 py-4 text-slate-500 border-l flex items-center gap-1.5" style={{ borderColor: "rgba(0,0,0,0.07)" }}><Minus className="w-3.5 h-3.5 text-red-400 shrink-0" />{row.self}</div><div className="px-5 py-4 text-slate-500 border-l flex items-center gap-1.5" style={{ borderColor: "rgba(0,0,0,0.07)" }}><Minus className="w-3.5 h-3.5 text-amber-400 shrink-0" />{row.generic}</div><div className="px-5 py-4 border-l flex items-center gap-1.5 font-bold" style={{ borderColor: "rgba(238,179,43,0.3)", color: GOLD, background: "rgba(238,179,43,0.04)" }}><Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#22c55e" }} />{row.gurtron}</div></div>))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 md:py-28" style={{ background: CARD }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border" style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}>FAQ</span><h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>Got Questions?</h2></div>
          <div className="space-y-3">{FAQS.map((faq, i) => (<div key={i} className="rounded-2xl border overflow-hidden" style={{ background: BG, borderColor: openFaq === i ? GOLD : BORDER }}><button className="w-full text-left px-6 py-5 flex items-center justify-between gap-4" onClick={() => setOpenFaq(openFaq === i ? null : i)}><span className="font-bold text-sm text-white">{faq.q}</span><ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} style={{ color: GOLD }} /></button>{openFaq === i && (<div className="px-6 pb-5 text-sm leading-relaxed pt-4" style={{ color: "#8b95b0", borderTop: `1px solid ${BORDER}` }}>{faq.a}</div>)}</div>))}</div>
        </div>
      </section>

      <section id="contact" className="py-20 md:py-28 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BG} 0%, #0a1535 50%, ${BG} 100%)` }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[700px] h-[300px] rounded-full blur-[130px] opacity-20" style={{ background: GOLD }} /></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div><span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5 border uppercase tracking-wider" style={{ color: GOLD, borderColor: BORDER, background: "rgba(238,179,43,0.08)" }}>Ready When You Are</span><h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5" style={{ fontFamily: "'Outfit',sans-serif" }}>Ready to launch your own<br /><span style={{ color: GOLD }}>branded learning platform?</span></h2><p className="mb-8 leading-relaxed" style={{ color: "#8b95b0" }}>Talk to our team and get a personalised demo for your school or institute — we'll walk you through pricing, branding and timeline in one call.</p>
              <div className="flex flex-wrap gap-3 mb-6"><a href="#" className="flex items-center gap-2 font-bold px-6 py-3.5 rounded-full hover:scale-105 transition-transform" style={{ background: GOLD, color: BG }}><MessageCircle className="w-4 h-4" /> Chat on WhatsApp</a><a href="#" className="flex items-center gap-2 font-bold px-6 py-3.5 rounded-full border hover:scale-105 transition-all" style={{ border: `1.5px solid ${BORDER}`, color: "#fff", background: "rgba(255,255,255,0.05)" }}><PhoneIcon className="w-4 h-4" /> Contact Us</a></div>
              <p className="text-xs" style={{ color: "#8b95b0" }}>Reply within <strong className="text-white">30 minutes</strong> in business hours &nbsp;·&nbsp;<strong className="text-white">Call +91 XXXXX XXXXX</strong></p>
            </div>
            <div className="flex items-center gap-6 justify-center md:justify-end"><PhoneMockupCard school="Your Brand" /><div className="flex flex-col gap-3"><div className="rounded-2xl p-4 border" style={{ background: CARD, borderColor: BORDER }}><div className="text-xs font-bold mb-1" style={{ color: "#8b95b0" }}>Active Schools</div><div className="text-2xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: GOLD }}>50+</div><div className="text-xs mt-0.5" style={{ color: "#22c55e" }}>↑ Growing fast</div></div><div className="rounded-2xl p-4 border" style={{ background: CARD, borderColor: BORDER }}><div className="text-xs font-bold mb-1" style={{ color: "#8b95b0" }}>Questions Available</div><div className="text-2xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: GOLD }}>50K+</div><div className="text-xs mt-0.5" style={{ color: "#8b95b0" }}>Coming in 7 days</div></div></div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12" style={{ background: DARK2, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-2"><div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD }}><Zap className="w-4 h-4" style={{ color: BG }} /></div><span className="text-xl font-black text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>Gurtron</span></div><p className="text-sm leading-relaxed mb-4" style={{ color: "#8b95b0" }}>India's smartest AI exam prep and assessment platform. Built for JEE, NEET, CET, UPSC and more.</p><div className="flex gap-3">{["Play Store", "Web App"].map((s) => (<a key={s} href="#" className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105" style={{ borderColor: BORDER, color: GOLD, background: "rgba(238,179,43,0.08)" }}>{s}</a>))}</div></div>
            {[{ heading: "Quick Links", links: ["For Students", "For Teachers", "For Schools", "All Exams", "Paper Generator"] }, { heading: "Features", links: ["PYQ Practice", "Mock Tests", "Features", "FAQ"] }, { heading: "Company", links: ["About", "Contact", "Privacy Policy", "Terms of Service"] }].map((col) => (<div key={col.heading}><h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">{col.heading}</h4><ul className="space-y-2 text-sm">{col.links.map((l) => (<li key={l}><a href="#" style={{ color: "#8b95b0" }} className="transition-colors hover:text-white" onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)} onMouseLeave={(e) => (e.currentTarget.style.color = "#8b95b0")}>{l}</a></li>))}</ul></div>))}
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderTop: `1px solid ${BORDER}`, color: "#8b95b0" }}><span>© 2024 Gurtron. All rights reserved. Made with ❤️ in India.</span><span>Available on Web &amp; Google Play Store</span></div>
        </div>
      </footer>
    </div>
  );
}
