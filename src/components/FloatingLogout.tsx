import { useState } from "react";
import { Icon } from "@/components/ui";
import { adminApi, setAdminToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Global floating logout button.
 * - Visible only on admin screens when authenticated.
 * - On click: logs the admin token out and jumps to /admin/login.
 * - Hidden when already on /admin/login.
 */
export default function FloatingLogout() {
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated) return null;
  if (typeof window !== "undefined") {
    const p = window.location.pathname;
    if (!p.startsWith("/admin") || p.startsWith("/admin/login")) return null;
  }

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await adminApi.logout();
    } catch {
      /* ignore */
    } finally {
      setAdminToken(null);
    }
    window.location.href = "/admin/login";
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
