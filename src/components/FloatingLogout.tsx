import { useState } from "react";
import { Icon } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

/**
 * Global floating logout button.
 * - Visible on every screen when authenticated.
 * - On click: logs the session out and jumps to /admin/login.
 * - Hidden when already on /admin/login or /login.
 */
export default function FloatingLogout() {
  const { logout, isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated) return null;
  if (typeof window !== "undefined") {
    const p = window.location.pathname;
    if (p === "/login" || p.startsWith("/admin/login")) return null;
  }

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Clear cookie/session, then go to admin login (instead of default /login).
      const base = ((import.meta as any).env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
      await fetch(`${base}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    // Hard navigate so all in-memory state is dropped.
    window.location.href = "/admin/login";
    // logout from context is also fine but we want guaranteed redirect target
    void logout;
  };

  return (
    <button
      onClick={handle}
      title="Logout & go to admin login"
      style={{
        position: "fixed",
        right: 14,
        bottom: 84, // sits above the bottom tab bar (which is ~64px tall + safe area)
        zIndex: 60,
        background: "#1c1917",
        color: "#fff",
        borderRadius: 999,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        opacity: busy ? 0.7 : 1,
      }}
    >
      <Icon name="lock" size={14} color="#fbbf24" />
      Logout
    </button>
  );
}
