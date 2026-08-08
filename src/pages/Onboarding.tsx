import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { ExamType, Role } from "@/lib/types";
import "@/onboarding.css";

declare global {
  interface Window {
    google: any;
  }
}

const GOLD = "#EEB32B";
const BG = "#040718";

type OnboardingStage = "role" | "student-path" | "class" | "exam";

const CLASS_LEVELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
type ClassLevelChoice = (typeof CLASS_LEVELS)[number];
const EXAM_OPTIONS: ExamType[] = ["NEET", "JEE", "BITS", "BOARD"];

export default function Onboarding() {
  const { user, isAuthenticated, loginWithGoogle } = useAuth();
  const { profile, completeOnboarding } = useApp();
  const nav = useNavigate();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState<OnboardingStage>("role");
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [selectedClassLevel, setSelectedClassLevel] = useState<ClassLevelChoice | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamType>("NEET");
  const [referralCode, setReferralCode] = useState("");
  const [refStatus, setRefStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showOnboarding = isAuthenticated && !profile.isOnboarded;

  // Prefill referral code from the share link (?ref=GURU-XXXX) and validate it.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) return;
    const code = ref.trim().toUpperCase();
    setReferralCode(code);
    api
      .validateReferralCode(code)
      .then((r) => {
        if (r.valid) {
          setRefStatus({ ok: true, msg: `Valid code from ${r.referrer?.name || "a Gurtron user"}` });
        } else {
          setRefStatus({ ok: false, msg: "Invalid referral code" });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showOnboarding) return;

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
  }, [showOnboarding]);

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
    const referredByCode = referralCode.trim() || undefined;
    try {
      if (selectedRole === "teacher") {
        await completeOnboarding(user.name || "Teacher", "teacher", profile.targetExam, {
          referredByCode,
        });
      } else if (stage === "class") {
        await completeOnboarding(user.name || "Student", "student", "BOARD", {
          classLevel: selectedClassLevel || undefined,
          skipClassJoin: true,
          referredByCode,
        });
      } else if (stage === "exam") {
        await completeOnboarding(user.name || "Student", "student", selectedExam, {
          skipClassJoin: true,
          referredByCode,
        });
      }
      nav("/", { replace: true });
    } catch (err) {
      setError((err as Error)?.message || "Could not save your role. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const checkReferral = async () => {
    const code = referralCode.trim();
    if (!code) {
      setRefStatus(null);
      return;
    }
    try {
      const r = await api.validateReferralCode(code);
      if (r.valid) {
        setRefStatus({ ok: true, msg: `Valid code from ${r.referrer?.name || "a Gurtron user"}` });
      } else {
        setRefStatus({ ok: false, msg: r.reason === "self" ? "You can't use your own code" : "Invalid referral code" });
      }
    } catch {
      setRefStatus(null);
    }
  };

  // Reusable optional referral input shown on the final onboarding steps.
  const ReferralField = (
    <div className="mt-4 text-left">
      <div className="text-[13px] font-semibold mb-1" style={{ color: "#fff" }}>
        Were you referred by someone?
      </div>
      <input
        value={referralCode}
        onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setRefStatus(null); }}
        onBlur={checkReferral}
        placeholder="Enter Referral Code (Optional)"
        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
        style={{ background: "#071028", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
      />
      {refStatus ? (
        <div className="mt-1 text-[12px]" style={{ color: refStatus.ok ? "#34d399" : "#f87171" }}>
          {refStatus.msg}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="onboarding-root">
      <main className="onboarding-screen">
        <div className="onboarding-card onboarding-card--compact">
          {!showOnboarding ? (
            <div className="brand-hero text-center">
              <div className="brand-orb brand-orb--left" />
              <div className="brand-orb brand-orb--right" />
              <div className="hero-frame">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="logo-mark logo-mark--large" style={{ background: GOLD, color: BG }}>
                    <Icon name="zap" size={24} color={BG} />
                  </div>
                </div>
                <div className="brand-name">Gurtron</div>
                <div className="brand-tagline">Built for 1 % Who refuses average</div>
                <div className="brand-graphic" aria-hidden="true">
                  <div className="brand-arc brand-arc--one" />
                  <div className="brand-arc brand-arc--two" />
                  <div className="brand-card brand-card--one">
                    <span className="brand-card-label">Focus</span>
                    <span className="brand-card-value">99%</span>
                  </div>
                  <div className="brand-card brand-card--two">
                    <span className="brand-card-label">Edge</span>
                    <span className="brand-card-value">Elite</span>
                  </div>
                </div>
              </div>
              {error ? <div className="mb-4 rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(248,113,113,0.12)", color: "#fff" }}>{error}</div> : null}
              <div ref={buttonRef} className="flex justify-center" />
              {busy ? <div className="mt-3 text-sm" style={{ color: "#8b95b0" }}>Signing in…</div> : null}
            </div>
          ) : (
            <div>
              {stage === "role" && (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="logo-mark" style={{ background: GOLD, color: BG }}>
                      <Icon name="zap" size={20} color={BG} />
                    </div>
                    <div>
                      <div className="card-title" style={{ marginTop: 0 }}>Who are you?</div>
                      <div className="card-sub">Choose student or teacher</div>
                    </div>
                  </div>

                  {error ? <div className="mb-4 rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(248,113,113,0.12)", color: "#fff" }}>{error}</div> : null}

                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("student");
                        setStage("student-path");
                      }}
                      className="onboarding-choice-card onboarding-choice-card--active"
                    >
                      <div className="font-bold">Student</div>
                      <div className="text-[12px] mt-1" style={{ color: "#8b95b0" }}>Class 1-12 or exam prep like NEET, JEE, BITS.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("teacher")}
                      className="onboarding-choice-card"
                      style={{ borderColor: selectedRole === "teacher" ? GOLD : "rgba(255,255,255,0.08)", background: selectedRole === "teacher" ? "rgba(238,179,43,0.12)" : "#071028" }}
                    >
                      <div className="font-bold">Teacher</div>
                      <div className="text-[12px] mt-1" style={{ color: "#8b95b0" }}>Create classes and manage student access.</div>
                    </button>
                  </div>

                  <button
                    onClick={handleContinue}
                    disabled={busy || selectedRole !== "teacher"}
                    className="btn-signin mt-5"
                  >
                    {busy ? "Please wait…" : selectedRole === "teacher" ? "Continue as teacher" : "Choose Student to continue"}
                  </button>
                  {selectedRole === "teacher" ? ReferralField : null}
                </>
              )}

              {stage === "student-path" && (
                <>
                  <div className="onboarding-modal">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <button type="button" onClick={() => setStage("role")} className="back-button">
                        <Icon name="arrow-left" size={16} color={GOLD} /> Back
                      </button>
                      <div className="card-title" style={{ marginTop: 0 }}>Pick your path</div>
                      <div style={{ width: 54 }} />
                    </div>

                    <div className="card-sub mb-4" style={{ marginTop: 0 }}>
                      Choose school classes or exam prep. The next popup will ask for the exact class or exam.
                    </div>

                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => setStage("class")}
                        className="onboarding-choice-card onboarding-choice-card--active"
                      >
                        <div className="font-bold">Class 1-12</div>
                        <div className="text-[12px] mt-1" style={{ color: "#8b95b0" }}>Open the class picker with 12 boxes.</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStage("exam")}
                        className="onboarding-choice-card onboarding-choice-card--active"
                      >
                        <div className="font-bold">JEE / NEET / BITS / Board</div>
                        <div className="text-[12px] mt-1" style={{ color: "#8b95b0" }}>Open the exam picker and continue.</div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {stage === "class" && (
                <>
                  <div className="onboarding-modal">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <button type="button" onClick={() => setStage("student-path")} className="back-button">
                        <Icon name="arrow-left" size={16} color={GOLD} /> Back
                      </button>
                      <div className="card-title" style={{ marginTop: 0 }}>Select class</div>
                      <div style={{ width: 54 }} />
                    </div>

                    <div className="card-sub mb-4" style={{ marginTop: 0 }}>
                      Pick one class and we’ll open the same app for that level.
                    </div>

                    <div className="class-grid class-grid--wide">
                      {CLASS_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSelectedClassLevel(level)}
                          className="class-pill"
                          style={{
                            borderColor: selectedClassLevel === level ? GOLD : "rgba(255,255,255,0.08)",
                            background: selectedClassLevel === level ? "rgba(238,179,43,0.18)" : "#071028",
                            color: selectedClassLevel === level ? GOLD : "#fff",
                          }}
                        >
                          Class {level}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleContinue} disabled={busy || !selectedClassLevel} className="btn-signin mt-5">
                      {busy ? "Please wait…" : "Enter"}
                    </button>
                    {ReferralField}
                    <div className="mt-3 text-[11px] text-center" style={{ color: "#8b95b0" }}>
                      Choose any class from 1 to 12 to continue.
                    </div>
                  </div>
                </>
              )}

              {stage === "exam" && (
                <>
                  <div className="onboarding-modal">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <button type="button" onClick={() => setStage("student-path")} className="back-button">
                        <Icon name="arrow-left" size={16} color={GOLD} /> Back
                      </button>
                      <div className="card-title" style={{ marginTop: 0 }}>Choose exam</div>
                      <div style={{ width: 54 }} />
                    </div>

                    <div className="card-sub mb-4" style={{ marginTop: 0 }}>
                      Tap the exam track you want and we’ll set the app for that prep mode.
                    </div>

                    <div className="exam-grid">
                      {EXAM_OPTIONS.map((exam) => (
                        <button
                          key={exam}
                          type="button"
                          onClick={() => setSelectedExam(exam)}
                          className="class-pill exam-pill"
                          style={{
                            borderColor: selectedExam === exam ? GOLD : "rgba(255,255,255,0.08)",
                            background: selectedExam === exam ? "rgba(238,179,43,0.18)" : "#071028",
                            color: selectedExam === exam ? GOLD : "#fff",
                          }}
                        >
                          {exam}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleContinue} disabled={busy} className="btn-signin mt-5">
                      {busy ? "Please wait…" : "Enter"}
                    </button>
                    {ReferralField}
                    <div className="mt-3 text-[11px] text-center" style={{ color: "#8b95b0" }}>
                      We’ll open the same app, but tuned for your exam.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}