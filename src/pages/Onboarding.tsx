import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

// Dark theme palette inspired by the "GURTRON" mockup (deep navy + amber accent).
const T: {
  bg: string; bgGradient: string; surface: string; surfaceHi: string;
  border: string; borderHi: string; text: string; muted: string; mutedSoft: string;
  accent: string; accentSoft: string; accentRing: string; danger: string; dangerSoft: string;
} = {
  bg: "#0a0e16",
  bgGradient: "linear-gradient(160deg,#0a0e16 0%,#0f1622 55%,#101826 100%)",
  surface: "#111a28",
  surfaceHi: "#172238",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(245,179,51,0.45)",
  text: "#f5f7fb",
  muted: "rgba(255,255,255,0.55)",
  mutedSoft: "rgba(255,255,255,0.4)",
  accent: "#f5b133", // amber
  accentSoft: "rgba(245,179,51,0.15)",
  accentRing: "rgba(245,179,51,0.35)",
  danger: "#f87171",
  dangerSoft: "rgba(248,113,113,0.12)",
};

// IMPORTANT: defined OUTSIDE the page component. Previously this lived inside
// Onboarding, so every keystroke recreated the component type, React unmounted
// the focused input, and the `autoFocus` on the name field stole focus back —
// which is what caused typed digits to land in the wrong field.
function InputRow({
  icon, placeholder, value, onChange, type = "text", autoFocus = false, hint,
  inputMode, autoComplete,
}: {
  icon: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; autoFocus?: boolean; hint?: string;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "search" | "url" | "none";
  autoComplete?: string;
}) {
  return (
    <div className="mb-3.5">
      <div
        className="flex items-center rounded-2xl border px-4 h-14 transition focus-within:border-[var(--accent)]"
        style={{ background: T.surface, borderColor: T.border, ["--accent" as any]: T.accent }}
      >
        <Icon name={icon} size={18} color={T.mutedSoft} />
        <input
          autoFocus={autoFocus}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ml-3 flex-1 bg-transparent outline-none placeholder:text-white/30"
          style={{ color: T.text }}
        />
      </div>
      {hint ? <div className="text-[11px] mt-1.5 ml-1" style={{ color: T.mutedSoft }}>{hint}</div> : null}
    </div>
  );
}

export default function Onboarding() {
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Enter your Gmail and password.");
      return;
    }

    setBusy(true);
    try {
      await login(identifier.trim(), password);
      nav("/", { replace: true });
    } catch (loginErr) {
      const message = (loginErr as Error)?.message || "Login failed.";
      const shouldSignup = /not found|not exist|404|user.*not|no user|not registered/i.test(message);
      const email = identifier.trim();
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
    <div
      className="min-h-full px-6 py-12 relative overflow-hidden"
      style={{ background: T.bgGradient, color: T.text }}
    >
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(245,179,51,0.18), transparent 70%)" }}
      />
      <div className="absolute bottom-10 -left-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.10), transparent 70%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="relative z-20 max-w-md mx-auto mb-4">
          <button
            type="button"
            onClick={() => setShowSignIn(true)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition active:scale-[0.98]"
            style={{
              background: T.surfaceHi,
              border: `1px solid ${T.accentRing}`,
              color: T.text,
              boxShadow: `0 4px 18px ${T.accentSoft}`,
            }}
          >
            <span className="flex items-center gap-2">
              <Icon name="log-in" size={16} color={T.accent} />
              Already have an account?
            </span>
            <span className="flex items-center gap-1.5" style={{ color: T.accent }}>
              Sign in
              <Icon name="arrow-right" size={14} color={T.accent} />
            </span>
          </button>
        </div>

        <div className="text-center mb-10">
          <div
            className="w-[72px] h-[72px] rounded-2xl mx-auto mb-3.5 flex items-center justify-center border"
            style={{ background: T.surfaceHi, borderColor: T.border, boxShadow: `0 8px 30px ${T.accentSoft}` }}
          >
            <Icon name="book-open" size={32} color={T.accent} />
          </div>
          <div className="text-[28px] font-bold tracking-tight">Gurutron</div>
          <div className="text-sm" style={{ color: T.muted }}>Master NEET & JEE with AI</div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Smart prep for students and teachers.</h1>
              <p className="max-w-2xl text-slate-300 text-base sm:text-lg">
                One platform to practice quizzes, generate papers, track performance, and run classes without friction.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Student</div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Practice quizzes, generate papers, and pinpoint weak areas with smart analytics.
                </p>
                <div className="text-2xl font-bold text-white">Study with confidence</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Teacher</div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Create tests, assign them to students, and monitor class progress from one dashboard.
                </p>
                <div className="text-2xl font-bold text-white">Teach smarter</div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 grid gap-3 sm:grid-cols-3 text-sm text-slate-400">
              <div className="rounded-3xl bg-slate-950/60 p-4 text-center">AI Paper Generator</div>
              <div className="rounded-3xl bg-slate-950/60 p-4 text-center">Smart Analytics</div>
              <div className="rounded-3xl bg-slate-950/60 p-4 text-center">10,000+ PYQs</div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setShowSignIn(true)}
                className="rounded-3xl bg-white px-8 py-4 text-slate-950 font-semibold shadow-xl shadow-slate-950/10 transition hover:bg-slate-100"
              >
                Get Started
              </button>
              <div className="text-sm text-slate-400">
                Click to open the sign-in form. If the email is new, Gurutron creates your account automatically.
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 min-h-[420px] flex flex-col justify-center">
            {showSignIn ? (
              <div className="space-y-6">
                <div>
                  <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Single sign in</div>
                  <h2 className="mt-3 text-3xl font-bold text-white">Use Gmail + password</h2>
                  <p className="mt-3 text-slate-400">If your account already exists, you’ll log in. If not, we’ll create it for you.</p>
                </div>

                {error ? (
                  <div className="rounded-3xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <InputRow
                    icon="mail"
                    placeholder="Gmail address"
                    value={identifier}
                    onChange={setIdentifier}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                  />
                  <InputRow
                    icon="lock"
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    type="password"
                    autoComplete="current-password"
                  />

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-3xl bg-emerald-400 py-4 text-slate-950 font-semibold transition hover:bg-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {busy ? "Please wait…" : "Sign in"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => { setShowSignIn(false); setError(null); }}
                  className="w-full text-center text-sm text-slate-400 underline-offset-4 hover:text-slate-200"
                >
                  Back to landing
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Ready to begin</div>
                  <h2 className="mt-3 text-3xl font-bold text-white">Quick access to Gurutron</h2>
                  <p className="mt-3 text-slate-400">Hit Get Started to open the sign-in form in one click.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
                  <div className="font-semibold text-white mb-3">What you get</div>
                  <ul className="space-y-3 text-sm">
                    <li>• Adaptive quizzes and AI-powered paper generation</li>
                    <li>• Teacher assignment and class performance tracking</li>
                    <li>• Instant sign in with email and password</li>
                  </ul>
                </div>
                <div className="text-sm text-slate-400">Click Get Started and enter your Gmail + password to continue.</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">AI Paper Generator</div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">Smart Analytics</div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">10,000+ PYQs</div>
        </div>

        <button
          onClick={() => nav("/admin/login")}
          className="mt-6 mx-auto block text-[11px] text-slate-400"
        >
          Admin Login
        </button>
      </div>
    </div>
  );
}
