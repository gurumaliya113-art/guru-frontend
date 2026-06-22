import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { adminApi, getAdminToken, setAdminToken, ADMIN_AUTH_EXPIRED_EVENT } from "@/lib/api";
import { colors } from "@/lib/colors";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "bar-chart-2", end: true },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: "user-check" },
  { to: "/admin/revenue", label: "Revenue", icon: "indian-rupee" },
  { to: "/admin/upload", label: "Upload PDF", icon: "file-text" },
  { to: "/admin/questions", label: "Questions", icon: "book-open" },
  { to: "/admin/questions/new", label: "Add Question", icon: "plus" },
  { to: "/admin/flashcards", label: "Flashcards", icon: "layers" },
  { to: "/admin/notes", label: "Notes", icon: "notebook" },
  { to: "/admin/pyp", label: "Super App", icon: "award" },
  { to: "/admin/referral", label: "Referrals", icon: "percent" },
];

export default function AdminShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [groqAvailable, setGroqAvailable] = useState(false);
  // Guards against overlapping validations (e.g. focus + pageshow firing together).
  const validatingRef = useRef(false);

  // Single source of truth for "is this admin session still valid?".
  // Re-run on every admin navigation, on bfcache restore (pageshow), and when
  // the tab regains focus — so a logged-out / expired session can never keep
  // showing the panel after a browser Back or tab switch.
  const validate = useCallback(async () => {
    if (validatingRef.current) return;
    validatingRef.current = true;
    try {
      if (!getAdminToken()) {
        setReady(false);
        nav("/admin/login", { replace: true });
        return;
      }
      const me = await adminApi.me();
      setGeminiAvailable(Boolean(me.geminiAvailable));
      setGroqAvailable(Boolean(me.groqAvailable));
      setReady(true);
    } catch (e: any) {
      const msg = String(e?.message || e);
      const isAuthError = msg.includes("401") || /auth/i.test(msg);
      // A real auth rejection (logged out elsewhere / expired) always bounces
      // to login and purges the token. Transient network errors only bounce if
      // we never managed to validate this session in the first place — that way
      // a brief blip can't kick an active admin out mid-session.
      if (isAuthError) {
        setAdminToken(null);
        setReady(false);
        nav("/admin/login", { replace: true });
      } else {
        setReady((prev) => {
          if (!prev) nav("/admin/login", { replace: true });
          return prev;
        });
      }
    } finally {
      validatingRef.current = false;
    }
  }, [nav]);

  // Validate on mount and whenever the admin sub-route changes.
  useEffect(() => {
    void validate();
  }, [validate, loc.pathname]);

  // bfcache / tab-focus revalidation. When a page is restored from the back-
  // forward cache (event.persisted === true) React effects do NOT re-run on
  // their own, which is exactly how a logged-out admin screen could reappear.
  // Forcing a fresh validate() here closes that hole.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void validate();
    };
    const onFocus = () => void validate();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void validate();
    };
    const onAuthExpired = () => {
      setAdminToken(null);
      setReady(false);
      nav("/admin/login", { replace: true });
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, onAuthExpired);
    };
  }, [validate, nav]);

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    setAdminToken(null);
    setReady(false);
    nav("/admin/login", { replace: true });
  };

  // While we have no validated session, never render the panel — not even for a
  // flash — so a restored/cached view can't leak admin data.
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
              <div className="text-[15px] font-bold" style={{ color: colors.foreground }}>Gurutron</div>
              <div className="text-[11px]" style={{ color: colors.mutedForeground }}>Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
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
            AI parser: <span style={{ color: (groqAvailable || geminiAvailable) ? colors.neet : colors.mutedForeground, fontWeight: 600 }}>
              {groqAvailable ? "Groq ready" : geminiAvailable ? "Gemini ready" : "off (no key)"}
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
        <Outlet context={{ geminiAvailable, groqAvailable }} />
      </main>
    </div>
  );
}
