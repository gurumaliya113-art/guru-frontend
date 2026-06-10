// PreviousYearPapers — student-facing catalogue of admin-curated previous
// year papers and mock tests. We show summaries (light payload) on this
// list page; the full questions array is fetched only when a student
// opens a specific paper. The server enforces the "first 5 free" paywall
// on the detail endpoint (HTTP 402 with code: "PAYWALL"), so we don't
// have to trust client-side gating.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import UpgradeModal from "@/components/UpgradeModal";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors, examColor, examLight } from "@/lib/colors";
import { startSubscriptionCheckout } from "@/lib/razorpay";
import { canUseFeature, getRemaining, getUsageStats, recordFeatureUse } from "@/lib/usageLimits";
import type { ExamType, Flashcard, PreviousYearPaperSummary, Topic } from "@/lib/types";
import AIChat from "@/components/AIChat";

const SUBSCRIPTION_PLANS = [
  { id: "7d-29", label: "7 days", amount: 29, subtitle: "Short access" },
  { id: "30d-99", label: "30 days", amount: 99, subtitle: "Most popular" },
  { id: "3m-249", label: "3 months", amount: 249, subtitle: "Best value" },
  { id: "lifetime-999", label: "Lifetime", amount: 999, subtitle: "Unlimited access" },
] as const;

const ALL_EXAMS: (ExamType | "ALL")[] = ["ALL", "NEET", "JEE", "BOARD"];

const FLASHCARD_DECK = [
  {
    id: 1,
    tag: "Biology",
    gradient: "linear-gradient(145deg, #0b1220 0%, #172554 45%, #2563eb 100%)",
    accent: "#bfdbfe",
    front: "What is the powerhouse of the cell?",
    back: "The mitochondrion releases energy through cellular respiration.",
  },
  {
    id: 2,
    tag: "Physics",
    gradient: "linear-gradient(145deg, #4c1d95 0%, #7c3aed 45%, #22d3ee 100%)",
    accent: "#ede9fe",
    front: "What happens to the image in a plane mirror?",
    back: "It appears virtual, upright, and the same size as the object.",
  },
  {
    id: 3,
    tag: "Chemistry",
    gradient: "linear-gradient(145deg, #7c2d12 0%, #ea580c 48%, #fbbf24 100%)",
    accent: "#ffedd5",
    front: "Why do atoms form chemical bonds?",
    back: "To achieve a more stable electronic configuration.",
  },
];

export default function PreviousYearPapers() {
  const nav = useNavigate();
  const { profile, addPaper, updateProfile } = useApp();

  const [pyps, setPyps] = useState<PreviousYearPaperSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ExamType | "ALL">(
    (profile.targetExam as ExamType) || "ALL",
  );
  const [opening, setOpening] = useState<string | null>(null);
  const [showing, setShowing] = useState<"papers" | "chat" | "flashcards">("papers");
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [paywall, setPaywall] = useState<{ message: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"papers" | "flashcards">("papers");

  const handleUpgradeNow = () => {
    setPaying(true);
    startSubscriptionCheckout(
      { name: profile.name, phone: profile.phone },
      async (sub) => {
        await updateProfile({ subscription: sub });
        setPaying(false);
        setUpgradeOpen(false);
        alert("Subscription activated! Enjoy unlimited access 🎉");
      },
      (err) => {
        setPaying(false);
        alert(`Payment failed: ${err.message}`);
      },
    );
  };

  const openUpgradeModal = (reason: "papers" | "flashcards") => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.getPyps();
        if (!cancelled) setPyps(r.pyps || []);
      } catch (e) {
        if (!cancelled) setError(String((e as Error).message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [topicsRes, flashcardsRes] = await Promise.all([
          api.getTopics(),
          api.getFlashcards(),
        ]);
        setTopics(topicsRes.topics || []);
        setFlashcards(flashcardsRes.flashcards || []);
      } catch (e) {
        console.warn("[Flashcards] failed to load deck data:", e);
      }
    })();
  }, []);

  // Sort oldest-first so the "first 5 free" slots are stable across loads.
  const sorted = useMemo(() => {
    return [...pyps].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return ta - tb;
    });
  }, [pyps]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return sorted;
    return sorted.filter((p) => p.examType === filter);
  }, [sorted, filter]);

  const subscribed = profile.subscription?.active === true;
  const usageStats = getUsageStats();
  const papersRemaining = getRemaining("papers", subscribed);
  const flashcardsRemaining = getRemaining("flashcards", subscribed);

  const baseDeck = flashcards.length > 0 ? flashcards : FLASHCARD_DECK;
  const topicOptions = useMemo(() => {
    const names = new Set<string>(['All Topics']);
    baseDeck.forEach((card) => names.add(card.topic));
    topics.forEach((t) => names.add(t.name));
    return [...names].slice(0, 12);
  }, [baseDeck, topics]);

  const visibleDeck = useMemo(() => {
    if (selectedTopic === 'All Topics') return baseDeck;
    return baseDeck.filter((card) => card.topic === selectedTopic);
  }, [baseDeck, selectedTopic]);

  const currentDeck = visibleDeck.length > 0 ? visibleDeck : baseDeck;

  const handleOpen = async (p: PreviousYearPaperSummary, indexInGlobal: number) => {
    // Client-side hint: if this PYP is beyond the free quota and the user is
    // unsubscribed, surface the paywall immediately without round-tripping.
    // The server enforces the same rule so this is purely a UX shortcut.
    if (indexInGlobal >= 5 && !subscribed) {
      setPaywall({
        message: "First 5 papers / mocks are free. Subscribe from ₹29 to unlock the rest.",
      });
      return;
    }

    setOpening(p.id);
    try {
      const r = await api.getPyp(p.id);
      // Hand the PYP off to the existing PaperView by stashing it into the
      // user's paper cache as a regular GeneratedPaper. The id is namespaced
      // ("pyp_…") so it never collides with user-generated paper ids.
      await addPaper({
        id: r.pyp.id,
        title: r.pyp.title,
        examType: r.pyp.examType,
        subject: (r.pyp.subject as never) || ("Physics" as never),
        topic: "Previous Year",
        difficulty: "Moderate",
        durationMinutes: r.pyp.durationMinutes,
        questions: r.pyp.questions,
        createdAt: r.pyp.createdAt,
        skipHeader: true,
      });
      nav(`/paper/${r.pyp.id}`);
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e);
      if (msg.includes("PAYWALL") || msg.includes("402")) {
        setPaywall({
          message:
            "First 5 papers / mocks are free. Subscribe from ₹29 to unlock the rest.",
        });
      } else {
        setError(msg);
      }
    } finally {
      setOpening(null);
    }
  };

  const handleAttempt = async (p: PreviousYearPaperSummary, indexInGlobal: number) => {
    if (!subscribed && !canUseFeature("papers", false)) {
      openUpgradeModal("papers");
      return;
    }

    if (indexInGlobal >= 5 && !subscribed) {
      setPaywall({
        message: "First 5 papers / mocks are free. Subscribe from ₹29 to unlock the rest.",
      });
      return;
    }

    setOpening(p.id);
    try {
      const r = await api.getPyp(p.id);
      recordFeatureUse("papers");
      nav(`/quiz/${r.pyp.id}`, {
        state: {
          title: r.pyp.title,
          questions: r.pyp.questions,
          timeLimitMin: r.pyp.durationMinutes ?? 180,
          examType: r.pyp.examType,
          subject: r.pyp.subject || "All",
          topic: "Previous Year",
          difficulty: "Moderate",
        },
      });
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e);
      if (msg.includes("PAYWALL") || msg.includes("402")) {
        setPaywall({
          message:
            "First 5 papers / mocks are free. Subscribe from ₹29 to unlock the rest.",
        });
      } else {
        setError(msg);
      }
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="min-h-full max-w-[640px] mx-auto pb-20">
      {/* Top bar */}
      <div
        className="flex items-center gap-2.5 px-4 pt-12 pb-3 border-b bg-white sticky top-0 z-10"
        style={{ borderColor: colors.border }}
      >
        <button
          onClick={() => nav(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: colors.secondary }}
        >
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="flex-1">
          <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>
            Super App
          </div>
          <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
            NEET · JEE · Board · curated by admin
          </div>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="px-4 pt-4 pb-2 flex gap-2 border-b" style={{ borderColor: colors.border }}>
        <button
          onClick={() => setShowing("papers")}
          className="px-4 py-2 rounded-lg font-semibold text-[13px]"
          style={{
            background: showing === "papers" ? colors.primary : colors.secondary,
            color: showing === "papers" ? "#fff" : colors.foreground,
          }}
        >
          📚 Papers
        </button>
        <button
          onClick={() => setShowing("chat")}
          className="px-4 py-2 rounded-lg font-semibold text-[13px]"
          style={{
            background: showing === "chat" ? colors.primary : colors.secondary,
            color: showing === "chat" ? "#fff" : colors.foreground,
          }}
        >
          🤖 AI Chat
        </button>
        <button
          onClick={() => setShowing("flashcards")}
          className="px-4 py-2 rounded-lg font-semibold text-[13px]"
          style={{
            background: showing === "flashcards" ? colors.primary : colors.secondary,
            color: showing === "flashcards" ? "#fff" : colors.foreground,
          }}
        >
          🃏 Flashcards
        </button>
      </div>

      {showing === "papers" ? (
        <div className="px-4 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {ALL_EXAMS.map((e) => {
              const active = filter === e;
              const c = e === "ALL" ? colors.primary : examColor(e);
              return (
                <button
                  key={e}
                  onClick={() => setFilter(e)}
                  className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap"
                  style={{
                    background: active ? c : colors.secondary,
                    color: active ? "#fff" : colors.mutedForeground,
                    border: `1px solid ${active ? c : colors.border}`,
                  }}
                >
                  {e === "ALL" ? "All" : e}
                </button>
              );
            })}
          </div>

          {paywall ? (
            <div
              className="rounded-2xl p-3.5 mb-4 border text-[13px]"
              style={{ background: "#fff7ed", borderColor: "#fdba74", color: "#9a5b00" }}
            >
              {paywall.message}
            </div>
          ) : null}

          {/* Free trial banner */}
          {!subscribed && (
            <div
              className="rounded-2xl p-4 mb-4 border flex items-center gap-3"
              style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", borderColor: "#fcd34d" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#fff" }}
              >
                <Icon name="gift" size={20} color="#d97706" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold" style={{ color: "#7c2d12" }}>
                  Free Trial: 7 Days
                </div>
                <div className="text-[12px]" style={{ color: "#92400e" }}>
                  Try Super App completely free • AI Chat • Papers & Mocks
                </div>
              </div>
              <button
                onClick={handleUpgradeNow}
                disabled={paying}
                className="px-4 py-2 rounded-lg text-white text-[13px] font-semibold disabled:opacity-60 shrink-0"
                style={{ background: "#d97706" }}
              >
                {paying ? "…" : "Upgrade Now"}
              </button>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner size={24} />
            </div>
          ) : error ? (
            <div
              className="rounded-2xl p-4 border text-[13px]"
              style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}
            >
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="rounded-2xl p-8 border-2 border-dashed text-center"
              style={{ borderColor: colors.border }}
            >
              <Icon name="inbox" size={28} color={colors.mutedForeground} />
              <div
                className="text-[14px] font-semibold mt-2"
                style={{ color: colors.foreground }}
              >
                No papers in this catalogue yet
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: colors.mutedForeground }}
              >
                Admin is uploading. Check back soon!
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((p) => {
                const globalIdx = sorted.findIndex((x) => x.id === p.id);
                const locked = globalIdx >= 5 && !subscribed;
                const ec = examColor(p.examType);
                const el = examLight(p.examType);
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl p-3.5 border bg-white shadow-sm"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative"
                        style={{ background: el }}
                      >
                        <Icon name="file-text" size={18} color={ec} />
                        {locked && (
                          <div
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: "#fef3c7" }}
                          >
                            <Icon name="lock" size={10} color="#d97706" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[14px] font-semibold truncate"
                          style={{ color: colors.foreground }}
                        >
                          {p.title}
                        </div>
                        <div
                          className="flex items-center gap-2 mt-0.5 text-[11px]"
                          style={{ color: colors.mutedForeground }}
                        >
                          <span
                            className="px-1.5 py-0.5 rounded-md font-bold"
                            style={{ background: el, color: ec }}
                          >
                            {p.examType}
                          </span>
                          <span>· {p.year}</span>
                          {p.subject && <span>· {p.subject}</span>}
                          <span>· {p.questionCount}Q</span>
                          {p.durationMinutes && <span>· {p.durationMinutes} min</span>}
                        </div>
                      </div>
                      {opening === p.id ? (
                        <Spinner size={16} />
                      ) : (
                        <Icon
                          name={locked ? "lock" : "chevron-right"}
                          size={16}
                          color={locked ? "#d97706" : colors.mutedForeground}
                        />
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleOpen(p, globalIdx)}
                        disabled={opening === p.id}
                        className="flex-1 min-w-[120px] rounded-2xl border py-2 text-sm font-semibold"
                        style={{
                          background: colors.secondary,
                          borderColor: colors.border,
                          color: colors.foreground,
                        }}
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleAttempt(p, globalIdx)}
                        disabled={opening === p.id}
                        className="flex-1 min-w-[120px] rounded-2xl py-2 text-sm font-semibold"
                        style={{
                          background: locked ? "#fef3c7" : colors.primary,
                          color: locked ? "#92400e" : "#fff",
                          borderColor: locked ? colors.border : colors.primary,
                        }}
                      >
                        {locked ? "Locked" : "Attempt Exam"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : showing === "chat" ? (
        <div className="flex-1 p-4">
          <AIChat />
        </div>
      ) : (
        <div className="px-4 pt-4 pb-20 space-y-4">
          <div className="rounded-2xl border p-4" style={{ background: "#fff", borderColor: colors.border }}>
            <div className="text-[14px] font-semibold" style={{ color: colors.foreground }}>
              Quick Flashcards
            </div>
            <div className="text-[12px] mt-1" style={{ color: colors.mutedForeground }}>
              Pick a topic, then flip one card at a time. Free users get 7 flashcard views per day.
            </div>
            {!subscribed && (
              <button
                onClick={() => openUpgradeModal("flashcards")}
                className="mt-2 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                style={{ background: "#fff7ed", color: "#9a5b00", border: "1px solid #fed7aa" }}
              >
                Upgrade for more access
              </button>
            )}
          </div>

          <div className="overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="flex gap-2 w-max">
              {topicOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(name);
                    setCurrentCardIndex(0);
                    setFlipped({});
                  }}
                  className="rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                  style={{
                    background: selectedTopic === name ? colors.primary : "#fff",
                    color: selectedTopic === name ? "#fff" : colors.foreground,
                    borderColor: colors.border,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border p-3" style={{ background: "#fff", borderColor: colors.border }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: colors.mutedForeground }}>
                  Deck {Math.min(currentCardIndex + 1, currentDeck.length)} / {currentDeck.length}
                </div>
                <div className="text-[12px] mt-1" style={{ color: colors.mutedForeground }}>
                  Small deck preview for quick revision.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!subscribed && !canUseFeature("flashcards", false)) {
                      openUpgradeModal("flashcards");
                      return;
                    }
                    recordFeatureUse("flashcards");
                    const nextIndex = currentCardIndex === 0 ? Math.max(currentDeck.length - 1, 0) : currentCardIndex - 1;
                    setFlipped((prev) => ({ ...prev, [currentDeck[currentCardIndex]?.id || ""]: false }));
                    setCurrentCardIndex(nextIndex);
                  }}
                  className="rounded-full border px-2.5 py-1.5 text-[11px] font-semibold"
                  style={{ background: "#fff", borderColor: colors.border, color: colors.foreground }}
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!subscribed && !canUseFeature("flashcards", false)) {
                      openUpgradeModal("flashcards");
                      return;
                    }
                    recordFeatureUse("flashcards");
                    const nextIndex = (currentCardIndex + 1) % Math.max(currentDeck.length, 1);
                    setFlipped((prev) => ({ ...prev, [currentDeck[currentCardIndex]?.id || ""]: false }));
                    setCurrentCardIndex(nextIndex);
                  }}
                  className="rounded-full border px-2.5 py-1.5 text-[11px] font-semibold"
                  style={{ background: "#fff", borderColor: colors.border, color: colors.foreground }}
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              {(() => {
                const card = currentDeck[currentCardIndex] || currentDeck[0];
                if (!card) return null;
                const isFlipped = !!flipped[card.id];
                const gradient = ("gradient" in card && card.gradient) ? card.gradient : "linear-gradient(145deg, #0b1220 0%, #172554 45%, #2563eb 100%)";
                const accent = ("accent" in card && card.accent) ? card.accent : "#bfdbfe";
                const tag = ("tag" in card && card.tag) ? card.tag : card.topic;
                const question = ("front" in card && card.front) ? card.front : card.question;
                const answer = ("back" in card && card.back) ? card.back : card.answer;

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setFlipped((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                    className="w-full rounded-[24px] border text-left transition active:scale-[0.98]"
                    style={{
                      minHeight: 140,
                      background: isFlipped ? "linear-gradient(145deg, #fff 0%, #fff7ed 100%)" : gradient,
                      borderColor: isFlipped ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.12)",
                      boxShadow: isFlipped
                        ? "0 24px 42px rgba(15, 23, 42, 0.18)"
                        : "0 18px 34px rgba(15, 23, 42, 0.18)",
                      perspective: 1200,
                    }}
                  >
                    <div
                      className="relative h-[140px] w-full rounded-[24px] p-3"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        transition: "transform 0.65s ease",
                      }}
                    >
                      <div
                        className="absolute inset-0 flex flex-col justify-between rounded-[24px] border p-3"
                        style={{
                          backfaceVisibility: "hidden",
                          borderColor: "rgba(255,255,255,0.14)",
                          background: gradient,
                        }}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent }}>
                          {tag} · Question
                        </span>
                        <div className="text-[13px] font-semibold leading-5" style={{ color: "#fff" }}>
                          {question}
                        </div>
                        <span className="text-[11px]" style={{ color: "#e5eefb" }}>
                          Tap to reveal the answer
                        </span>
                      </div>
                      <div
                        className="absolute inset-0 flex flex-col justify-between rounded-[24px] border p-3"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                          borderColor: "rgba(15, 23, 42, 0.08)",
                          background: "linear-gradient(145deg, #fff 0%, #fff7ed 100%)",
                        }}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#d97706" }}>
                          Answer
                        </span>
                        <div className="text-[12px] font-semibold leading-5" style={{ color: colors.foreground }}>
                          {answer}
                        </div>
                        <span className="text-[11px]" style={{ color: colors.mutedForeground }}>
                          Tap to flip back
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgrade={handleUpgradeNow}
        loading={paying}
      />
    </div>
  );
}
