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
import PaperView from "@/pages/PaperView";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminShell from "@/pages/admin/AdminShell";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUpload from "@/pages/admin/AdminUpload";
import AdminQuestions from "@/pages/admin/AdminQuestions";
import AdminQuestionForm from "@/pages/admin/AdminQuestionForm";

const TABS = [
  { path: "/", label: "Home", icon: "activity" },
  { path: "/quiz", label: "Quiz", icon: "play-circle" },
  { path: "/papers", label: "Papers", icon: "file-text" },
  { path: "/progress", label: "Progress", icon: "bar-chart-2" },
  { path: "/profile", label: "Profile", icon: "user" },
];

function TabBar() {
  const loc = useLocation();
  const nav = useNavigate();
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full max-w-[640px] mx-auto" style={{ paddingBottom: 72 }}>
      {children}
      <TabBar />
    </div>
  );
}

export default function App() {
  const { profile, classes, myMemberships, isLoading: appLoading, dataLoaded } = useApp();
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

  // Unauthenticated users see the registration (Onboarding) page only. The
  // legacy /login page has been retired in favour of an inline sign-in modal
  // launched from Onboarding ("Already have an account? Sign in"). Any direct
  // /login hit is redirected to /onboarding to avoid breaking old links.
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
      </Route>
    </>
  );

  if (!isAuthenticated) {
    return (
      <Routes>
        {adminRoutes}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/class/create" element={<ClassCreate />} />
        <Route path="/class/join" element={<ClassJoin />} />
        <Route
          path="/"
          element={needsClass ? <Navigate to={classRedirect} replace /> : <Shell><Home /></Shell>}
        />
        <Route path="/quiz" element={<Shell><Quiz /></Shell>} />
        <Route path="/quiz/:id" element={<QuizSession />} />
        <Route path="/papers" element={<Shell><Papers /></Shell>} />
        <Route path="/paper/generate" element={<PaperGenerate />} />
        <Route path="/paper/:id" element={<PaperView />} />
        <Route path="/progress" element={<Shell><Progress /></Shell>} />
        <Route path="/profile" element={<Shell><Profile /></Shell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingLogout />
    </>
  );
}
