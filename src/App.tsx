import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Icon } from "@/components/ui";
import { colors } from "@/lib/colors";
import Onboarding from "@/pages/Onboarding";
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
  const { profile, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: colors.mutedForeground }}>
        Loading…
      </div>
    );
  }

  // Admin routes are independent of onboarding state.
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

  if (!profile.isOnboarded) {
    return (
      <Routes>
        {adminRoutes}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {adminRoutes}
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={<Shell><Home /></Shell>} />
      <Route path="/quiz" element={<Shell><Quiz /></Shell>} />
      <Route path="/quiz/:id" element={<QuizSession />} />
      <Route path="/papers" element={<Shell><Papers /></Shell>} />
      <Route path="/paper/generate" element={<PaperGenerate />} />
      <Route path="/paper/:id" element={<PaperView />} />
      <Route path="/progress" element={<Shell><Progress /></Shell>} />
      <Route path="/profile" element={<Shell><Profile /></Shell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
