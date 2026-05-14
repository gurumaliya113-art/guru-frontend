// Reusable form for editing a single Question. Used both in the standalone
// new/edit page and inline in the PDF review screen.
import { useState } from "react";
import { Icon } from "@/components/ui";
import { TOPICS_BY_SUBJECT } from "@/data/questions";
import { colors, difficultyColor, examColor, examLight } from "@/lib/colors";
import type { Difficulty, Question } from "@/lib/types";

// Default suggestions — admins can also add custom values which get saved as-is.
const SUBJECTS: string[] = ["Physics", "Chemistry", "Biology", "Mathematics"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Moderate", "Hard"];
const EXAMS: string[] = ["NEET", "JEE", "BOARD"];
const TYPES: string[] = ["MCQ", "Assertion-Reason", "Case-Based"];
const CLASS_LEVELS: string[] = ["9", "10", "11", "12"];
const BOARDS: string[] = ["CBSE", "ICSE", "State", "Other"];

export type EditableQuestion = Partial<Question> & {
  id?: string;
  text: string;
  options: string[];
  correctIndex: number;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  examType: string[];
  type: string;
  explanation?: string;
  year?: number;
  classLevel?: string;
  board?: string;
  isNCERT?: boolean;
};

export function emptyQuestion(): EditableQuestion {
  return {
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    subject: "Physics",
    topic: "",
    difficulty: "Moderate",
    examType: ["NEET"],
    type: "MCQ",
    explanation: "",
    classLevel: "12",
    board: "CBSE",
    isNCERT: false,
  };
}

export function QuestionEditor({
  value,
  onChange,
  onRemove,
  index,
  compact = false,
}: {
  value: EditableQuestion;
  onChange: (next: EditableQuestion) => void;
  onRemove?: () => void;
  index?: number;
  compact?: boolean;
}) {
  const update = (patch: Partial<EditableQuestion>) => onChange({ ...value, ...patch });
  const baseTopics = TOPICS_BY_SUBJECT[value.subject as keyof typeof TOPICS_BY_SUBJECT] || [];

  // Custom values added by admin during this session — merged into the base lists
  // so the new value shows up in the dropdown immediately.
  const [extraSubjects, setExtraSubjects] = useState<string[]>([]);
  const [extraTopics, setExtraTopics] = useState<string[]>([]);
  const [extraTypes, setExtraTypes] = useState<string[]>([]);
  const [extraClasses, setExtraClasses] = useState<string[]>([]);
  const [extraBoards, setExtraBoards] = useState<string[]>([]);
  const [extraExams, setExtraExams] = useState<string[]>([]);

  const subjects = mergeUnique(SUBJECTS, extraSubjects, value.subject);
  const topics = mergeUnique(baseTopics, extraTopics, value.topic);
  const types = mergeUnique(TYPES, extraTypes, value.type);
  const classes = mergeUnique(CLASS_LEVELS, extraClasses, value.classLevel);
  const boards = mergeUnique(BOARDS, extraBoards, value.board);
  const exams = mergeUnique(EXAMS, extraExams, ...value.examType);

  return (
    <div className="rounded-2xl border bg-white p-5 mb-4" style={{ borderColor: colors.border }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {typeof index === "number" && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
              style={{ background: colors.primary }}>
              {index + 1}
            </div>
          )}
          <span className="text-[13px] font-semibold" style={{ color: colors.mutedForeground }}>
            Question
          </span>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-50">
            <Icon name="trash-2" size={16} color={colors.destructive} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Field label="Question text">
          <textarea
            value={value.text}
            onChange={(e) => update({ text: e.target.value })}
            rows={compact ? 2 : 3}
            placeholder="Type the question stem here…"
            className="w-full rounded-xl px-3 py-2.5 border outline-none text-sm leading-6 resize-vertical"
            style={{ borderColor: colors.border, background: colors.card }}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {value.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update({ correctIndex: i })}
                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                title={value.correctIndex === i ? "Correct answer" : "Mark as correct"}
                style={{
                  background: value.correctIndex === i ? colors.neet : colors.muted,
                  color: value.correctIndex === i ? "#fff" : colors.mutedForeground,
                }}
              >
                {String.fromCharCode(65 + i)}
              </button>
              <input
                value={opt}
                onChange={(e) => {
                  const next = [...value.options];
                  next[i] = e.target.value;
                  update({ options: next });
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="flex-1 rounded-lg px-3 py-2 border outline-none text-sm"
                style={{
                  borderColor: value.correctIndex === i ? colors.neet : colors.border,
                  background: colors.card,
                }}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Subject">
            <SelectWithAdd
              value={value.subject}
              options={subjects}
              addLabel="+ Add more subject…"
              promptTitle="Add new subject"
              promptLabel="Subject name"
              onChange={(v) => update({ subject: v, topic: "" })}
              onAdd={(v) => setExtraSubjects((p) => [...p, v])}
            />
          </Field>
          <Field label="Topic">
            <SelectWithAdd
              value={value.topic || ""}
              options={topics}
              placeholder="— select —"
              addLabel="+ Add more topic…"
              promptTitle="Add new topic"
              promptLabel="Topic name"
              onChange={(v) => update({ topic: v })}
              onAdd={(v) => setExtraTopics((p) => [...p, v])}
            />
          </Field>
          <Field label="Difficulty">
            <div className="flex gap-1">
              {DIFFICULTIES.map((d) => {
                const active = value.difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update({ difficulty: d })}
                    className="flex-1 px-2 py-2 rounded-lg text-[12px] font-semibold border"
                    style={{
                      background: active ? difficultyColor(d) + "20" : colors.card,
                      borderColor: active ? difficultyColor(d) : colors.border,
                      color: active ? difficultyColor(d) : colors.mutedForeground,
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Type">
            <SelectWithAdd
              value={value.type}
              options={types}
              addLabel="+ Add more type…"
              promptTitle="Add new type"
              promptLabel="Type name"
              onChange={(v) => update({ type: v })}
              onAdd={(v) => setExtraTypes((p) => [...p, v])}
            />
          </Field>
        </div>

        <Field label="Exam types (multi-select)">
          <MultiPill
            values={value.examType}
            options={exams}
            onChange={(next) => update({ examType: next.length ? next : value.examType })}
            onAdd={(v) => {
              setExtraExams((p) => [...p, v]);
              if (!value.examType.includes(v)) update({ examType: [...value.examType, v] });
            }}
            colorFor={examColor}
            bgFor={examLight}
          />
        </Field>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Class">
            <SelectWithAdd
              value={value.classLevel || ""}
              options={classes}
              placeholder="— select —"
              addLabel="+ Add more class…"
              promptTitle="Add new class"
              promptLabel="Class"
              onChange={(v) => update({ classLevel: v || undefined })}
              onAdd={(v) => setExtraClasses((p) => [...p, v])}
              renderOption={(o) => (/^\d+$/.test(o) ? `Class ${o}` : o)}
            />
          </Field>
          <Field label="Board">
            <SelectWithAdd
              value={value.board || ""}
              options={boards}
              placeholder="— select —"
              addLabel="+ Add more board…"
              promptTitle="Add new board"
              promptLabel="Board name"
              onChange={(v) => update({ board: v || undefined })}
              onAdd={(v) => setExtraBoards((p) => [...p, v])}
            />
          </Field>
          <Field label="NCERT">
            <div className="flex gap-1">
              {[{ k: true, l: "Yes" }, { k: false, l: "No" }].map((opt) => {
                const active = !!value.isNCERT === opt.k;
                return (
                  <button
                    key={opt.l}
                    type="button"
                    onClick={() => update({ isNCERT: opt.k })}
                    className="flex-1 px-2 py-2 rounded-lg text-[12px] font-semibold border"
                    style={{
                      background: active ? colors.primary + "15" : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      color: active ? colors.primary : colors.mutedForeground,
                    }}
                  >
                    {opt.l}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Year (PYQ, optional)">
            <input
              type="number"
              value={value.year ?? ""}
              onChange={(e) => update({ year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              placeholder="e.g. 2023"
              className="w-full rounded-lg px-3 py-2 border outline-none text-sm bg-white"
              style={{ borderColor: colors.border }}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <Field label="Explanation (optional)">
              <textarea
                value={value.explanation || ""}
                onChange={(e) => update({ explanation: e.target.value })}
                rows={2}
                placeholder="Why this option is correct…"
                className="w-full rounded-lg px-3 py-2 border outline-none text-sm resize-vertical"
                style={{ borderColor: colors.border, background: colors.card }}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: colors.mutedForeground }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function mergeUnique(...lists: (string[] | string | undefined)[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of lists) {
    const arr = Array.isArray(item) ? item : item ? [item] : [];
    for (const v of arr) {
      if (v && !seen.has(v)) { seen.add(v); out.push(v); }
    }
  }
  return out;
}

const ADD_SENTINEL = "__add_new__";

// SelectWithAdd: a real <select> dropdown. The last option is "+ Add more…".
// Picking it opens a small modal popup where admin types the new value;
// on Save the value is appended to the list and selected.
function SelectWithAdd({
  value,
  options,
  placeholder,
  addLabel,
  promptTitle,
  promptLabel,
  onChange,
  onAdd,
  renderOption,
}: {
  value: string;
  options: string[];
  placeholder?: string;
  addLabel: string;
  promptTitle: string;
  promptLabel: string;
  onChange: (v: string) => void;
  onAdd: (v: string) => void;
  renderOption?: (o: string) => string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState("");

  const save = () => {
    const v = draft.trim();
    if (!v) { setShowModal(false); return; }
    if (!options.includes(v)) onAdd(v);
    onChange(v);
    setDraft("");
    setShowModal(false);
  };

  return (
    <>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === ADD_SENTINEL) {
            setShowModal(true);
            return;
          }
          onChange(e.target.value);
        }}
        className="w-full rounded-lg px-3 py-2 border outline-none text-sm bg-white"
        style={{ borderColor: colors.border }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.filter(Boolean).map((o) => (
          <option key={o} value={o}>{renderOption ? renderOption(o) : o}</option>
        ))}
        <option value={ADD_SENTINEL}>{addLabel}</option>
      </select>

      {showModal && (
        <AddValueModal
          title={promptTitle}
          label={promptLabel}
          draft={draft}
          onDraftChange={setDraft}
          onCancel={() => { setDraft(""); setShowModal(false); }}
          onSave={save}
        />
      )}
    </>
  );
}

// Small centered modal popup for entering a new value.
function AddValueModal({
  title, label, draft, onDraftChange, onCancel, onSave,
}: {
  title: string;
  label: string;
  draft: string;
  onDraftChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15, 23, 42, 0.5)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-5 w-[90vw] max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[16px] font-bold mb-1" style={{ color: colors.foreground }}>{title}</div>
        <div className="text-xs mb-3" style={{ color: colors.mutedForeground }}>
          Type a new value and it will be added to the list.
        </div>
        <label className="flex flex-col gap-1.5 mb-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: colors.mutedForeground }}>
            {label}
          </span>
          <input
            autoFocus
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onSave(); }
              if (e.key === "Escape") onCancel();
            }}
            placeholder="e.g. Hindi"
            className="w-full rounded-lg px-3 py-2 border outline-none text-sm bg-white"
            style={{ borderColor: colors.border }}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border bg-white font-semibold text-sm"
            style={{ borderColor: colors.border, color: colors.foreground }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
            style={{ background: colors.primary }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// MultiPill: toggle pills for known options + a "+ Add more…" pill that opens a
// modal popup to add a brand-new value (e.g. a new exam like "NDA" or "AIIMS").
function MultiPill({
  values,
  options,
  onChange,
  onAdd,
  colorFor,
  bgFor,
}: {
  values: string[];
  options: string[];
  onChange: (next: string[]) => void;
  onAdd: (v: string) => void;
  colorFor: (v: string) => string;
  bgFor: (v: string) => string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState("");

  const save = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft("");
    setShowModal(false);
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {options.map((e) => {
          const active = values.includes(e);
          return (
            <button
              key={e}
              type="button"
              onClick={() => {
                const next = active ? values.filter((x) => x !== e) : [...values, e];
                onChange(next);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                background: active ? bgFor(e) : colors.card,
                borderColor: active ? colorFor(e) : colors.border,
                color: active ? colorFor(e) : colors.mutedForeground,
              }}
            >
              {e}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed flex items-center gap-1"
          style={{ borderColor: colors.border, color: colors.mutedForeground }}
        >
          <Icon name="plus" size={12} color={colors.mutedForeground} /> Add more exam…
        </button>
      </div>

      {showModal && (
        <AddValueModal
          title="Add new exam type"
          label="Exam name"
          draft={draft}
          onDraftChange={setDraft}
          onCancel={() => { setDraft(""); setShowModal(false); }}
          onSave={save}
        />
      )}
    </>
  );
}
