import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
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
        theme: "outline",
        size: "large",
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
      navigate("/dashboard");
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
        await signup(email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error)?.message || "Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-3xl shadow-lg border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to SmartPrep</h2>
          <p className="mt-2 text-gray-600">Sign in or create your account</p>
        </div>

        {error ? <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div> : null}

        <div className="space-y-4">
          <div id="google-signin-button" className="flex justify-center"></div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
        </div>

        <div className="text-left">
          <p className="text-sm font-medium text-gray-600 mb-3">Choose an action</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`rounded-2xl px-4 py-3 font-semibold shadow-sm ${isSignup ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-slate-900 text-white"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`rounded-2xl px-4 py-3 font-semibold shadow-sm ${isSignup ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"}`}
            >
              Create account
            </button>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-primary-600 px-4 py-3 text-white font-semibold hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button className="font-semibold text-primary-600" type="button" onClick={() => setIsSignup(false)}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New to SmartPrep?{' '}
              <button className="font-semibold text-primary-600" type="button" onClick={() => setIsSignup(true)}>
                Create account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
