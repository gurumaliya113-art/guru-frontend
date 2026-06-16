import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { adminApi, setAdminToken } from "@/lib/api";
import "@/onboarding.css";
import { useAuth } from "@/context/AuthContext";

// Gurtron theme tokens
const GOLD = "#EEB32B";
const BG = "#040718";
const CARD = "#0c1129";
const BORDER = "rgba(238,179,43,0.18)";
const CREAM = "#f7f4ee";
const DARK2 = "#080e22";


// IMPORTANT: defined OUTSIDE the page component. Previously this lived inside
// Onboarding, so every keystroke recreated the component type, React unmounted
// the focused input, and the `autoFocus` on the name field stole focus back —
// which is what caused typed digits to land in the wrong field.
function InputRow({
  icon, placeholder, value, onChange, type = "text", autoFocus = false, hint,
  inputMode, autoComplete, trailingIcon, onTrailingClick,
}: {
  icon: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; autoFocus?: boolean; hint?: string;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "search" | "url" | "none";
  autoComplete?: string;
  trailingIcon?: string;
  onTrailingClick?: () => void;
}) {
  return (
    <div className="mb-3.5">
      <div
        className="flex items-center rounded-2xl border px-4 h-14 transition relative"
        style={{ background: CARD, borderColor: BORDER }}
      >
        <Icon name={icon} size={18} color="#8b95b0" />
        <input
          autoFocus={autoFocus}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ml-3 flex-1 bg-transparent outline-none placeholder:text-white/30 pr-8"
          style={{ color: '#ffffff' }}
        />
        {trailingIcon ? (
          <button type="button" onClick={onTrailingClick} className="absolute right-3">
            <Icon name={trailingIcon} size={16} color="#8b95b0" />
          </button>
        ) : null}
      </div>
      {hint ? <div className="text-[11px] mt-1.5 ml-1" style={{ color: "#8b95b0" }}>{hint}</div> : null}
    </div>
  );
}

export default function Onboarding() {
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Read admin emails from Vite env. Support single VITE_ADMIN_EMAIL or comma list VITE_ADMIN_EMAILS
  const ADMIN_RAW = String(import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || "");
  const ADMIN_EMAILS = ADMIN_RAW.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const email = identifier.trim();
    if (!email || !password) {
      setError("Enter your Gmail and password.");
      return;
    }

    // If email matches admin list, attempt admin login immediately (one-step)
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      try {
        const res = await adminApi.login(email, password);
        if ((res as any)?.token) {
          setAdminToken((res as any).token);
          nav("/admin", { replace: true });
          return;
        }
      } catch (err: any) {
        setError(err?.message || "Admin login failed.");
        return;
      }
    }

    setBusy(true);
    try {
      await login(email, password);
      nav("/", { replace: true });
    } catch (loginErr) {
      const message = (loginErr as Error)?.message || "Login failed.";
      const shouldSignup = /not found|not exist|404|user.*not|no user|not registered/i.test(message);
      if (shouldSignup && /\S+@\S+\.\S+/.test(email)) {
        try {
          await signup(email, password);
          nav("/", { replace: true });
          return;
        } catch (signupErr) {
          setError((signupErr as Error)?.message || "Signup failed. Please try again.");
          return;
        }
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboarding-root">
      <header className="onboarding-header">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="logo-mark" style={{ background: GOLD, color: BG }}><Icon name="zap" size={20} color={BG} /></div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900 }}>Gurtron</div>
          </div>
          <div>
            <a href="/" className="text-sm mr-4" style={{ color: '#8b95b0' }}>Back to site</a>
          </div>
        </div>
      </header>

      <main>
        <div className="onboarding-container">
          <div className="onboarding-hero">
            <div className="eyebrow">Gurtron · ONE PLATFORM. EVERY GOAL.</div>
            <h1 className="hero-title">Smart prep for <br /><span style={{ color: GOLD }}>students</span> and<br /><span style={{ color: '#ffffff' }}>teachers.</span></h1>
            <p className="hero-sub">One platform to practice quizzes, generate papers, track performance, and run classes — without friction.</p>
            <div className="onboarding-features">
              <div className="feature-card">
                <div className="label">Student</div>
                <div className="title">Study with confidence</div>
                <div className="text-sm" style={{ color: '#8b95b0', marginTop:8 }}>Practice quizzes, generate papers, and pinpoint weak areas with smart analytics.</div>
              </div>
              <div className="feature-card">
                <div className="label">Teacher</div>
                <div className="title">Teach smarter</div>
                <div className="text-sm" style={{ color: '#8b95b0', marginTop:8 }}>Create tests, assign them to students, and monitor class progress from one dashboard.</div>
              </div>
            </div>
          </div>

          <div>
            <div className="onboarding-card">
              <div>
                <div className="card-eyebrow">WELCOME BACK</div>
                <div className="card-title">Sign in to Gurtron</div>
                <div className="card-sub">New here? Your account is created automatically on first sign-in.</div>
              </div>

              <div className="role-toggle">
                <button type="button" onClick={() => setRole('student')} className={role === 'student' ? 'active' : ''}>
                  <Icon name="users" size={16} color={role === 'student' ? BG : '#8b95b0'} /> <span style={{ marginLeft: 8 }}>Student</span>
                </button>
                <button type="button" onClick={() => setRole('teacher')} className={role === 'teacher' ? 'active' : ''}>
                  <Icon name="user" size={16} color={role === 'teacher' ? BG : '#8b95b0'} /> <span style={{ marginLeft: 8 }}>Teacher</span>
                </button>
              </div>

              {error ? <div style={{ background: 'rgba(248,113,113,0.12)', padding: 10, borderRadius: 12, marginBottom: 12, color: '#fff' }}>{error}</div> : null}

              <form onSubmit={handleSubmit} className="onboarding-form">
                <div className="input-row">
                  <div className="input">
                    <Icon name="mail" size={18} color="#8b95b0" />
                    <input placeholder="you@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus type="email" inputMode="email" autoComplete="email" />
                  </div>
                </div>

                <div className="input-row">
                  <div className="input">
                    <Icon name="lock" size={18} color="#8b95b0" />
                    <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword((s) => !s)}><Icon name={showPassword ? 'eye-off' : 'eye'} size={16} color="#8b95b0" /></button>
                  </div>
                </div>

                <button type="submit" disabled={busy} className="btn-signin">{busy ? 'Please wait…' : 'Sign In'}</button>
              </form>

              <div className="divider"><div className="line" /><div style={{ color: '#8b95b0', fontSize: 13 }}>or use email</div><div className="line" /></div>

              <button type="button" onClick={() => { window.location.href = '/auth/google'; }} className="btn-google">
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44.5 20H24v8.5h11.9C34.2 32 30 36 24 36c-7 0-12.6-5.6-12.6-12.5S17 11 24 11c3.3 0 6.2 1.1 8.5 3.2l6-6C34 4.2 29.4 2 24 2 12.9 2 4.3 10.6 4.3 21.7S12.9 41.3 24 41.3c10.6 0 19-7.6 20.5-17.3 0-.6.0-1.1 0-1.4z" fill="#4285F4"/></svg>
                Continue with Google
              </button>

              <div>
                <a href="/" className="back-link">← Back to landing</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
