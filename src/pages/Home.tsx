import { useApp } from "@/context/AppContext";
import StudentHome from "@/pages/StudentHome";
import TeacherHome from "@/pages/TeacherHome";

// Role switch only. Each home is a top-level component so it doesn't remount
// (and replay its animations) every time app data changes.
export default function Home() {
  const { profile } = useApp();
  return profile.role === "teacher" ? <TeacherHome /> : <StudentHome />;
}
