import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { Flashcard } from "@/lib/types";

export default function AdminFlashcards() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [subject, setSubject] = useState("Biology");
  const [topic, setTopic] = useState("Cell Structure");
  const [classLevel, setClassLevel] = useState("10");
  const [examType, setExamType] = useState("NEET");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("Moderate");

  const load = async () => {
    try {
      setLoading(true);
      const r = await adminApi.listFlashcards();
      setFlashcards(r.flashcards || []);
      setErr("");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try {
      await adminApi.addFlashcard({ subject, topic, classLevel, examType, question, answer, difficulty });
      setQuestion("");
      setAnswer("");
      await load();
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteFlashcard(id);
      await load();
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="text-[24px] font-bold" style={{ color: colors.foreground }}>Flashcards</div>
        <div className="text-[13px] mt-1" style={{ color: colors.mutedForeground }}>
          Add fresh flashcards here; the student deck will read them from Supabase/JSON automatically.
        </div>
      </div>

      <div className="rounded-3xl border p-4" style={{ background: colors.card, borderColor: colors.border }}>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="rounded-2xl border px-3 py-2" style={{ borderColor: colors.border, background: "#fff" }} />
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" className="rounded-2xl border px-3 py-2" style={{ borderColor: colors.border, background: "#fff" }} />
          <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} placeholder="Class (e.g. 10)" className="rounded-2xl border px-3 py-2" style={{ borderColor: colors.border, background: "#fff" }} />
          <input value={examType} onChange={(e) => setExamType(e.target.value)} placeholder="Exam (NEET / JEE / BOARD)" className="rounded-2xl border px-3 py-2" style={{ borderColor: colors.border, background: "#fff" }} />
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" rows={3} className="rounded-2xl border px-3 py-2 md:col-span-2" style={{ borderColor: colors.border, background: "#fff" }} />
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer" rows={3} className="rounded-2xl border px-3 py-2 md:col-span-2" style={{ borderColor: colors.border, background: "#fff" }} />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-2xl border px-3 py-2" style={{ borderColor: colors.border, background: "#fff" }}>
            <option>Easy</option>
            <option>Moderate</option>
            <option>Hard</option>
          </select>
        </div>
        <div className="flex items-center justify-between mt-4 gap-3">
          <div className="text-[12px]" style={{ color: colors.mutedForeground }}>{err || "Tip: use one topic per deck for a clean student experience."}</div>
          <button onClick={handleAdd} className="rounded-2xl px-4 py-2 font-semibold text-white" style={{ background: colors.primary }}>
            Add Flashcard
          </button>
        </div>
      </div>

      <div className="rounded-3xl border p-4" style={{ background: colors.card, borderColor: colors.border }}>
        <div className="text-[16px] font-semibold" style={{ color: colors.foreground }}>Live flashcard deck</div>
        {loading ? <div className="text-[13px] mt-2" style={{ color: colors.mutedForeground }}>Loading…</div> : flashcards.length === 0 ? <div className="text-[13px] mt-2" style={{ color: colors.mutedForeground }}>No flashcards yet. Add your first one above.</div> : (
          <div className="mt-3 grid gap-3">
            {flashcards.map((card) => (
              <article key={card.id} className="rounded-2xl border p-3" style={{ borderColor: colors.border, background: "#fff" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: colors.mutedForeground }}>{card.subject} · {card.topic}</div>
                    <div className="text-[14px] mt-1 font-semibold" style={{ color: colors.foreground }}>{card.question}</div>
                    <div className="text-[12px] mt-1" style={{ color: colors.mutedForeground }}>{card.answer}</div>
                  </div>
                  <button onClick={() => handleDelete(card.id)} className="rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: colors.border, color: colors.foreground }}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
