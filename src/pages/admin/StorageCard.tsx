import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi, StorageUsage } from "@/lib/api";
import { colors } from "@/lib/colors";

const POLL_MS = 60_000;   // normal refresh
const PENDING_MS = 5_000; // while the backend is still counting

function fmtBytes(b: number | null | undefined) {
  if (b == null) return "—";
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(b / 1024)} KB`;
}
const fmtNum = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("en-IN"));

function barColor(pct: number) {
  if (pct >= 90) return colors.destructive;
  if (pct >= 70) return "#f59e0b";
  return "#16a34a";
}

function Bar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: colors.muted }}>
      <div style={{ width: `${pct}%`, height: "100%", background: barColor(pct), transition: "width .4s" }} />
    </div>
  );
}

export default function StorageCard() {
  const [data, setData] = useState<StorageUsage | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const load = useCallback(async (refresh = false) => {
    window.clearTimeout(timer.current);
    setBusy(true);
    let next = POLL_MS;
    try {
      const d = await adminApi.storageUsage(refresh);
      if (d.pending || d.refreshing) next = PENDING_MS;
      setData((prev) => (d.pending ? prev : d));
      if (!d.pending) setErr("");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
      // Poll only while the tab is visible to avoid wasting Supabase requests.
      const tick = () => {
        if (document.visibilityState === "visible") load();
        else timer.current = window.setTimeout(tick, next);
      };
      timer.current = window.setTimeout(tick, next);
    }
  }, []);

  useEffect(() => {
    load();
    return () => window.clearTimeout(timer.current);
  }, [load]);

  const card = "rounded-2xl p-5 border bg-white mb-6";
  const muted = { color: colors.mutedForeground };

  if (!data || !data.totals) {
    return (
      <div className={card} style={{ borderColor: colors.border }}>
        <div className="text-[15px] font-semibold mb-1" style={{ color: colors.foreground }}>Storage</div>
        <div className="text-sm" style={err ? { color: colors.destructive } : muted}>
          {err ? `Error: ${err}` : "Counting files in Supabase… (first time can take up to 2 minutes)"}
        </div>
      </div>
    );
  }

  const { totals, estimates, projects = [], questions } = data;
  const primary = projects.find((p) => p.name === "primary");
  const db = primary?.db;
  const usedPct = (totals.storageUsedBytes / totals.storageLimitBytes) * 100;
  const slow = projects.some((p) => p.source === "listing");

  const cats = projects.reduce(
    (a, p) => {
      for (const k of ["images", "pages", "documents"] as const) {
        a[k].files += p.storage.categories[k].files;
        a[k].bytes += p.storage.categories[k].bytes;
      }
      return a;
    },
    { images: { files: 0, bytes: 0 }, pages: { files: 0, bytes: 0 }, documents: { files: 0, bytes: 0 } },
  );

  return (
    <div className={card} style={{ borderColor: colors.border }}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>Storage (Supabase)</div>
          <div className="text-xs" style={muted}>
            Updated {data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : "—"}
            {data.refreshing ? " · refreshing…" : ""}
            {slow ? " · slow mode (run supabase-storage-usage.sql for instant numbers)" : ""}
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
          style={{ borderColor: colors.border, color: colors.foreground, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Loading…" : "Refresh"}
        </button>
      </div>

      {usedPct >= 90 && (
        <div className="text-sm rounded-lg px-3 py-2 mb-4" style={{ background: "#fef2f2", color: colors.destructive }}>
          Storage is {usedPct.toFixed(0)}% full. Uploads will start failing at 100%.
        </div>
      )}

      {/* Storage bar */}
      <div className="flex justify-between text-[13px] mb-1">
        <span style={{ color: colors.foreground }}>
          Files: <b>{fmtBytes(totals.storageUsedBytes)}</b> used of {fmtBytes(totals.storageLimitBytes)}
        </span>
        <span className="font-semibold" style={{ color: barColor(usedPct) }}>
          {fmtBytes(totals.storageFreeBytes)} free ({(100 - usedPct).toFixed(0)}%)
        </span>
      </div>
      <Bar used={totals.storageUsedBytes} limit={totals.storageLimitBytes} />

      {/* Database bar */}
      {db && (
        <>
          <div className="flex justify-between text-[13px] mb-1 mt-4">
            <span style={{ color: colors.foreground }}>
              Database (questions, users): <b>{fmtBytes(db.usedBytes)}</b> used of {fmtBytes(db.limitBytes)}
            </span>
            {db.usedBytes != null && (
              <span className="font-semibold" style={{ color: barColor((db.usedBytes / db.limitBytes) * 100) }}>
                {fmtBytes(db.limitBytes - db.usedBytes)} free
              </span>
            )}
          </div>
          {db.usedBytes != null
            ? <Bar used={db.usedBytes} limit={db.limitBytes} />
            : <div className="text-xs" style={muted}>Run supabase-storage-usage.sql to see database size.</div>}
        </>
      )}

      {/* What's using space */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        {[
          ["Question diagrams", cats.images],
          ["PDFs / DOCX", cats.documents],
          ["Page photos", cats.pages],
        ].map(([label, c]: any) => (
          <div key={label} className="rounded-xl p-3" style={{ background: colors.muted }}>
            <div className="text-xs" style={muted}>{label}</div>
            <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>{fmtBytes(c.bytes)}</div>
            <div className="text-xs" style={muted}>{fmtNum(c.files)} files</div>
          </div>
        ))}
      </div>

      {/* Estimates */}
      <div className="text-[13px] font-semibold mt-5 mb-2" style={{ color: colors.foreground }}>
        Space left for (approx.)
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          ["Diagrams", estimates?.diagramsLeft, `at ~${fmtBytes(data.averages?.diagramBytes)} each (WebP)`],
          ["PDF uploads", estimates?.pdfsLeft, `at ~${fmtBytes(data.averages?.pdfBytes)} each (your average)`],
          ["Questions", estimates?.questionsLeft, `you have ${fmtNum(questions)} now`],
        ].map(([label, n, hint]: any) => (
          <div key={label} className="rounded-xl p-3 border" style={{ borderColor: colors.border }}>
            <div className="text-xs" style={muted}>{label}</div>
            <div className="text-2xl font-bold" style={{ color: colors.primary }}>{fmtNum(n)}</div>
            <div className="text-[11px]" style={muted}>{hint}</div>
          </div>
        ))}
      </div>
      <div className="text-[11px] mt-2" style={muted}>
        Diagrams and PDFs share the same free space, so each estimate assumes only that type is uploaded.
      </div>
    </div>
  );
}
