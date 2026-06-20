import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import UpgradeModal from "@/components/UpgradeModal";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import { QUESTION_BANK, TOPICS_BY_SUBJECT, filterQuestions } from "@/data/questions";
import { startSubscriptionCheckout } from "@/lib/razorpay";
import { canUseFeature, getRemaining, recordFeatureUse } from "@/lib/usageLimits";
import type { Difficulty, Question, Subject, Topic } from "@/lib/types";
import DppGeminiChat from "@/components/DppGeminiChat";

const SUBJECTS: Subject[] = ["Mathematics", "Physics", "Chemistry", "Biology"];

const SUBJECT_META: Record<Subject, { label: string; icon: string; color: string; soft: string }> = {
  Mathematics: { label: "Maths", icon: "calculator", color: "#2563eb", soft: "#dbeafe" },
  Physics: { label: "Physics", icon: "atom", color: "#f97316", soft: "#ffedd5" },
  Chemistry: { label: "Chemistry", icon: "flask", color: "#16a34a", soft: "#dcfce7" },
  Biology: { label: "Biology", icon: "leaf", color: "#8b5cf6", soft: "#ede9fe" },
};

const DIFFICULTIES: Array<{ label: Difficulty; color: string; bg: string }> = [
  { label: "Easy", color: "#1d4ed8", bg: "#eff6ff" },
  { label: "Moderate", color: "#2563eb", bg: "#f8fafc" },
  { label: "Hard", color: "#ea580c", bg: "#fff7ed" },
];

const BOOKMARK_KEY = "examprep_dpp_bookmark_v1";

interface ChapterInfo {
  id: string;
  subject: Subject;
  name: string;
  classLevel?: string | null;
  examType?: string | null;
  questionCount: number;
}

interface PracticeSet {
  id: string;
  title: string;
  difficulty: Difficulty;
  questions: Question[];
}

function buildChapterLabel(chapter: ChapterInfo) {
  return `${chapter.classLevel ? `STD ${chapter.classLevel} - ` : ""}${chapter.name}`;
}

export default function Dpp() {
  const nav = useNavigate();
  const location = useLocation();
  const { profile, attempts, questions: appQuestions, updateProfile } = useApp();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(() => {
    const subjectParam = new URLSearchParams(location.search).get("subject");
    return SUBJECTS.includes(subjectParam as Subject) ? (subjectParam as Subject) : "Mathematics";
  });
  const [selectedChapter, setSelectedChapter] = useState<ChapterInfo | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [bookmarkedChapterId, setBookmarkedChapterId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(BOOKMARK_KEY);
  });

  const subscribed = profile.subscription?.active === true;
  const remainingViews = getRemaining("dpp", subscribed);
  const questionPool = appQuestions.length > 0 ? appQuestions : QUESTION_BANK;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.getTopics();
        if (!cancelled) setTopics(r.topics || []);
      } catch (e) {
        console.warn("[Dpp] failed to load topics:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chapters = useMemo(() => {
    const subjectSet = new Set<Subject>();
    for (const subject of SUBJECTS) {
      const hasTopicData = topics.some((topic) => topic.subject === subject);
      const hasQuestionData = questionPool.some((question) => question.subject === subject);
      const hasStaticData = (TOPICS_BY_SUBJECT[subject] || []).length > 0;
      if (hasTopicData || hasQuestionData || hasStaticData) {
        subjectSet.add(subject);
      }
    }

    return Array.from(subjectSet).flatMap((subject) => {
      const names = new Set<string>();
      topics.filter((topic) => topic.subject === subject).forEach((topic) => names.add(topic.name));
      (TOPICS_BY_SUBJECT[subject] || []).forEach((topicName) => names.add(topicName));
      questionPool.filter((question) => question.subject === subject).forEach((question) => names.add(question.topic));

      return Array.from(names).map((name) => {
        const matchingQuestions = questionPool.filter(
          (question) => question.subject === subject && question.topic === name,
        );
        const catalogueMatch = topics.find((topic) => topic.subject === subject && topic.name === name);
        return {
          id: `${subject}:${name}`,
          subject,
          name,
          classLevel: catalogueMatch?.classLevel ?? null,
          examType: catalogueMatch?.examType ?? null,
          questionCount: matchingQuestions.length,
        } satisfies ChapterInfo;
      });
    });
  }, [questionPool, topics]);

  useEffect(() => {
    if (selectedChapter) return;
    const nextChapter = chapters.find((chapter) => chapter.subject === selectedSubject) || chapters[0] || null;
    if (nextChapter) {
      if (nextChapter.subject !== selectedSubject) {
        setSelectedSubject(nextChapter.subject);
      }
      setSelectedChapter(nextChapter);
    }
  }, [chapters, selectedChapter, selectedSubject]);

  const subjectChapters = useMemo(
    () => chapters.filter((chapter) => chapter.subject === selectedSubject),
    [chapters, selectedSubject],
  );

  const chapterAttempts = useMemo(() => {
    if (!selectedChapter) return [];
    return attempts.filter(
      (attempt) => attempt.subject === selectedChapter.subject && attempt.title.toLowerCase().includes(selectedChapter.name.toLowerCase()),
    );
  }, [attempts, selectedChapter]);

  const chapterSets = useMemo(() => {
    if (!selectedChapter) return [] as PracticeSet[];
    return DIFFICULTIES.map((difficulty) => {
      const questions = filterQuestions(
        questionPool,
        selectedChapter.subject,
        selectedChapter.name,
        difficulty.label,
        "All",
        12,
      );
      return {
        id: `${selectedChapter.id}:${difficulty.label}`,
        title: `${difficulty.label} DPP`,
        difficulty: difficulty.label,
        questions,
      } satisfies PracticeSet;
    });
  }, [questionPool, selectedChapter]);

  const selectedSubjectMeta = SUBJECT_META[selectedSubject];
  const dppSetsAttempted = Math.min(3, chapterAttempts.length);

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

  const openSet = (setDef: PracticeSet) => {
    if (!subscribed && !canUseFeature("dpp", false)) {
      setUpgradeOpen(true);
      return;
    }

    recordFeatureUse("dpp");
    const chapterLabel = selectedChapter ? buildChapterLabel(selectedChapter) : "DPP";
    nav(`/quiz/${encodeURIComponent(setDef.id)}`, {
      state: {
        title: `${chapterLabel} - ${setDef.title}`,
        questions: setDef.questions,
        timeLimitMin: 15,
        examType: selectedChapter?.examType || profile.targetExam || "All",
        subject: selectedChapter?.subject || selectedSubject,
        topic: selectedChapter?.name || "All",
        difficulty: setDef.difficulty,
      },
    });
  };

  const toggleBookmark = () => {
    if (!selectedChapter) return;
    const nextValue = bookmarkedChapterId === selectedChapter.id ? null : selectedChapter.id;
    setBookmarkedChapterId(nextValue);
    if (typeof window !== "undefined") {
      if (nextValue) {
        window.localStorage.setItem(BOOKMARK_KEY, nextValue);
      } else {
        window.localStorage.removeItem(BOOKMARK_KEY);
      }
    }
  };

  if (loading && chapters.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ color: colors.mutedForeground }}>
        <Spinner size={24} />
      </div>
    );
  }

  if (!selectedChapter) {
    return null;
  }

  return (
    <div className="min-h-full px-4 pt-4 pb-28 md:px-5 md:pt-5">
      <div className="rounded-[30px] border bg-[#eef5ff] p-4 md:p-5" style={{ borderColor: "#dbeafe" }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <button
            onClick={() => nav(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: colors.secondary }}
          >
            <Icon name="arrow-left" size={20} color={colors.foreground} />
          </button>
          <div className="flex-1 text-center pr-10 md:pr-0">
            <div className="text-[20px] md:text-[22px] font-bold" style={{ color: colors.foreground }}>
              DPP Practice
            </div>
            <div className="text-[13px] mt-0.5" style={{ color: colors.mutedForeground }}>
              {selectedSubjectMeta.label} · {selectedChapter.classLevel ? `STD ${selectedChapter.classLevel} · ` : ""}{selectedChapter.name}
            </div>
          </div>
          <div className="w-10" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="rounded-[26px] border bg-white p-3 md:p-4" style={{ borderColor: "#dbeafe" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: selectedSubjectMeta.soft }}>
                <Icon name={selectedSubjectMeta.icon} size={22} color={selectedSubjectMeta.color} />
              </div>
              <div>
                <div className="text-[18px] font-bold" style={{ color: colors.foreground }}>{selectedSubjectMeta.label}</div>
                <div className="text-[12px]" style={{ color: colors.mutedForeground }}>{subjectChapters.length} chapters</div>
              </div>
            </div>

            <div className="space-y-3">
              {SUBJECTS.map((subject) => {
                const meta = SUBJECT_META[subject];
                const active = selectedSubject === subject;
                const count = chapters.filter((chapter) => chapter.subject === subject).length;
                return (
                  <button
                    key={subject}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedChapter(chapters.find((chapter) => chapter.subject === subject) || null);
                    }}
                    className="w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition"
                    style={{
                      background: active ? "#fff" : colors.card,
                      borderColor: active ? meta.color : colors.border,
                      boxShadow: active ? `0 8px 24px ${meta.color}12` : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: meta.soft }}>
                        <Icon name={meta.icon} size={18} color={meta.color} />
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>{meta.label}</div>
                        <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{count} chapters</div>
                      </div>
                    </div>
                    <Icon name="chevron-right" size={18} color={active ? meta.color : colors.mutedForeground} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[26px] border bg-white p-3 md:p-4" style={{ borderColor: "#dbeafe" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-[18px] font-bold" style={{ color: colors.foreground }}>All chapters ({subjectChapters.length})</div>
                <div className="text-[12px]" style={{ color: colors.mutedForeground }}>
                  Select a chapter to open its Easy, Moderate, and Tough DPP sets.
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: colors.border }}>
                <Icon name="clock" size={14} color={colors.primary} />
                <span className="text-[12px] font-semibold" style={{ color: colors.foreground }}>
                  {remainingViews === "Unlimited" ? "Unlimited" : `${remainingViews} views left`}
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[530px] overflow-y-auto pr-1">
              {subjectChapters.map((chapter) => {
                const active = chapter.id === selectedChapter.id;
                const completed = Math.min(3, Math.max(0, Math.round(chapter.questionCount / 4)));
                return (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter)}
                    className="w-full rounded-[20px] border px-4 py-3 text-left transition"
                    style={{
                      background: active ? "#eff6ff" : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      boxShadow: active ? "0 14px 28px rgba(37, 99, 235, 0.12)" : "none",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[16px] font-semibold truncate" style={{ color: colors.foreground }}>
                          {buildChapterLabel(chapter)}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: colors.mutedForeground }}>
                          {chapter.questionCount} Qs · {completed}/3 sets attempted
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ background: "#dcfce7", color: "#16a34a" }}>
                          Free
                        </span>
                        <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border bg-white p-4 md:p-5" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>
              {buildChapterLabel(selectedChapter)} DPPs
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: colors.mutedForeground }}>
              Pick a difficulty and start a timed practice set.
            </div>
          </div>
          <button
            onClick={toggleBookmark}
            className="rounded-full border px-3 py-2 text-[12px] font-semibold"
            style={{
              borderColor: bookmarkedChapterId === selectedChapter.id ? colors.primary : colors.border,
              color: bookmarkedChapterId === selectedChapter.id ? colors.primary : colors.foreground,
              background: bookmarkedChapterId === selectedChapter.id ? "#eff6ff" : "#fff",
            }}
          >
            <Icon name="bookmark" size={14} color={bookmarkedChapterId === selectedChapter.id ? colors.primary : colors.foreground} />
            <span className="ml-1">{bookmarkedChapterId === selectedChapter.id ? "Bookmarked" : "Bookmark"}</span>
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {DIFFICULTIES.map((difficulty, index) => {
            const setDef = chapterSets[index];
            return (
              <div key={difficulty.label} className="rounded-[22px] border p-3 md:p-4" style={{ borderColor: colors.border, background: difficulty.bg }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[16px] font-bold" style={{ color: difficulty.color }}>{difficulty.label}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: colors.mutedForeground }}>
                    {setDef.questions.length} questions
                  </div>
                </div>

                <button
                  onClick={() => openSet(setDef)}
                  className="w-full rounded-[18px] border bg-white px-4 py-3 text-left transition hover:shadow-sm"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>
                        {setDef.title}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: colors.mutedForeground }}>
                        Tap to start the practice set.
                      </div>
                    </div>
                    <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <DppGeminiChat subject={selectedChapter.subject} chapter={selectedChapter.name} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="w-full max-w-[420px] rounded-[22px] border bg-white shadow-[0_20px_48px_rgba(15,23,42,0.08)]" style={{ borderColor: colors.border }}>
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: colors.border }}>
            <button
              onClick={() => nav("/")}
              className="flex items-center justify-center gap-2 py-4 text-[15px] font-semibold"
              style={{ color: colors.foreground }}
            >
              <Icon name="arrow-left" size={18} color={colors.foreground} />
              Go Home
            </button>
            <button
              onClick={toggleBookmark}
              className="flex items-center justify-center gap-2 py-4 text-[15px] font-semibold"
              style={{ color: colors.primary }}
            >
              <Icon name="bookmark" size={18} color={colors.primary} />
              Bookmark
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgrade={handleUpgradeNow}
        loading={paying}
        mode="dpp"
      />
    </div>
  );
}
