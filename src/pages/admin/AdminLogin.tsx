import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { adminApi, getAdminToken, setAdminToken } from "@/lib/api";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getAdminToken()) {
      (async () => {
        try { await adminApi.me(); nav("/admin", { replace: true }); }
        catch { setAdminToken(null); }
      })();
    }
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { token } = await adminApi.login(email.trim(), password);
      setAdminToken(token);
      nav("/admin", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
      <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(37,99,235,0.25)", border: "1px solid rgba(37,99,235,0.4)" }}>
            <Icon name="user" size={22} color="#60a5fa" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Admin Login</div>
            <div className="text-xs text-white/60">Gurutron content management</div>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider font-medium text-white/55">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@gurutron.local"
              className="rounded-xl px-4 py-3 text-white outline-none placeholder:text-white/30"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider font-medium text-white/55">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="rounded-xl px-4 py-3 text-white outline-none placeholder:text-white/30"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </label>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white disabled:opacity-50 transition active:scale-[0.98]"
            style={{ background: "#2563eb" }}
          >
            {busy ? <><Spinner size={16} /> Signing in…</> : <>Sign In <Icon name="arrow-right" size={16} color="#fff" /></>}
          </button>

          <button
            type="button"
            onClick={() => nav("/")}
            className="text-xs text-white/50 hover:text-white/80 mt-2"
          >
            ← Back to student app
          </button>
        </form>

        <div className="mt-6 pt-4 text-[11px] text-white/40 leading-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          Default credentials are set in <code className="text-white/60">server/.env</code> (<code className="text-white/60">ADMIN_EMAIL</code> / <code className="text-white/60">ADMIN_PASSWORD</code>). Change them before deploying.
        </div>
      </div>
    </div>
  );
}
