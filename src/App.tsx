import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@/components/ui";
import FloatingLogout from "@/components/FloatingLogout";
import { colors } from "@/lib/colors";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import ClassCreate from "@/pages/ClassCreate";
import ClassJoin from "@/pages/ClassJoin";
import Home from "@/pages/Home";
import Quiz from "@/pages/Quiz";
import QuizSession from "@/pages/QuizSession";
import Papers from "@/pages/Papers";
import PaperGenerate from "@/pages/PaperGenerate";
import PaperCapture from "@/pages/PaperCapture";
import PaperView from "@/pages/PaperView";
import PreviousYearPapers from "@/pages/PreviousYearPapers";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminShell from "@/pages/admin/AdminShell";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUpload from "@/pages/admin/AdminUpload";
import AdminQuestions from "@/pages/admin/AdminQuestions";
import AdminQuestionForm from "@/pages/admin/AdminQuestionForm";
import AdminFlashcards from "@/pages/admin/AdminFlashcards";
import AdminAddPYPForm from "@/pages/admin/AdminAddPYPForm";
import Landing from "@/pages/Landing";
import Teachers from "@/pages/Teachers";
import Schools from "@/pages/Schools";
import Exams from "@/pages/Exams";

// Tab bar entries differ by role:
//   - Students see "Prev. Papers" (the paid PYP catalogue at /pyp)
//   - Teachers see "Papers" (their own generated paper bank at /papers, used
//     to assign work to their classes). Teachers should never see PYP/paywall.
const STUDENT_TABS = [
  { path: "/", label: "Home", icon: "activity" },
  { path: "/pyp", label: "Super App", icon: "award" },
  { path: "/progress", label: "Progress", icon: "bar-chart-2" },
  { path: "/profile", label: "Profile", icon: "user" },
];
const TEACHER_TABS = [
  { path: "/", label: "Home", icon: "activity" },
  { path: "/quiz", label: "Quiz", icon: "play-circle" },
  { path: "/papers", label: "Papers", icon: "file-text" },
  { path: "/progress", label: "Progress", icon: "bar-chart-2" },
  { path: "/profile", label: "Profile", icon: "user" },
];

function TabBar({ role }: { role: "student" | "teacher" }) {
  const loc = useLocation();
  const nav = useNavigate();
  const TABS = role === "teacher" ? TEACHER_TABS : STUDENT_TABS;
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t bg-white flex items-center justify-around z-50"
      style={{ borderColor: colors.border, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((t) => {
        const active = loc.pathname === t.path || (t.path !== "/" && loc.pathname.startsWith(t.path));
        return (
          <button
            key={t.path}
            onClick={() => nav(t.path)}
            className="flex-1 py-2.5 flex flex-col items-center gap-0.5"
            style={{ color: active ? colors.primary : colors.mutedForeground }}
          >
            <Icon name={t.icon} size={20} color={active ? colors.primary : colors.mutedForeground} />
            <span className="text-[11px] font-medium">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Shell({ children, role }: { children: React.ReactNode; role: "student" | "teacher" }) {
  return (
    <div className="min-h-full max-w-[640px] mx-auto" style={{ paddingBottom: 72 }}>
      {children}
      <TabBar role={role} />
    </div>
  );
}

export default function App() {
  const { profile, classes, myMemberships, isLoading: appLoading, dataLoaded } = useApp();
  // Resolve the active role once so every <Shell role={...}> below stays in sync.
  const role: "student" | "teacher" = profile.role === "teacher" ? "teacher" : "student";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const loc = useLocation();

  // Also wait for the post-login data fetch to complete before routing. Without
  // this guard, the brief render between `isAuthenticated` flipping to true and
  // the AppContext effect kicking in would see `profile = DEFAULT_PROFILE`
  // (isOnboarded=false) and Navigate to /onboarding — trapping already-onboarded
  // users on the registration screen even after the fresh profile arrives.
  if (authLoading || appLoading || (isAuthenticated && !dataLoaded)) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: colors.mutedForeground }}>
        Loading…
      </div>
    );
  }

  // Unauthenticated users see the Google-only onboarding page. New users
  // complete a one-time role choice after Google sign-in. Any direct /login
  // hit is redirected to /onboarding to avoid breaking old links.
  // Admin routes are independent of regular user auth/onboarding state — the
  // admin shell is gated separately by its own JWT token. We register the same
  // route group for both unauthenticated and authenticated users so that an
  // admin can log into /admin/login without first creating a student/teacher
  // account, and so that nav("/admin") inside AdminLogin lands correctly.
  const adminRoutes = (
    <>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<AdminDashboard />} />
        <Route path="upload" element={<AdminUpload />} />
        <Route path="questions" element={<AdminQuestions />} />
        <Route path="questions/new" element={<AdminQuestionForm />} />
        <Route path="questions/:id" element={<AdminQuestionForm />} />
        <Route path="flashcards" element={<AdminFlashcards />} />
        <Route path="pyp" element={<AdminAddPYPForm />} />
      </Route>
    </>
  );

  if (!isAuthenticated) {
    return (
      <Routes>
        {adminRoutes}
        <Route path="/landing" element={<Landing />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!profile.isOnboarded) {
    return (
      <Routes>
        {adminRoutes}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Class-onboarding guard:
  //  - Teachers must have created at least one class.
  //  - Students must have an approved or pending membership (pending = waiting screen).
  const onClassRoute =
    loc.pathname.startsWith("/class/") || loc.pathname.startsWith("/admin");
  // Only redirect once we've actually fetched the user's classes/memberships,
  // otherwise the brief empty-array state right after login would push the
  // teacher into /class/create even though they already have classes.
  const needsClass =
    dataLoaded &&
    !onClassRoute &&
    ((profile.role === "teacher" && classes.length === 0) ||
      (profile.role === "student" &&
        !profile.skipClassJoin &&
        !myMemberships.some((m) => m.status === "approved" || m.status === "pending")));
  const classRedirect = profile.role === "teacher" ? "/class/create" : "/class/join";

  return (
    <>
      <Routes>
        {adminRoutes}
        <Route path="/landing" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/class/create" element={<ClassCreate />} />
        <Route path="/class/join" element={<ClassJoin />} />
        <Route
          path="/"
          element={needsClass ? <Navigate to={classRedirect} replace /> : <Shell role={role}><Home /></Shell>}
        />
        <Route path="/quiz" element={<Shell role={role}><Quiz /></Shell>} />
        <Route path="/quiz/:id" element={<QuizSession />} />
        {/* /papers is the teacher's generated paper bank. Students arriving
            here (e.g. via stale links) get redirected to /pyp. */}
        <Route
          path="/papers"
          element={role === "teacher" ? <Shell role={role}><Papers /></Shell> : <Navigate to="/pyp" replace />}
        />
        <Route path="/paper/generate" element={<PaperGenerate />} />
        <Route path="/paper/capture" element={<PaperCapture />} />
        <Route path="/paper/:id" element={<PaperView />} />
        <Route path="/pyp" element={<Shell role={role}><PreviousYearPapers /></Shell>} />
        <Route path="/progress" element={<Shell role={role}><Progress /></Shell>} />
        <Route path="/profile" element={<Shell role={role}><Profile /></Shell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingLogout />
    </>
  );
}
