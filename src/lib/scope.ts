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
