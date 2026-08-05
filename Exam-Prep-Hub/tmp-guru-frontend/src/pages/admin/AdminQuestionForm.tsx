import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { adminApi } from "@/lib/api";
import { colors } from "@/lib/colors";
import { emptyQuestion, EditableQuestion, QuestionEditor } from "./QuestionEditor";
import type { Question, Topic } from "@/lib/types";

export default function AdminQuestionForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { refreshQuestions } = useApp();
  const [searchParams] = useSearchParams();

  // For new questions, allow AdminTopics (or any other page) to prefill the
  // subject / classLevel / topic via query params so the admin lands in the
  // editor with the right metadata already filled in.
  const [draft, setDraft] = useState<EditableQuestion>(() => {
    if (id) return emptyQuestion();
    const base = emptyQuestion();
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic");
    const classLevel = searchParams.get("classLevel");
    return {
      ...base,
      ...(subject ? { subject } : {}),
      ...(topic ? { topic } : {}),
      ...(classLevel ? { classLevel } : {}),
    };
  });
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Pull the admin-curated topic catalogue once. We pass the raw Topic[] to
  // QuestionEditor so it can filter by both subject AND classLevel — a Class
  // 11 question only sees topics tagged for class 11 (or class-agnostic).
  const [catalogueTopics, setCatalogueTopics] = useState<Topic[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await adminApi.listTopics();
        setCatalogueTopics(r.topics || []);
      } catch (e) {
        console.warn("[AdminQuestionForm] failed to load topics:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const r = await adminApi.listQuestions();
        const found = r.questions.find((q) => q.id === id);
        if (!found) { setError("Question not found"); return; }
        setDraft({
          id: found.id,
          text: found.text,
          options: found.options.length === 4 ? found.options : [...found.options, "", "", "", ""].slice(0, 4),
          correctIndex: found.correctIndex,
          subject: found.subject,
          topic: found.topic,
          difficulty: found.difficulty,
          examType: found.examType,
          type: found.type,
          explanation: found.explanation,
          year: found.year,
          classLevel: found.classLevel,
          board: found.board,
          isNCERT: found.isNCERT ?? false,
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const save = async () => {
    if (!draft.text.trim()) { setError("Question text is required"); return; }
    if (draft.options.filter((o) => o.trim()).length < 2) { setError("At least 2 options are required"); return; }
    setBusy(true); setError("");
    try {
      if (isEdit && draft.id) {
        await adminApi.updateQuestion(draft.id, draft as Partial<Question>);
      } else {
        await adminApi.addQuestions([draft]);
      }
      await refreshQuestions();
      nav("/admin/questions");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8" style={{ color: colors.mutedForeground }}>Loading…</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => nav("/admin/questions")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.secondary }}>
          <Icon name="arrow-left" size={16} color={colors.foreground} />
        </button>
        <div>
          <div className="text-[24px] font-bold" style={{ color: colors.foreground }}>
            {isEdit ? "Edit Question" : "Add Question"}
          </div>
          <div className="text-xs" style={{ color: colors.mutedForeground }}>
            {isEdit ? `ID: ${draft.id}` : "Manually add a new question to the bank"}
          </div>
        </div>
      </div>

      <QuestionEditor
        value={draft}
        onChange={setDraft}
        catalogueTopics={catalogueTopics}
      />

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: "#fee2e2", color: colors.destructive }}>
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => nav("/admin/questions")}
          className="px-5 py-3 rounded-xl border bg-white font-semibold text-sm"
          style={{ borderColor: colors.border, color: colors.foreground }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold disabled:opacity-50"
          style={{ background: colors.primary }}
        >
          {busy ? <><Spinner size={16} /> Saving…</> : <><Icon name="check-circle" size={16} color="#fff" /> {isEdit ? "Save Changes" : "Add Question"}</>}
        </button>
      </div>
    </div>
  );
}
