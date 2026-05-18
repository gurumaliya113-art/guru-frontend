// AdminTopics — A flat, filterable view over the question bank that aggregates
// (subject, classLevel, topic) and shows how many questions fall under each
// bucket. This complements AdminQuestions (which is a drill-down browser) by
// giving admins a *coverage map*: at a glance they can see which topics are
// thin, which are over-served, and which class/subject combos have no
// questions yet.
//
// Topics in this codebase don't live in their own table — they're free-text
// fields on Question rows. So "adding a topic" here just routes the admin to
// the Add Question form with the chosen subject/class/topic prefilled, which
// materializes the topic the moment the first question is saved.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { colors, subjectColor } from "@/lib/colors";
import type { Question } from "@/lib/types";

const ALL = "All";

export default function AdminTopics() {
  const nav = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filters
  const [subject, setSubject] = useState<string>(ALL);
  const [classLevel, setClassLevel] = useState<string>(ALL);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await adminApi.listQuestions();
        setQuestions(r.questions || []);
      } catch (e: any) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Build the unique subject / class option lists from the data so the filters
  // always reflect what's actually present in the bank.
  const subjectOptions = useMemo(() => {
    const s = new Set<string>();
    for (const q of questions) if (q.subject) s.add(q.subject);
    return [ALL, ...[...s].sort()];
  }, [questions]);

  const classOptions = useMemo(() => {
    const s = new Set<string>();
    for (const q of questions) if (q.classLevel) s.add(q.classLevel);
    return [
      ALL,
      ...[...s].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
    ];
  }, [questions]);

  // Aggregate by (subject, classLevel, topic) — each unique combo is one row
  // with a count of matching questions. Untagged class/topic cells render as
  // explicit "Untagged" labels so admins can spot missing metadata.
  type Row = {
    subject: string;
    classLevel: string;
    topic: string;
    count: number;
  };

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const q of questions) {
      const subj = q.subject || "Untagged";
      const cls = q.classLevel || "Untagged";
      const top = (q.topic || "").trim() || "Untagged";
      const key = `${subj}|||${cls}|||${top}`;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else
        map.set(key, { subject: subj, classLevel: cls, topic: top, count: 1 });
    }
    let arr = [...map.values()];
    if (subject !== ALL) arr = arr.filter((r) => r.subject === subject);
    if (classLevel !== ALL) arr = arr.filter((r) => r.classLevel === classLevel);
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      arr = arr.filter(
        (r) =>
          r.topic.toLowerCase().includes(needle) ||
          r.subject.toLowerCase().includes(needle) ||
          r.classLevel.toLowerCase().includes(needle),
      );
    }
    arr.sort(
      (a, b) =>
        a.subject.localeCompare(b.subject) ||
        (Number(a.classLevel) || 99) - (Number(b.classLevel) || 99) ||
        a.classLevel.localeCompare(b.classLevel) ||
        b.count - a.count ||
        a.topic.localeCompare(b.topic),
    );
    return arr;
  }, [questions, subject, classLevel, search]);

  // Quick KPIs across whatever the current filter shows.
  const kpis = useMemo(() => {
    const totalQuestions = rows.reduce((s, r) => s + r.count, 0);
    const totalTopics = rows.length;
    const subjectsCovered = new Set(rows.map((r) => r.subject)).size;
    const classesCovered = new Set(rows.map((r) => r.classLevel)).size;
    return { totalQuestions, totalTopics, subjectsCovered, classesCovered };
  }, [rows]);

  // Add-Topic flow: prompt for a name, then jump to the Add Question page with
  // subject / classLevel / topic prefilled via query params. The QuestionEditor
  // already supports custom subjects/topics, so this works even for brand-new
  // values that aren't in the suggestion lists yet.
  const handleAddTopic = () => {
    const name = window.prompt("New topic name:");
    if (!name || !name.trim()) return;
    const params = new URLSearchParams();
    if (subject !== ALL) params.set("subject", subject);
    if (classLevel !== ALL) params.set("classLevel", classLevel);
    params.set("topic", name.trim());
    nav(`/admin/questions/new?${params.toString()}`);
  };

  // Drill into AdminQuestions with this row's filters preselected. AdminQuestions
  // reads ?subject= / ?classLevel= / ?topic= on mount to pre-set its drill state.
  const handleOpenRow = (r: Row) => {
    const params = new URLSearchParams();
    if (r.subject !== "Untagged") params.set("subject", r.subject);
    if (r.classLevel !== "Untagged") params.set("classLevel", r.classLevel);
    if (r.topic !== "Untagged") params.set("topic", r.topic);
    nav(`/admin/questions?${params.toString()}`);
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.foreground }}
          >
            Topics
          </div>
          <div
            className="text-sm mt-1"
            style={{ color: colors.mutedForeground }}
          >
            Coverage of your question bank by subject, class and topic.
          </div>
        </div>
        <button
          onClick={handleAddTopic}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white"
          style={{ background: colors.primary }}
        >
          <Icon name="plus" size={16} color="#fff" />
          Add Topic
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Topics" value={kpis.totalTopics} />
        <Kpi label="Questions" value={kpis.totalQuestions} />
        <Kpi label="Subjects" value={kpis.subjectsCovered} />
        <Kpi label="Classes" value={kpis.classesCovered} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter
          label="Subject"
          value={subject}
          options={subjectOptions}
          onChange={setSubject}
        />
        <Filter
          label="Class"
          value={classLevel}
          options={classOptions}
          onChange={setClassLevel}
          formatOption={(v) => (v === ALL ? "All classes" : `Class ${v}`)}
        />
        <div className="flex items-center gap-2 ml-auto">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: colors.card, border: `1px solid ${colors.border}` }}
          >
            <Icon name="search" size={14} color={colors.mutedForeground} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topic / subject…"
              className="bg-transparent outline-none text-sm w-56"
              style={{ color: colors.foreground }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            color: colors.mutedForeground,
          }}
        >
          Loading topics…
        </div>
      ) : err ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
          }}
        >
          {err}
        </div>
      ) : rows.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: colors.card,
            border: `1px dashed ${colors.border}`,
            color: colors.mutedForeground,
          }}
        >
          <Icon name="book-open" size={28} color={colors.mutedForeground} />
          <div className="mt-3 text-sm">No topics match the current filters.</div>
          <button
            onClick={handleAddTopic}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: colors.primary }}
          >
            <Icon name="plus" size={14} color="#fff" />
            Add your first topic
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            className="grid text-[11px] uppercase tracking-wider font-semibold px-4 py-3"
            style={{
              gridTemplateColumns: "1.6fr 0.8fr 2fr 0.8fr 0.6fr",
              color: colors.mutedForeground,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <div>Subject</div>
            <div>Class</div>
            <div>Topic</div>
            <div className="text-right">Questions</div>
            <div></div>
          </div>
          {rows.map((r, i) => {
            const sc = subjectColor(r.subject);
            return (
              <div
                key={`${r.subject}-${r.classLevel}-${r.topic}-${i}`}
                className="grid items-center px-4 py-3 cursor-pointer transition hover:bg-white/[0.03]"
                style={{
                  gridTemplateColumns: "1.6fr 0.8fr 2fr 0.8fr 0.6fr",
                  borderBottom: i === rows.length - 1 ? "none" : `1px solid ${colors.border}`,
                }}
                onClick={() => handleOpenRow(r)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: sc }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.foreground }}
                  >
                    {r.subject}
                  </span>
                </div>
                <div className="text-sm" style={{ color: colors.foreground }}>
                  {r.classLevel === "Untagged" ? (
                    <span style={{ color: colors.mutedForeground }}>—</span>
                  ) : (
                    `Class ${r.classLevel}`
                  )}
                </div>
                <div
                  className="text-sm truncate"
                  style={{
                    color:
                      r.topic === "Untagged"
                        ? colors.mutedForeground
                        : colors.foreground,
                    fontStyle: r.topic === "Untagged" ? "italic" : "normal",
                  }}
                  title={r.topic}
                >
                  {r.topic}
                </div>
                <div className="text-right">
                  <span
                    className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: `${sc}1f`,
                      color: sc,
                    }}
                  >
                    {r.count}
                  </span>
                </div>
                <div className="text-right">
                  <Icon
                    name="arrow-right"
                    size={14}
                    color={colors.mutedForeground}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        className="text-[11px] uppercase tracking-wider font-semibold"
        style={{ color: colors.mutedForeground }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-bold mt-1"
        style={{ color: colors.foreground }}
      >
        {value}
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
  formatOption,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  formatOption?: (v: string) => string;
}) {
  return (
    <label
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
      style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        color: colors.foreground,
      }}
    >
      <span style={{ color: colors.mutedForeground }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none text-sm font-medium"
        style={{ color: colors.foreground }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: colors.card }}>
            {formatOption ? formatOption(o) : o === ALL ? `All ${label.toLowerCase()}s` : o}
          </option>
        ))}
      </select>
    </label>
  );
}
