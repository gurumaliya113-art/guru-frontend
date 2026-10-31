// Class-centric content scoping.
//
// The app is built around the student's selected class (1–12). Lower classes
// (1–10) must NOT be shown competitive-exam tracks (NEET / JEE / BITS) — they
// only see their own class-appropriate (Board / school) content. Exam tracks
// appear for class 11 & 12, and for "exam aspirants" who onboarded by picking
// an exam directly without a class level.

export function showExamTracks(classLevel?: string): boolean {
  if (!classLevel) return true; // exam aspirant (onboarded via exam path)
  return classLevel === "11" || classLevel === "12";
}

// A student in classes 1–10 is scoped strictly to their class content.
export function isLowerClass(classLevel?: string): boolean {
  return !!classLevel && !showExamTracks(classLevel);
}

/**
 * Questions a student is allowed to practise.
 *  - Classes 1–10: strictly questions tagged with their class.
 *  - Class 11/12 & exam aspirants: untagged exam questions plus 11/12 tagged.
 * (Same rule the Quiz page uses.)
 */
export function scopeQuestionsForClass<T extends { classLevel?: unknown }>(all: T[], classLevel?: string): T[] {
  if (classLevel && !showExamTracks(classLevel)) {
    return all.filter((q) => String(q.classLevel ?? "") === classLevel);
  }
  const senior = classLevel ? [classLevel] : ["11", "12"];
  return all.filter((q) => {
    const ql = String(q.classLevel ?? "");
    return ql === "" || senior.includes(ql);
  });
}
