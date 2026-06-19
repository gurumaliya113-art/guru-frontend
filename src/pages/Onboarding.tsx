import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import "@/onboarding.css";

declare global {
  interface Window {
    google: any;
  }
}

const GOLD = "#EEB32B";
const BG = "#040718";

export default function Onboarding() {
  const { user, isAuthenticated, loginWithGoogle } = useAuth();
  const { profile, completeOnboarding } = useApp();
  const nav = useNavigate();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showRolePicker = isAuthenticated && !profile.isOnboarded;

  useEffect(() => {
    if (showRolePicker) return;

    let mounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const initializeButton = () => {
      if (!mounted || !window.google?.accounts?.id || !buttonRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: "624499359248-r1sga1d1r2eq4g7jj124eumuoqrdj08i.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
      });
      return true;
    };

    const tick = () => {
      const ready = initializeButton();
      if (ready && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    tick();
    if (!window.google?.accounts?.id) {
      pollTimer = setInterval(tick, 200);
    }

    return () => {
      mounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [showRolePicker]);

  const handleGoogleResponse = async (response: any) => {
    setError(null);
    setBusy(true);
    try {
      await loginWithGoogle({ credential: response.credential });
      nav("/", { replace: true });
    } catch (err) {
      setError((err as Error)?.message || "Google login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = async () => {
    if (!user) return;
    setError(null);
    setBusy(true);
    try {
      await completeOnboarding(user.name || "Student", selectedRole, profile.targetExam);
      nav("/", { replace: true });
    } catch (err) {
      setError((err as Error)?.message || "Could not save your role. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboarding-root">
      <main className="onboarding-screen">
        <div className="onboarding-card onboarding-card--compact">
          {!showRolePicker ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="logo-mark" style={{ background: GOLD, color: BG }}>
                  <Icon name="zap" size={20} color={BG} />
                </div>
              </div>
              {error ? <div className="mb-4 rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(248,113,113,0.12)", color: "#fff" }}>{error}</div> : null}
              <div ref={buttonRef} className="flex justify-center" />
              {busy ? <div className="mt-3 text-sm" style={{ color: "#8b95b0" }}>Signing in…</div> : null}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="logo-mark" style={{ background: GOLD, color: BG }}>
                  <Icon name="zap" size={20} color={BG} />
                </div>
                <div>
                  <div className="card-title" style={{ marginTop: 0 }}>Who are you?</div>
                  <div className="card-sub">Choose your role once</div>
                </div>
              </div>

              {error ? <div className="mb-4 rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(248,113,113,0.12)", color: "#fff" }}>{error}</div> : null}

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("student")}
                  className="rounded-2xl border px-4 py-4 text-left"
                  style={{ borderColor: selectedRole === "student" ? GOLD : "rgba(255,255,255,0.08)", background: selectedRole === "student" ? "rgba(238,179,43,0.12)" : "#071028" }}
                >
                  <div className="font-bold">Student</div>
                  <div className="text-[12px] mt-1" style={{ color: "#8b95b0" }}>Practice quizzes, papers, and progress tracking.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("teacher")}
                  className="rounded-2xl border px-4 py-4 text-left"
                  style={{ borderColor: selectedRole === "teacher" ? GOLD : "rgba(255,255,255,0.08)", background: selectedRole === "teacher" ? "rgba(238,179,43,0.12)" : "#071028" }}
                >
                  <div className="font-bold">Teacher</div>
                  <div className="text-[12px] mt-1" style={{ color: "#8b95b0" }}>Create classes and manage student access.</div>
                </button>
              </div>

              <button onClick={handleContinue} disabled={busy} className="btn-signin mt-5">
                {busy ? "Please wait…" : "Continue"}
              </button>
              <div className="mt-3 text-[11px] text-center" style={{ color: "#8b95b0" }}>
                Switching to teacher later will clear your student progress.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}