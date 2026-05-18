import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import type { ExamType, Role } from "@/lib/types";

declare global {
  interface Window {
    google: any;
  }
}

type Step = "role" | "details";

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
  const { completeOnboarding } = useApp();
  const { isAuthenticated, signup, user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  // Inline sign-in modal for already-registered users. Replaces the old
  // standalone /login screen which the user found confusing.
  const [showSignIn, setShowSignIn] = useState(false);

  // Common fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [username, setUsername] = useState("");

  // Account credentials. Email is only collected when the user is NOT already
  // signed in (e.g. fresh registration). Password is collected for both new
  // signups and authenticated Google users who want to set a password so they
  // can later sign in with email/phone/username.
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  // Teacher-only
  const [inviteCode, setInviteCode] = useState("");

  // Student-only
  const [exam, setExam] = useState<ExamType>("NEET");
  const [classLevel, setClassLevel] = useState<string>("12");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) return "Please enter your full name";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 7) return "Please enter a valid phone number";
    if (!schoolName.trim()) return role === "teacher" ? "Please enter your school / coaching name" : "Please enter your school name";
    if (!username.trim() || username.includes(" ")) return "Username cannot be empty or contain spaces";
    if (!isAuthenticated) {
      if (!email.trim() || !/.+@.+\..+/.test(email.trim())) return "Please enter a valid email";
      if (!password || password.length < 6) return "Password must be at least 6 characters";
    }
    // Authenticated users (e.g. Google) may leave password blank to keep their
    // existing credentials, but if they fill it in, enforce the min length.
    if (isAuthenticated && password && password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (role === "teacher" && !inviteCode.trim()) return "Teacher invite code is required";
    return null;
  };

  const handleFinish = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    if (!role) return;
    setError(null);
    setSubmitting(true);
    try {
      // Create the auth account first if the user isn't logged in yet.
      if (!isAuthenticated) {
        await signup(email.trim().toLowerCase(), password);
      }
      await completeOnboarding(name.trim(), role, exam, {
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
        schoolName: schoolName.trim(),
        classLevel: role === "student" ? classLevel : undefined,
        teacherInviteCode: role === "teacher" ? inviteCode.trim() : undefined,
        password: password || undefined,
      });
      nav("/", { replace: true });
    } catch (e) {
      setError((e as Error)?.message || "Could not save your profile. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-full px-6 py-12 relative overflow-hidden"
      style={{ background: T.bgGradient, color: T.text }}
    >
      {/* Ambient blobs */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(245,179,51,0.18), transparent 70%)" }} />
      <div className="absolute bottom-10 -left-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.10), transparent 70%)" }} />

      {/* Top banner: prominent jump to sign-in for users who already have an account. */}
      {!isAuthenticated && (
        <div className="relative z-10 max-w-md mx-auto mb-4">
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
              <span>Already have an account?</span>
            </span>
            <span className="flex items-center gap-1.5" style={{ color: T.accent }}>
              Sign in
              <Icon name="arrow-right" size={14} color={T.accent} />
            </span>
          </button>
        </div>
      )}

      <div className="relative z-10 max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-9">
          <div
            className="w-[72px] h-[72px] rounded-2xl mx-auto mb-3.5 flex items-center justify-center border"
            style={{ background: T.surfaceHi, borderColor: T.border, boxShadow: `0 8px 30px ${T.accentSoft}` }}
          >
            <Icon name="book-open" size={32} color={T.accent} />
          </div>
          <div className="text-[28px] font-bold tracking-tight">Gurutron</div>
          <div className="text-sm" style={{ color: T.muted }}>Master NEET &amp; JEE with AI</div>
        </div>

        {step === "role" ? (
          <div className="mb-8">
            <div className="text-[26px] font-bold mb-1.5 tracking-tight">Who are you?</div>
            <div className="text-sm mb-7" style={{ color: T.muted }}>
              We'll personalise your experience
            </div>

            {([
              { r: "student" as Role, icon: "user", title: "Student",
                desc: "Practice quizzes, generate papers, track your weak areas" },
              { r: "teacher" as Role, icon: "users", title: "Teacher",
                desc: "Create tests, assign to students, track class performance" },
            ]).map(({ r, icon, title, desc }) => (
              <button
                key={r}
                onClick={() => { setRole(r); setError(null); setStep("details"); }}
                className="w-full text-left mb-3.5 rounded-2xl border overflow-hidden p-5 transition active:scale-[0.97] hover:border-[color:var(--bh)]"
                style={{ background: T.surface, borderColor: T.border, ["--bh" as any]: T.borderHi }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: T.accentSoft, border: `1px solid ${T.accentRing}` }}
                  >
                    <Icon name={icon} size={26} color={T.accent} />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold">{title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: T.muted }}>{desc}</div>
                  </div>
                  <Icon name="arrow-right" size={20} color={T.muted} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <button
              onClick={() => { setStep("role"); setError(null); }}
              className="flex items-center gap-1.5 mb-4 text-sm"
              style={{ color: T.muted }}
            >
              <Icon name="arrow-left" size={16} color={T.muted} /> Change role
            </button>

            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5"
              style={{ background: T.accentSoft, border: `1px solid ${T.accentRing}` }}
            >
              <Icon name={role === "student" ? "user" : "users"} size={14} color={T.accent} />
              <span className="text-xs font-semibold" style={{ color: T.accent }}>
                {role === "student" ? "Student Registration" : "Teacher Registration"}
              </span>
            </div>

            <div className="text-[26px] font-bold mb-1.5 tracking-tight">
              {role === "teacher" ? "Set up your account" : "Create your profile"}
            </div>
            <div className="text-sm mb-6" style={{ color: T.muted }}>
              Fill in a few quick details to continue.
            </div>

            {error ? (
              <div
                className="text-sm rounded-xl px-3.5 py-2.5 mb-4"
                style={{ background: T.dangerSoft, color: T.danger, border: `1px solid rgba(248,113,113,0.25)` }}
              >
                {error}
              </div>
            ) : null}

            <InputRow
              icon="user"
              placeholder={role === "teacher" ? "Full name (e.g. Mr. Sharma)" : "Full name"}
              value={name}
              onChange={setName}
              autoComplete="name"
              autoFocus
            />

            <InputRow
              icon="phone"
              placeholder="Phone number"
              value={phone}
              onChange={(v) => setPhone(v.replace(/[^\d+\-\s]/g, ""))}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />

            <InputRow
              icon="book-open"
              placeholder={role === "teacher" ? "School / Coaching name" : "School name"}
              value={schoolName}
              onChange={setSchoolName}
              autoComplete="organization"
            />

            <InputRow
              icon="at-sign"
              placeholder="Username"
              value={username}
              onChange={(v) => setUsername(v.replace(/\s/g, "").toLowerCase())}
              autoComplete="username"
              hint="No spaces. This is how others will see you."
            />

            {!isAuthenticated && (
              <InputRow
                icon="mail"
                placeholder="Email address"
                value={email}
                onChange={setEmail}
                type="email"
                inputMode="email"
                autoComplete="email"
              />
            )}

            <InputRow
              icon="lock"
              placeholder={isAuthenticated ? "Set a password (optional)" : "Password (min 6 chars)"}
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete={isAuthenticated ? "new-password" : "new-password"}
              hint={
                isAuthenticated
                  ? "Set a password to also sign in with email / phone / username later."
                  : "You'll use this with email, phone or username to sign in."
              }
            />

            {role === "teacher" && (
              <InputRow
                icon="key"
                placeholder="Teacher invite code"
                value={inviteCode}
                onChange={setInviteCode}
                autoComplete="off"
                hint="Ask your admin for the invite code. Students cannot register as teachers."
              />
            )}

            {role === "student" && (
              <>
                <div className="mt-5 mb-2.5 text-[11px] uppercase tracking-wider font-medium" style={{ color: T.muted }}>
                  Class
                </div>
                <div className="flex gap-2.5 mb-5">
                  {(["9", "10", "11", "12"]).map((c) => {
                    const active = classLevel === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setClassLevel(c)}
                        className="flex-1 py-3 rounded-xl text-sm font-bold transition"
                        style={{
                          background: active ? T.accentSoft : T.surface,
                          border: `1px solid ${active ? T.accent : T.border}`,
                          color: active ? T.accent : T.muted,
                        }}
                      >
                        Class {c}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] uppercase tracking-wider mb-2.5 font-medium" style={{ color: T.muted }}>
                  Target Exam
                </div>
                <div className="flex gap-2.5 mb-6">
                  {(["NEET", "JEE", "BOARD"] as ExamType[]).map((e) => {
                    const active = exam === e;
                    return (
                      <button
                        key={e}
                        onClick={() => setExam(e)}
                        className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition"
                        style={{
                          background: active ? T.accentSoft : T.surface,
                          border: `1px solid ${active ? T.accent : T.border}`,
                          color: active ? T.accent : T.muted,
                        }}
                      >
                        {e}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="text-[11px] mt-1 mb-5" style={{ color: T.mutedSoft }}>
              <Icon name="lock" size={11} color={T.mutedSoft} />
              <span className="ml-1.5">
                You'll be able to sign in with your email, phone, or username — plus the password set above.
              </span>
            </div>

            <button
              onClick={handleFinish}
              disabled={submitting}
              className="w-full rounded-2xl overflow-hidden transition active:scale-[0.97] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${T.accent} 0%, #ffd27a 100%)`,
                boxShadow: `0 10px 30px ${T.accentSoft}`,
              }}
            >
              <div className="flex items-center justify-center gap-2.5 py-4 text-base font-bold" style={{ color: "#0a0e16" }}>
                {submitting ? "Saving…" : role === "teacher" ? "Create Teacher Account" : "Create Student Account"}
                {!submitting && <Icon name="arrow-right" size={18} color="#0a0e16" />}
              </div>
            </button>

            {!isAuthenticated && (
              <div className="text-center mt-4 text-sm" style={{ color: T.muted }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowSignIn(true)}
                  className="font-bold underline-offset-2 hover:underline"
                  style={{ color: T.accent }}
                >
                  Sign in here
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center gap-5 flex-wrap">
          {[
            { icon: "cpu", label: "AI Paper Generator" },
            { icon: "target", label: "Smart Analytics" },
            { icon: "book-open", label: "10,000+ PYQs" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: T.mutedSoft }}>
              <Icon name={icon} size={16} color={T.accent} />
              {label}
            </div>
          ))}
        </div>

        <button
          onClick={() => nav("/admin/login")}
          className="mt-5 mx-auto flex items-center justify-center gap-2 text-[11px]"
          style={{ color: T.mutedSoft }}
        >
          <Icon name="shield" size={12} color={T.mutedSoft} />
          Admin Login
        </button>
      </div>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
}

// =============================================================================
// SignInModal — inline sign-in popup shown over the registration page so
// already-registered users can log in without leaving the page.
// Supports email / phone / username + password, and Google.
// =============================================================================
function SignInModal({ onClose }: { onClose: () => void }) {
  const { login, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape for a snappier feel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Initialize the Google Identity Services button inside the modal.
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const init = () => {
      if (!mounted) return false;
      if (!window.google?.accounts?.id) return false;
      if (!googleBtnRef.current) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: "624499359248-r1sga1d1r2eq4g7jj124eumuoqrdj08i.apps.googleusercontent.com",
          callback: async (response: any) => {
            setError(null);
            setBusy(true);
            try {
              await loginWithGoogle({ credential: response.credential });
              onClose();
              nav("/", { replace: true });
            } catch (err) {
              setError((err as Error)?.message || "Google sign-in failed.");
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320,
        });
        return true;
      } catch {
        return false;
      }
    };

    if (!init()) {
      timer = setInterval(() => { if (init() && timer) { clearInterval(timer); timer = null; } }, 200);
    }
    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [loginWithGoogle, nav, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Enter your login ID and password.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      onClose();
      nav("/", { replace: true });
    } catch (err) {
      setError((err as Error)?.message || "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(2,6,15,0.78)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border p-6 relative"
        style={{
          background: T.surface,
          borderColor: T.border,
          boxShadow: `0 30px 80px ${T.accentSoft}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, color: T.muted }}
        >
          <Icon name="x" size={16} color={T.muted} />
        </button>

        <div className="text-center mb-5">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: T.accentSoft, border: `1px solid ${T.accentRing}` }}
          >
            <Icon name="log-in" size={26} color={T.accent} />
          </div>
          <div className="text-xl font-bold tracking-tight">Welcome back</div>
          <div className="text-xs mt-1" style={{ color: T.muted }}>
            Sign in with your email, phone, or username.
          </div>
        </div>

        {error ? (
          <div
            className="text-xs rounded-xl px-3 py-2 mb-3"
            style={{ background: T.dangerSoft, color: T.danger, border: `1px solid rgba(248,113,113,0.25)` }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <InputRow
            icon="at-sign"
            placeholder="Email / phone / username"
            value={identifier}
            onChange={setIdentifier}
            autoComplete="username"
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
            className="w-full rounded-2xl py-3 font-bold transition active:scale-[0.98] disabled:opacity-60"
            style={{
              background: `linear-gradient(135deg, ${T.accent} 0%, #ffd27a 100%)`,
              color: "#0a0e16",
              boxShadow: `0 10px 30px ${T.accentSoft}`,
            }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px" style={{ background: T.border }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-[11px] uppercase tracking-wider" style={{ background: T.surface, color: T.mutedSoft }}>
              or
            </span>
          </div>
        </div>

        <div ref={googleBtnRef} className="flex justify-center" />

        <div className="mt-4 text-center text-xs" style={{ color: T.muted }}>
          New here?{" "}
          <button
            type="button"
            onClick={onClose}
            className="font-semibold"
            style={{ color: T.accent }}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
