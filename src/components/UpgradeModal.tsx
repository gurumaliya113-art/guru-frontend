import { Icon } from "@/components/ui";
import { colors } from "@/lib/colors";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  loading?: boolean;
}

export default function UpgradeModal({ open, onClose, onUpgrade, loading = false }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center">
      <div className="w-full max-w-md rounded-[28px] border bg-white p-4 shadow-2xl" style={{ borderColor: colors.border }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[15px] font-bold" style={{ color: colors.foreground }}>Upgrade for unlimited practice</div>
            <div className="text-[12px] mt-1" style={{ color: colors.mutedForeground }}>
              Free use is capped to keep study time focused and fair for every student.
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2" style={{ background: colors.secondary }}>
            <Icon name="x" size={16} color={colors.foreground} />
          </button>
        </div>

        <div className="mt-4 space-y-2 text-[12px]" style={{ color: colors.foreground }}>
          <div className="rounded-2xl border p-3" style={{ borderColor: colors.border, background: "#fff7ed" }}>
            <div className="font-semibold">What you unlock</div>
            <ul className="mt-1 list-disc pl-4 space-y-1">
              <li>5 AI doubt solves per day on the free plan</li>
              <li>7 flashcards to browse per day</li>
              <li>3 previous-paper attempts per day</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-3" style={{ borderColor: colors.border, background: "#eff6ff" }}>
            <div className="font-semibold">Why upgrade</div>
            <ul className="mt-1 list-disc pl-4 space-y-1">
              <li>Unlock unlimited AI help, flashcard revision, and paper practice</li>
              <li>Keep your streak going without daily limits getting in the way</li>
              <li>Get access to the full student Super App experience</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border py-2.5 text-[13px] font-semibold"
            style={{ borderColor: colors.border, background: colors.secondary, color: colors.foreground }}
          >
            Maybe later
          </button>
          <button
            onClick={onUpgrade}
            disabled={loading}
            className="flex-1 rounded-2xl py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
            style={{ background: colors.primary }}
          >
            {loading ? "Processing…" : "Upgrade Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
