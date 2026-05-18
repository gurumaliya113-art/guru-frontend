import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { adminApi } from "@/lib/api";
import { colors, difficultyColor, examColor, examLight, subjectColor } from "@/lib/colors";
import type { Difficulty, Question, Topic } from "@/lib/types";

const DIFFICULTIES: (Difficulty | "All")[] = ["All", "Easy", "Moderate", "Hard"];

// Top-level categories — a category is either a class ("Class 10") or an exam track ("JEE").
// Both are first-class browse axes for the admin question bank.
type Category =
  | { kind: "class"; value: string; label: string }
  | { kind: "exam"; value: string; label: string };

const EXAM_CATEGORIES: Category[] = [
  { kind: "exam", value: "NEET", label: "NEET" },
  { kind: "exam", value: "JEE", label: "JEE" },
  { kind: "exam", value: "BOARD", label: "Board" },
];

function questionMatchesCategory(qn: Question, cat: Category | null): boolean {
  if (!cat) return true;
  if (cat.kind === "class") return (qn.classLevel || "") === cat.value;
  // case-insensitive exam match — DB sometimes has mixed casing
  const want = cat.value.toLowerCase();
  return (qn.examType || []).some((e) => String(e).toLowerCase() === want);
}

export default function AdminQuestions() {
  const nav = useNavigate();
  const { refreshQuestions } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  // Admin-curated topic catalogue. Loaded once on mount and kept in sync
  // locally as the admin adds/deletes — no need to re-fetch on every change.
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");

  // Drill-down state: null at each level means "this level is the current view".
  // Initial values come from ?subject=&classLevel=&topic= so deep links from
  // AdminTopics (and similar) land directly on the right drill view.
  const initialCategory: Category | null = (() => {
    const cls = searchParams.get("classLevel");
    if (cls) return { kind: "class", value: cls, label: `Class ${cls}` };
    const exam = searchParams.get("exam");
    if (exam) return { kind: "exam", value: exam.toUpperCase(), label: exam.toUpperCase() };
    return null;
  })();
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [subject, setSubject] = useState<string | null>(searchParams.get("subject"));
  const [topic, setTopic] = useState<string | null>(searchParams.get("topic"));

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listQuestions();
      setQuestions(r.questions || []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Topics catalogue — pulled once on mount. Kept independent of `load()`
  // so a topic add/delete doesn't trigger a full questions refetch.
  useEffect(() => {
    (async () => {
      try {
        const r = await adminApi.listTopics();
        setTopics(r.topics || []);
      } catch (e) {
        // Non-fatal: topics view will fall back to the questions-derived list.
        console.warn("[AdminQuestions] failed to load topics:", e);
      }
    })();
  }, []);

  // Keep the URL in sync with drill state so refreshes / back-button preserve
  // the user's place. We only write when a value actually changed to avoid
  // looping with the initial-from-URL effect above.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const set = (key: string, val: string | null) => {
      if (val) next.set(key, val);
      else next.delete(key);
    };
    if (category?.kind === "class") {
      set("classLevel", category.value);
      set("exam", null);
    } else if (category?.kind === "exam") {
      set("exam", category.value);
      set("classLevel", null);
    } else {
      set("classLevel", null);
      set("exam", null);
    }
    set("subject", subject);
    set("topic", topic && topic !== "__ALL__" ? topic : null);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subject, topic]);

  // ---- Derived data for each drill level ----
  // Categories: classes that actually exist in the data (sorted numeric ASC), plus
  // the three fixed exam tracks. Counts are precomputed so the cards show numbers.
  const categoryCards = useMemo(() => {
    const classMap = new Map<string, number>();
    let neet = 0, jee = 0, board = 0;
    for (const x of questions) {
      if (x.classLevel) classMap.set(x.classLevel, (classMap.get(x.classLevel) || 0) + 1);
      const ets = (x.examType || []).map((e) => String(e).toLowerCase());
      if (ets.includes("neet")) neet++;
      if (ets.includes("jee")) jee++;
      if (ets.includes("board")) board++;
    }
    const classCats: { cat: Category; count: number }[] = [...classMap.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]) || a[0].localeCompare(b[0]))
      .map(([cls, count]) => ({ cat: { kind: "class", value: cls, label: `Class ${cls}` }, count }));
    const examCats: { cat: Category; count: number }[] = [
      { cat: EXAM_CATEGORIES[0], count: neet },
      { cat: EXAM_CATEGORIES[1], count: jee },
      { cat: EXAM_CATEGORIES[2], count: board },
    ];
    return { classCats, examCats };
  }, [questions]);

  // Subjects within the chosen category.
  const subjectCards = useMemo(() => {
    if (!category) return [];
    const map = new Map<string, number>();
    for (const x of questions) {
      if (!questionMatchesCategory(x, category)) continue;
      const s = x.subject || "Other";
      map.set(s, (map.get(s) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [questions, category]);

  // Topics within the chosen category + subject.
  // We merge two sources so admins see everything they care about:
  //   1) topic names that actually appear on questions (with counts)
  //   2) catalogue topics curated by the admin (count may be 0 — they were
  //      pre-seeded for the syllabus and don't have questions yet)
  // `catalogueId` is non-null only when the topic exists in the catalogue —
  // i.e. only those rows can be deleted from this view.
  const topicCards = useMemo(() => {
    if (!category || !subject) return [];
    const subjLower = subject.toLowerCase();

    const countMap = new Map<string, number>();
    for (const x of questions) {
      if (!questionMatchesCategory(x, category)) continue;
      if (x.subject !== subject) continue;
      const t = x.topic?.trim() || "Untagged";
      countMap.set(t, (countMap.get(t) || 0) + 1);
    }

    // Catalogue rows scoped to this subject. We optionally narrow further
    // when the admin is browsing inside a class drill — class-tagged topics
    // only show in their class, but class-agnostic ones show in every class.
    const catalogueIdByName = new Map<string, string>();
    for (const t of topics) {
      if ((t.subject || "").toLowerCase() !== subjLower) continue;
      if (category.kind === "class" && t.classLevel && t.classLevel !== category.value) continue;
      if (category.kind === "exam" && t.examType && t.examType.toLowerCase() !== category.value.toLowerCase()) continue;
      catalogueIdByName.set(t.name, t.id);
    }

    const allNames = new Set<string>([...countMap.keys(), ...catalogueIdByName.keys()]);
    return [...allNames]
      .map((name) => ({
        name,
        count: countMap.get(name) || 0,
        catalogueId: catalogueIdByName.get(name) || null,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [questions, topics, category, subject]);

  // Final question list: filtered by current drill state + search + difficulty.
  // If the user is searching, we ignore drill state (search-jumps-to-results UX).
  const isSearching = q.trim().length > 0;
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return questions.filter((x) => {
      if (!isSearching) {
        if (!questionMatchesCategory(x, category)) return false;
        if (subject && x.subject !== subject) return false;
        // "__ALL__" sentinel = "show every question in this subject regardless of topic"
        if (topic && topic !== "__ALL__") {
          const t = x.topic?.trim() || "Untagged";
          if (t !== topic) return false;
        }
      }
      if (difficulty !== "All" && x.difficulty !== difficulty) return false;
      if (needle) {
        const hay = (x.text + " " + (x.topic || "") + " " + x.options.join(" ")).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [questions, q, isSearching, category, subject, topic, difficulty]);

  // Which view is active right now?
  // Search overrides the drill — any non-empty query takes you straight to the question list.
  const view: "category" | "subject" | "topic" | "questions" = isSearching
    ? "questions"
    : !category
      ? "category"
      : !subject
        ? "subject"
        : !topic
          ? "topic"
          : "questions";

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    try {
      await adminApi.deleteQuestion(id);
      setQuestions((arr) => arr.filter((x) => x.id !== id));
      refreshQuestions();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  };

  // ---- Topic catalogue handlers ----
  // Add a new topic to the catalogue for the current subject (+ class drill,
  // when applicable). This also surfaces immediately in the teacher's Paper
  // Generation flow because that screen reads from /api/topics.
  const handleAddTopic = async () => {
    if (!subject) return;
    const raw = window.prompt(`Add a new topic under ${subject}`);
    if (!raw) return;
    const name = raw.trim();
    if (!name) return;
    try {
      const r = await adminApi.addTopic({
        subject,
        name,
        classLevel: category?.kind === "class" ? category.value : null,
        examType: category?.kind === "exam" ? category.value : null,
      });
      // Replace-or-prepend: the backend may return an existing row when the
      // (subject, class, name) combo already exists, so dedupe by id.
      setTopics((arr) => [r.topic, ...arr.filter((t) => t.id !== r.topic.id)]);
    } catch (e: any) {
      alert(e?.message || "Add topic failed");
    }
  };

  // Delete from the catalogue only — existing questions tagged with this
  // topic name are untouched. We warn the admin if questions still reference
  // the name so they aren't surprised when it keeps showing in the list.
  const handleDeleteTopic = async (id: string, name: string, count: number) => {
    const msg =
      count > 0
        ? `"${name}" still has ${count} question${count === 1 ? "" : "s"}. ` +
          `Remove it from the topic catalogue? (Questions will keep their topic tag.)`
        : `Remove "${name}" from the topic catalogue?`;
    if (!window.confirm(msg)) return;
    try {
      await adminApi.deleteTopic(id);
      setTopics((arr) => arr.filter((t) => t.id !== id));
    } catch (e: any) {
      alert(e?.message || "Delete topic failed");
    }
  };

  // Reset drill state to root.
  const goRoot = () => { setCategory(null); setSubject(null); setTopic(null); };
  const goSubjects = () => { setSubject(null); setTopic(null); };
  const goTopics = () => { setTopic(null); };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="text-[26px] font-bold" style={{ color: colors.foreground }}>Question Bank</div>
          <div className="text-sm" style={{ color: colors.mutedForeground }}>
            {loading ? "Loading…" : `${questions.length} total questions`}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => nav("/admin/upload")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white font-semibold text-sm"
            style={{ borderColor: colors.border, color: colors.foreground }}
          >
            <Icon name="file-text" size={16} color={colors.foreground} /> Upload PDF
          </button>
          <button
            onClick={() => nav("/admin/questions/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: colors.primary }}
          >
            <Icon name="plus" size={16} color="#fff" /> Add Question
          </button>
        </div>
      </div>

      {/* Search + difficulty (always visible). Search jumps to questions view. */}
      <div className="rounded-2xl border bg-white p-4 mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center"
        style={{ borderColor: colors.border }}>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: colors.border }}>
          <Icon name="help-circle" size={14} color={colors.mutedForeground} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search text, options, topic…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {q && (
            <button onClick={() => setQ("")} className="p-1">
              <Icon name="x" size={14} color={colors.mutedForeground} />
            </button>
          )}
        </div>
        <Select value={difficulty} onChange={(v) => setDifficulty(v as any)} options={DIFFICULTIES} label="Difficulty" />
      </div>

      {/* Breadcrumbs — only when drilled in (or searching) */}
      {(category || isSearching) && (
        <div className="flex items-center gap-1.5 text-[13px] mb-4 flex-wrap" style={{ color: colors.mutedForeground }}>
          <button onClick={goRoot} className="font-semibold hover:underline" style={{ color: colors.primary }}>
            All
          </button>
          {!isSearching && category && (
            <>
              <Icon name="chevron-right" size={12} color={colors.mutedForeground} />
              <button
                onClick={goSubjects}
                className={subject ? "font-semibold hover:underline" : "font-semibold"}
                style={{ color: subject ? colors.primary : colors.foreground }}
              >
                {category.label}
              </button>
            </>
          )}
          {!isSearching && category && subject && (
            <>
              <Icon name="chevron-right" size={12} color={colors.mutedForeground} />
              <button
                onClick={goTopics}
                className={topic ? "font-semibold hover:underline" : "font-semibold"}
                style={{ color: topic ? colors.primary : colors.foreground }}
              >
                {subject}
              </button>
            </>
          )}
          {!isSearching && category && subject && topic && (
            <>
              <Icon name="chevron-right" size={12} color={colors.mutedForeground} />
              <span className="font-semibold" style={{ color: colors.foreground }}>
                {topic === "__ALL__" ? "All topics" : topic}
              </span>
            </>
          )}
          {isSearching && (
            <>
              <Icon name="chevron-right" size={12} color={colors.mutedForeground} />
              <span className="font-semibold" style={{ color: colors.foreground }}>Search results</span>
            </>
          )}
        </div>
      )}

      {err && <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: "#fee2e2", color: colors.destructive }}>{err}</div>}

      {/* ---- LEVEL 1: CATEGORY (classes + exam tracks) ---- */}
      {!loading && view === "category" && (
        <>
          {questions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: colors.border }}>
              <Icon name="inbox" size={40} color={colors.mutedForeground} />
              <div className="text-sm mt-3" style={{ color: colors.mutedForeground }}>No questions yet. Upload a PDF or add manually.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <Section title="Class" subtitle="Browse by class level">
                {categoryCards.classCats.length === 0 ? (
                  <EmptyHint>No questions are tagged with a class yet.</EmptyHint>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categoryCards.classCats.map(({ cat, count }) => (
                      <CategoryCard
                        key={`class-${cat.value}`}
                        label={cat.label}
                        count={count}
                        accent={colors.primary}
                        onClick={() => setCategory(cat)}
                      />
                    ))}
                  </div>
                )}
              </Section>
              <Section title="Exam track" subtitle="Browse by competitive exam">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {categoryCards.examCats.map(({ cat, count }) => (
                    <CategoryCard
                      key={`exam-${cat.value}`}
                      label={cat.label}
                      count={count}
                      accent={examColor(cat.value as any) || colors.primary}
                      bg={examLight(cat.value as any)}
                      onClick={() => setCategory(cat)}
                    />
                  ))}
                </div>
              </Section>
            </div>
          )}
        </>
      )}

      {/* ---- LEVEL 2: SUBJECT ---- */}
      {!loading && view === "subject" && (
        <>
          {subjectCards.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: colors.border }}>
              <Icon name="inbox" size={40} color={colors.mutedForeground} />
              <div className="text-sm mt-3" style={{ color: colors.mutedForeground }}>No questions found for {category?.label}.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {subjectCards.map(({ name, count }) => (
                <CategoryCard
                  key={name}
                  label={name}
                  count={count}
                  accent={subjectColor(name as any) || colors.primary}
                  onClick={() => setSubject(name)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ---- LEVEL 3: TOPIC ---- */}
      {!loading && view === "topic" && (
        <div className="flex flex-col gap-3">
          {/* Add-topic affordance is always visible at this level so admins
              can pre-seed an empty syllabus; teacher PaperGenerate picks
              these up immediately via /api/topics. */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-[13px]" style={{ color: colors.mutedForeground }}>
              {topicCards.length === 0
                ? `No topics yet for ${subject}.`
                : `${topicCards.length} topic${topicCards.length === 1 ? "" : "s"} in ${subject}`}
            </div>
            <button
              onClick={handleAddTopic}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-white font-semibold text-sm"
              style={{ background: colors.primary }}
            >
              <Icon name="plus" size={14} color="#fff" /> Add Topic
            </button>
          </div>

          {topicCards.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: colors.border }}>
              <Icon name="inbox" size={40} color={colors.mutedForeground} />
              <div className="text-sm mt-3" style={{ color: colors.mutedForeground }}>
                Click "Add Topic" to start curating the syllabus for this subject.
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setTopic("__ALL__")}
                className="text-left rounded-2xl border bg-white p-4 hover:shadow-md transition"
                style={{ borderColor: colors.primary }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[15px]" style={{ color: colors.primary }}>All {subject} questions</div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: colors.primary + "18", color: colors.primary }}>
                    {topicCards.reduce((s, t) => s + t.count, 0)}
                  </span>
                </div>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {topicCards.map(({ name, count, catalogueId }) => (
                  <TopicCard
                    key={name}
                    label={name}
                    count={count}
                    accent={subjectColor(subject as any) || colors.primary}
                    onClick={() => setTopic(name)}
                    onDelete={
                      catalogueId
                        ? () => handleDeleteTopic(catalogueId, name, count)
                        : undefined
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ---- LEVEL 4: QUESTIONS ---- */}
      {!loading && view === "questions" && (
        <>
          <div className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
            Showing {filtered.length} question{filtered.length === 1 ? "" : "s"}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: colors.border }}>
              <Icon name="inbox" size={40} color={colors.mutedForeground} />
              <div className="text-sm mt-3" style={{ color: colors.mutedForeground }}>No questions match.</div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {filtered.map((x) => (
          <div key={x.id} className="rounded-2xl border bg-white p-4" style={{ borderColor: colors.border }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Tag color={subjectColor(x.subject)}>{x.subject}</Tag>
                  {x.topic && <Tag color={colors.mutedForeground} muted>{x.topic}</Tag>}
                  <Tag color={difficultyColor(x.difficulty)} bg={difficultyColor(x.difficulty) + "20"}>{x.difficulty}</Tag>
                  {x.examType.map((e) => (
                    <Tag key={e} color={examColor(e)} bg={examLight(e)}>{e}</Tag>
                  ))}
                  {x.year && <Tag color={colors.jee} bg={colors.jeeLight}>PYQ {x.year}</Tag>}
                  {x.source && <Tag color={colors.mutedForeground} muted>src: {x.source}</Tag>}
                </div>
                <div className="text-[14px] leading-6 font-medium mb-2" style={{ color: colors.foreground }}>{x.text}</div>
                {x.pageImageUrl && (
                  <a
                    href={x.pageImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block mb-2 rounded-lg overflow-hidden border max-w-md"
                    style={{ borderColor: colors.border }}
                    title="Click to open full source page"
                  >
                    <img
                      src={x.pageImageUrl}
                      alt={`Source page ${x.pageNumber ?? ""}`}
                      className="w-full block"
                      style={{ background: "#fff", maxHeight: 220, objectFit: "contain" }}
                      loading="lazy"
                    />
                  </a>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {x.options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]"
                      style={{ color: i === x.correctIndex ? colors.neet : colors.mutedForeground }}>
                      <span className="w-5 font-bold">{String.fromCharCode(65 + i)}.</span>
                      <span className="flex-1 truncate">{o}</span>
                      {i === x.correctIndex && <Icon name="check-circle" size={12} color={colors.neet} />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => nav(`/admin/questions/${encodeURIComponent(x.id)}`)}
                  className="p-2 rounded-lg hover:bg-blue-50"
                  title="Edit"
                >
                  <Icon name="edit-2" size={15} color={colors.primary} />
                </button>
                <button
                  onClick={() => handleDelete(x.id)}
                  className="p-2 rounded-lg hover:bg-red-50"
                  title="Delete"
                >
                  <Icon name="trash-2" size={15} color={colors.destructive} />
                </button>
              </div>
            </div>
          </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: readonly string[]; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs" style={{ color: colors.mutedForeground }}>
      <span className="font-semibold uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg px-2.5 py-2 border bg-white text-sm"
        style={{ borderColor: colors.border, color: colors.foreground }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2">
        <div className="text-[15px] font-bold" style={{ color: colors.foreground }}>{title}</div>
        {subtitle && <div className="text-xs" style={{ color: colors.mutedForeground }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed p-6 text-center text-sm"
      style={{ borderColor: colors.border, color: colors.mutedForeground }}>
      {children}
    </div>
  );
}

function CategoryCard({ label, count, accent, bg, onClick }: {
  label: string; count: number; accent: string; bg?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border bg-white p-4 hover:shadow-md transition relative overflow-hidden"
      style={{ borderColor: colors.border }}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-[15px] leading-tight" style={{ color: colors.foreground }}>{label}</div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
          style={{ background: bg || (accent + "18"), color: accent }}>
          {count}
        </span>
      </div>
      <div className="text-[11px] mt-1" style={{ color: colors.mutedForeground }}>
        {count === 0 ? "No questions" : count === 1 ? "1 question" : `${count} questions`}
      </div>
    </button>
  );
}

// Same visual treatment as CategoryCard, but with an optional inline trash
// affordance for deleting the topic from the catalogue. We render a separate
// component so the click-to-drill <button> doesn't nest the trash <button>
// (invalid HTML, and the click handlers would fight each other).
function TopicCard({
  label,
  count,
  accent,
  onClick,
  onDelete,
}: {
  label: string;
  count: number;
  accent: string;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className="relative rounded-2xl border bg-white p-4 hover:shadow-md transition overflow-hidden"
      style={{ borderColor: colors.border }}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <button onClick={onClick} className="text-left w-full pr-7">
        <div className="flex items-center justify-between gap-2">
          <div className="font-bold text-[15px] leading-tight" style={{ color: colors.foreground }}>
            {label}
          </div>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
            style={{ background: accent + "18", color: accent }}
          >
            {count}
          </span>
        </div>
        <div className="text-[11px] mt-1" style={{ color: colors.mutedForeground }}>
          {count === 0 ? "No questions yet" : count === 1 ? "1 question" : `${count} questions`}
        </div>
      </button>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-red-50"
          title="Remove from topic catalogue"
        >
          <Icon name="trash-2" size={13} color={colors.destructive} />
        </button>
      )}
    </div>
  );
}

function Tag({ children, color, bg, muted }: { children: React.ReactNode; color: string; bg?: string; muted?: boolean }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
      style={{
        background: bg || (muted ? colors.muted : color + "18"),
        color,
      }}
    >
      {children}
    </span>
  );
}
