import { useEffect, useState } from "react";
import { Icon, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { colors } from "@/lib/colors";

interface Note {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  examType?: string;
  classLevel?: string;
  board?: string;
  description?: string;
  fileUrl?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    subject: "Physics",
    chapter: "",
    examType: "NEET",
    classLevel: "12",
    board: "CBSE",
    description: "",
    fileUrl: "",
  });

  const subjects = ["Physics", "Chemistry", "Biology", "Mathematics", "English", "History", "Geography", "Economics"];
  const exams = ["NEET", "JEE", "UPSC", "SSC", "Board", "CAT", "GATE"];
  const classes = ["10", "11", "12", "Graduation"];
  const boards = ["CBSE", "ICSE", "State Board"];

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const result = await adminApi.listNotes();
      setNotes(result.notes || []);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      title: "",
      subject: "Physics",
      chapter: "",
      examType: "NEET",
      classLevel: "12",
      board: "CBSE",
      description: "",
      fileUrl: "",
    });
    setShowForm(true);
  };

  const handleEditClick = (note: Note) => {
    setEditingId(note.id);
    setFormData({
      title: note.title,
      subject: note.subject,
      chapter: note.chapter || "",
      examType: note.examType || "",
      classLevel: note.classLevel || "",
      board: note.board || "",
      description: note.description || "",
      fileUrl: note.fileUrl || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.subject.trim()) {
      setError("Title and Subject are required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await adminApi.updateNote(editingId, formData);
      } else {
        await adminApi.addNote(formData);
      }

      await loadNotes();
      setShowForm(false);
      setEditingId(null);
    } catch (e: any) {
      setError(e.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      setSaving(true);
      setError("");
      await adminApi.deleteNote(id);
      await loadNotes();
    } catch (e: any) {
      setError(e.message || "Failed to delete note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>
            Notes Management
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
            Upload and manage study notes for students
          </p>
        </div>
        <button
          onClick={handleAddClick}
          disabled={saving}
          className="px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 transition hover:opacity-90 disabled:opacity-50"
          style={{ background: colors.primary }}
        >
          <Icon name="plus" size={18} />
          Add Note
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)", borderLeft: `3px solid rgb(239, 68, 68)` }}>
          <p style={{ color: "rgb(239, 68, 68)" }}>{error}</p>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !saving && setShowForm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto"
            style={{ background: colors.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.foreground }}>
              {editingId ? "Edit Note" : "Add New Note"}
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Organic Chemistry Notes"
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: colors.border,
                    background: colors.background,
                    color: colors.foreground,
                  }}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: colors.border,
                    background: colors.background,
                    color: colors.foreground,
                  }}
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Chapter */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                    Chapter
                  </label>
                  <input
                    type="text"
                    value={formData.chapter}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    placeholder="e.g., Organic Reactions"
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: colors.border,
                      background: colors.background,
                      color: colors.foreground,
                    }}
                  />
                </div>

                {/* Exam Type */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                    Exam Type
                  </label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: colors.border,
                      background: colors.background,
                      color: colors.foreground,
                    }}
                  >
                    <option value="">Select exam</option>
                    {exams.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Class Level */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                    Class Level
                  </label>
                  <select
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: colors.border,
                      background: colors.background,
                      color: colors.foreground,
                    }}
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Board */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                    Board
                  </label>
                  <select
                    value={formData.board}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: colors.border,
                      background: colors.background,
                      color: colors.foreground,
                    }}
                  >
                    <option value="">Select board</option>
                    {boards.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the notes"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: colors.border,
                    background: colors.background,
                    color: colors.foreground,
                  }}
                />
              </div>

              {/* File URL */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                  File URL
                </label>
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://example.com/file.pdf"
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: colors.border,
                    background: colors.background,
                    color: colors.foreground,
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 border rounded-lg font-medium transition hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: colors.border, color: colors.foreground }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: colors.primary }}
              >
                {saving && <Spinner size={16} />}
                {editingId ? "Update" : "Add"} Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      ) : notes.length === 0 ? (
        <div
          className="text-center py-12 px-6 rounded-lg border-2 border-dashed"
          style={{ borderColor: colors.border, background: colors.background }}
        >
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
            <Icon name="file-text" size={48} color={colors.mutedForeground} />
          </div>
          <p style={{ color: colors.mutedForeground }}>No notes yet. Create your first note to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-lg border"
              style={{
                borderColor: colors.border,
                background: colors.card,
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-2" style={{ color: colors.foreground }}>
                    {note.title}
                  </h3>
                  <p className="text-sm" style={{ color: colors.mutedForeground }}>
                    {note.subject}
                    {note.chapter && ` • ${note.chapter}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={saving}
                  className="p-2 hover:opacity-60 transition disabled:opacity-30"
                  title="Delete note"
                >
                  <Icon name="trash-2" size={18} color="rgb(239, 68, 68)" />
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {note.examType && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: `${colors.primary}20`,
                      color: colors.primary,
                    }}
                  >
                    {note.examType}
                  </span>
                )}
                {note.classLevel && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: `${colors.primary}20`,
                      color: colors.primary,
                    }}
                  >
                    Class {note.classLevel}
                  </span>
                )}
                {note.board && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: `${colors.primary}20`,
                      color: colors.primary,
                    }}
                  >
                    {note.board}
                  </span>
                )}
              </div>

              {note.description && (
                <p className="text-sm line-clamp-2 mb-3" style={{ color: colors.mutedForeground }}>
                  {note.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(note)}
                  disabled={saving}
                  className="flex-1 px-3 py-2 text-sm font-medium border rounded transition hover:opacity-80 disabled:opacity-50"
                  style={{ borderColor: colors.border, color: colors.foreground }}
                >
                  Edit
                </button>
                {note.fileUrl && (
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 text-sm font-medium text-white rounded transition hover:opacity-90"
                    style={{ background: colors.primary, textAlign: "center" }}
                  >
                    Download
                  </a>
                )}
              </div>

              {/* Metadata */}
              <p className="text-xs mt-3" style={{ color: colors.mutedForeground }}>
                Created: {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
