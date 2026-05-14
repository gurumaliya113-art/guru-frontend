import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { adminApi, getAdminToken, setAdminToken } from "@/lib/api";
import { colors } from "@/lib/colors";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "bar-chart-2", end: true },
  { to: "/admin/upload", label: "Upload PDF", icon: "file-text" },
  { to: "/admin/questions", label: "Questions", icon: "book-open" },
  { to: "/admin/questions/new", label: "Add Question", icon: "plus" },
];

export default function AdminShell() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      if (!getAdminToken()) {
        nav("/admin/login", { replace: true });
        return;
      }
      try {
        const me = await adminApi.me();
        setGeminiAvailable(me.geminiAvailable);
        setReady(true);
      } catch {
        setAdminToken(null);
        nav("/admin/login", { replace: true });
      }
    })();
  }, [nav]);

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    setAdminToken(null);
    nav("/admin/login", { replace: true });
  };

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ color: colors.mutedForeground }}>
        Loading admin…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: colors.background }}>
      <aside className="w-60 border-r flex flex-col" style={{ borderColor: colors.border, background: colors.card }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: colors.primary }}>
              <Icon name="book-open" size={18} color="#fff" />
            </div>
            <div>
              <div className="text-[15px] font-bold" style={{ color: colors.foreground }}>SmartPrep</div>
              <div className="text-[11px]" style={{ color: colors.mutedForeground }}>Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[14px] font-medium transition ${isActive ? "text-white" : ""}`
              }
              style={({ isActive }) => ({
                background: isActive ? colors.primary : "transparent",
                color: isActive ? "#fff" : colors.foreground,
              })}
            >
              <Icon name={n.icon} size={16} color={undefined} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t" style={{ borderColor: colors.border }}>
          <div className="px-3 pb-2 text-[11px]" style={{ color: colors.mutedForeground }}>
            AI parser: <span style={{ color: geminiAvailable ? colors.neet : colors.mutedForeground, fontWeight: 600 }}>
              {geminiAvailable ? "ready" : "off (no key)"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[14px] font-medium"
            style={{ background: colors.secondary, color: colors.foreground }}
          >
            <Icon name="arrow-left" size={16} color={colors.foreground} />
            Logout
          </button>
          <button
            onClick={() => nav("/")}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]"
            style={{ color: colors.mutedForeground }}
          >
            <Icon name="arrow-right" size={12} color={colors.mutedForeground} />
            Open student app
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet context={{ geminiAvailable }} />
      </main>
    </div>
  );
}
