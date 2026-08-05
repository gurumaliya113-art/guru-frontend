import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";

interface Note {
  id: string;
  title: string;
  subject?: string;
  chapter?: string;
  examType?: string;
  classLevel?: string;
  board?: string;
  description?: string;
  fileUrl?: string;
  uploadedBy?: string;
  createdAt: string;
}

export default function Notes() {
  const nav = useNavigate();
  const { profile } = useApp();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Filter states
  const [filterSubject, setFilterSubject] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const subjects = ["Physics", "Chemistry", "Biology", "Mathematics"];
  const exams = ["NEET", "JEE", "BOARD"];
  const boards = ["CBSE", "ICSE", "State", "Other"];

  // Fetch notes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const query: any = {};
        if (filterSubject) query.subject = filterSubject;
        if (filterChapter) query.chapter = filterChapter;
        if (filterExam) query.examType = filterExam;
        if (searchQ) query.q = searchQ;

        const r = await api.getNotes(query);
        if (!cancelled) setNotes(r.notes || []);
      } catch (e) {
        if (!cancelled) setError(String((e as Error).message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterSubject, filterChapter, filterExam, searchQ]);

  // Extract unique chapters from loaded notes
  const chapters = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.chapter) set.add(n.chapter);
    });
    return Array.from(set).sort();
  }, [notes]);

  // Apply filters locally
  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (filterSubject && n.subject !== filterSubject) return false;
      if (filterChapter && n.chapter !== filterChapter) return false;
      if (filterExam && n.examType !== filterExam) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return (
          (n.title || "").toLowerCase().includes(q) ||
          (n.description || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [notes, filterSubject, filterChapter, filterExam, searchQ]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "2-digit",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: colors.mutedForeground }}>
        <Spinner size={32} color={colors.primary} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: colors.border }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Notes</h1>
            {profile.role === "teacher" && (
              <button
                onClick={() => nav("/notes/create")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                <Icon name="plus" size={18} />
                <span className="text-sm font-medium">Add Note</span>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search notes by title or description..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* Subject Filter */}
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Chapter Filter */}
            {chapters.length > 0 && (
              <select
                value={filterChapter}
                onChange={(e) => setFilterChapter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                }}
              >
                <option value="">All Chapters</option>
                {chapters.map((c) => (
                  <option key={c} value={c}>
                    {c.substring(0, 20)}
                  </option>
                ))}
              </select>
            )}

            {/* Exam Type Filter */}
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
            >
              <option value="">All Exams</option>
              {exams.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="m-4 p-4 rounded-lg bg-red-50 border" style={{ borderColor: "#fee2e2" }}>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Notes List or Detail View */}
      {selectedNote ? (
        <div className="p-4">
          {/* Detail View */}
          <button
            onClick={() => setSelectedNote(null)}
            className="flex items-center gap-1 mb-4 text-blue-500 hover:text-blue-600"
          >
            <Icon name="chevron-left" size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="bg-white rounded-lg p-4 border" style={{ borderColor: colors.border }}>
            <h2 className="text-xl font-bold mb-2">{selectedNote.title}</h2>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              {selectedNote.subject && (
                <div>
                  <span className="text-gray-500">Subject:</span>
                  <p className="font-medium">{selectedNote.subject}</p>
                </div>
              )}
              {selectedNote.chapter && (
                <div>
                  <span className="text-gray-500">Chapter:</span>
                  <p className="font-medium">{selectedNote.chapter}</p>
                </div>
              )}
              {selectedNote.examType && (
                <div>
                  <span className="text-gray-500">Exam:</span>
                  <p className="font-medium">{selectedNote.examType}</p>
                </div>
              )}
              {selectedNote.classLevel && (
                <div>
                  <span className="text-gray-500">Class:</span>
                  <p className="font-medium">Class {selectedNote.classLevel}</p>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-gray-500">Date:</span>
                <p className="font-medium">{formatDate(selectedNote.createdAt)}</p>
              </div>
            </div>

            {selectedNote.description && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">{selectedNote.description}</p>
              </div>
            )}

            {selectedNote.fileUrl && (
              <a
                href={selectedNote.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                <Icon name="download" size={18} />
                <span className="text-sm font-medium">Download PDF</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4">
          {/* List View */}
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="book-open" size={48} color={colors.mutedForeground} className="mx-auto mb-4 opacity-50" />
              <p style={{ color: colors.mutedForeground }}>No notes found</p>
              <p className="text-sm" style={{ color: colors.mutedForeground }}>
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="text-left p-4 rounded-lg border bg-white hover:shadow-md transition"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold flex-1">{note.title}</h3>
                    <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
                  </div>

                  {note.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {note.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-2">
                    {note.subject && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50" style={{ color: colors.primary }}>
                        {note.subject}
                      </span>
                    )}
                    {note.chapter && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-50" style={{ color: "#7c3aed" }}>
                        {note.chapter.substring(0, 15)}
                      </span>
                    )}
                    {note.examType && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-50" style={{ color: "#d97706" }}>
                        {note.examType}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs" style={{ color: colors.mutedForeground }}>
                    <span>{formatDate(note.createdAt)}</span>
                    {note.fileUrl && <Icon name="file-pdf" size={14} />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
