import React from "react";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import "../exams.css";

const GOLD = "#EEB32B";
const BG = "#040718";
const CARD = "#0c1129";

const EXAMS = [
  { title: "JEE Main", subtitle: "Physics · Chemistry · Mathematics" },
  { title: "JEE Advanced", subtitle: "Physics · Chemistry · Mathematics" },
  { title: "NEET", subtitle: "Physics · Chemistry · Biology" },
  { title: "CUET", subtitle: "Multiple (domain-specific subjects)" },
  { title: "UPSC", subtitle: "Prelims · Mains" },
  { title: "SSC CGL", subtitle: "General Studies & Aptitude" },
  { title: "GATE", subtitle: "Engineering & Aptitude" },
  { title: "CAT", subtitle: "Verbal · Quant · DI" },
];

export default function Exams() {
  return (
    <div className="exams-root" style={{ background: BG, minHeight: "100vh" }}>
      <header className="exams-header">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="logo-mark" style={{ background: GOLD, color: BG }}><Zap /></div>
            <div className="text-lg font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "#fff" }}>Gurtron</div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="nav-link">For Students</a>
            <a href="#" className="nav-link">For Teachers</a>
            <a href="/schools" className="nav-link">For Schools</a>
            <a href="/exams" className="nav-link active">Exams</a>
            <a href="#" className="nav-link">Features</a>
            <a href="#" className="nav-link">FAQ</a>
          </nav>
          <div className="hidden md:flex gap-3">
            <Link to="/onboarding" className="btn-outline">Web Login</Link>
            <button className="btn-primary">Download App</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="eyebrow">ALL EXAMS · 11 COVERED</div>
          <h1 className="hero-title">
            Practice for <span className="accent-blue">11</span> <span className="accent-brown">Competitive</span>
            <br />Exams — All in One App
          </h1>
          <p className="hero-sub">PYQs, mock tests, chapter-wise practice and question papers for JEE, NEET, GUJCET, and 8 more exams. Tap any exam below to jump to its details.</p>
        </div>

        <section className="mt-16">
          <div className="section-label">NATIONAL <span className="pill">4</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {EXAMS.slice(0,4).map((e) => (
              <div key={e.title} className="exam-card">
                <div className="exam-left">
                  <div className="exam-icon" />
                  <div>
                    <div className="exam-title">{e.title}</div>
                    <div className="exam-sub">{e.subtitle}</div>
                  </div>
                </div>
                <div className="exam-cta"><ArrowRight size={18} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="section-label">STATE CETS <span className="pill">6</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {EXAMS.slice(4).map((e) => (
              <div key={e.title} className="exam-card">
                <div className="exam-left">
                  <div className="exam-icon" />
                  <div>
                    <div className="exam-title">{e.title}</div>
                    <div className="exam-sub">{e.subtitle}</div>
                  </div>
                </div>
                <div className="exam-cta"><ArrowRight size={18} /></div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
