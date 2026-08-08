import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const initializeGoogleButton = () => {
      if (!window.google?.accounts?.id) return false;
      const element = document.getElementById("google-signin-button");
      if (!element) return false;

      window.google.accounts.id.initialize({
        client_id: "624499359248-r1sga1d1r2eq4g7jj124eumuoqrdj08i.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(element, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
      });
      return true;
    };

    const tryInitialize = () => {
      if (!isMounted) return;
      const initialized = initializeGoogleButton();
      if (initialized && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    tryInitialize();
    if (!window.google?.accounts?.id) {
      pollTimer = setInterval(tryInitialize, 200);
    }


    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setError(null);
    setBusy(true);
    try {
      await loginWithGoogle({ credential: response.credential });
      // Go to root — App.tsx will route to onboarding / class-create / home
      // depending on the user's state. /dashboard is just a placeholder.
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error)?.message || "Google login failed. Please try again.");
      setBusy(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (isSignup) {
        // Signup currently requires an email (not phone/username).
        await signup(identifier.trim().toLowerCase(), password);
      } else {
        await login(identifier.trim(), password);
      }
      // Go to root — App.tsx will route to onboarding / class-create / home
      // depending on the user's state.
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error)?.message || "Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Dark navy + amber theme (matches Onboarding mockup)
  const T = {
    bgGradient: "linear-gradient(160deg,#0a0e16 0%,#0f1622 55%,#101826 100%)",
    surface: "#111a28",
    surfaceHi: "#172238",
    border: "rgba(255,255,255,0.08)",
    text: "#f5f7fb",
    muted: "rgba(255,255,255,0.55)",
    mutedSoft: "rgba(255,255,255,0.4)",
    accent: "#f5b133",
    accentSoft: "rgba(245,179,51,0.15)",
    accentRing: "rgba(245,179,51,0.35)",
    danger: "#f87171",
    dangerSoft: "rgba(248,113,113,0.12)",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden"
      style={{ background: T.bgGradient, color: T.text }}
    >
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(245,179,51,0.10), transparent 72%)" }} />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(245,179,51,0.18), transparent 70%)" }} />
      <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.10), transparent 70%)" }} />

      <div
        className="relative z-10 max-w-md w-full p-7 rounded-3xl border"
        style={{
          background: T.surface,
          borderColor: T.border,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div className="text-center mb-6">
          <div
            className="w-[64px] h-[64px] rounded-2xl mx-auto mb-3 flex items-center justify-center border"
            style={{ background: `linear-gradient(135deg, ${T.surfaceHi}, rgba(245,179,51,0.10))`, borderColor: T.accentRing, boxShadow: `0 12px 40px ${T.accentSoft}` }}
          >
            <span className="text-2xl" style={{ color: T.accent }}>📘</span>
          </div>
          <h2 className="text-[26px] font-bold tracking-tight">Welcome to Gurutron</h2>
          <p className="mt-1.5 text-sm" style={{ color: T.muted }}>Sign in or create your account</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={{ background: "rgba(245,179,51,0.12)", color: T.accent, border: `1px solid ${T.accentRing}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: T.accent }} />
            Built for 1 % Who refuses average
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border px-3 py-3 text-center" style={{ background: T.surfaceHi, borderColor: T.border }}>
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.mutedSoft }}>Focus</div>
            <div className="mt-1 text-sm font-bold" style={{ color: T.text }}>Daily</div>
          </div>
          <div className="rounded-2xl border px-3 py-3 text-center" style={{ background: T.surfaceHi, borderColor: T.border }}>
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.mutedSoft }}>Mode</div>
            <div className="mt-1 text-sm font-bold" style={{ color: T.accent }}>Elite</div>
          </div>
          <div className="rounded-2xl border px-3 py-3 text-center" style={{ background: T.surfaceHi, borderColor: T.border }}>
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.mutedSoft }}>Goal</div>
            <div className="mt-1 text-sm font-bold" style={{ color: T.text }}>Top rank</div>
          </div>
        </div>

        {error ? (
          <div
            className="text-sm rounded-xl px-3.5 py-2.5 mb-4"
            style={{ background: T.dangerSoft, color: T.danger, border: "1px solid rgba(248,113,113,0.25)" }}
          >
            {error}
          </div>
        ) : null}

        <div className="space-y-4 mb-5">
          <div id="google-signin-button" className="flex justify-center"></div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: T.border }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3" style={{ background: T.surface, color: T.mutedSoft }}>Or continue with email</span>
            </div>
          </div>
        </div>

        <div className="text-left mb-5">
          <p className="text-xs uppercase tracking-wider mb-2.5 font-medium" style={{ color: T.muted }}>
            Choose an action
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className="rounded-2xl px-4 py-3 font-semibold transition"
              style={
                !isSignup
                  ? { background: T.accent, color: "#0a0e16", boxShadow: `0 8px 24px ${T.accentSoft}` }
                  : { background: T.surfaceHi, color: T.muted, border: `1px solid ${T.border}` }
              }
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="rounded-2xl px-4 py-3 font-semibold transition"
              style={{ background: T.surfaceHi, color: T.muted, border: `1px solid ${T.border}` }}
            >
              Create account
            </button>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs uppercase tracking-wider font-medium mb-1.5" style={{ color: T.muted }} htmlFor="identifier">
              {isSignup ? "Email address" : "Email, phone or username"}
            </label>
            <input
              id="identifier"
              type={isSignup ? "email" : "text"}
              autoComplete={isSignup ? "email" : "username"}
              inputMode={isSignup ? "email" : "text"}
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={isSignup ? "you@example.com" : "you@example.com / 98XXXXXXXX / yourname"}
              className="w-full rounded-2xl px-4 py-3 outline-none transition placeholder:text-white/30"
              style={{
                background: T.surfaceHi,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium mb-1.5" style={{ color: T.muted }} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl px-4 py-3 outline-none transition placeholder:text-white/30"
              style={{
                background: T.surfaceHi,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl px-4 py-3.5 font-bold transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${T.accent} 0%, #ffd27a 100%)`,
              color: "#0a0e16",
              boxShadow: `0 10px 30px ${T.accentSoft}`,
            }}
          >
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm" style={{ color: T.muted }}>
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button className="font-semibold" style={{ color: T.accent }} type="button" onClick={() => setIsSignup(false)}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Gurutron?{' '}
              <button className="font-semibold" style={{ color: T.accent }} type="button" onClick={() => navigate("/onboarding")}>
                Create account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
