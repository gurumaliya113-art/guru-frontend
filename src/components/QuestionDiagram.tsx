// Renders a question's diagram (the PDF-page / cropped figure PNG).
//
// Handles the three states a question can be in:
//   1. A usable `url` is present  -> show the image (with an optional
//      download button). If the image fails to load we fall back to (2).
//   2. No usable image but the question is flagged `hasFigure`      -> show a
//      clear "diagram unavailable" placeholder instead of silently showing
//      nothing, so the student knows a figure was expected.
//   3. No image and no figure flag -> render nothing.
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { colors } from "@/lib/colors";

export default function QuestionDiagram({
  url,
  hasFigure,
  maxHeight = 360,
  downloadName,
  className,
}: {
  url?: string | null;
  hasFigure?: boolean;
  maxHeight?: number;
  /** When set, a Download button overlays the image. */
  downloadName?: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  // Reset the error flag if the URL changes (e.g. navigating between
  // questions reuses this component instance).
  useEffect(() => { setErrored(false); }, [url]);

  const hasImage = Boolean(url) && !errored;

  if (hasImage) {
    return (
      <div className={className ?? "mb-3 rounded-lg overflow-hidden border"} style={{ borderColor: colors.border }}>
        <div className="relative">
          <img
            src={url as string}
            alt="Question diagram"
            className="w-full block"
            style={{ background: "#fff", maxHeight, objectFit: "contain" }}
            loading="lazy"
            onError={() => setErrored(true)}
          />
          {downloadName && (
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = url as string;
                link.download = downloadName;
                link.click();
              }}
              className="absolute top-2 right-2 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-lg"
              style={{ background: colors.primary }}
              title="Download image"
            >
              Download
            </button>
          )}
        </div>
      </div>
    );
  }

  // No usable image. Only surface a placeholder when a figure was expected.
  if (hasFigure) {
    return (
      <div
        className={className ?? "mb-3"}
        style={{
          border: `1.5px dashed ${colors.border}`,
          borderRadius: 12,
          background: colors.muted,
          padding: 16,
        }}
      >
        <div className="flex items-center gap-2" style={{ color: colors.mutedForeground }}>
          <Icon name="image" size={16} color={colors.mutedForeground} />
          <span className="text-xs font-medium">
            {errored
              ? "Diagram could not be loaded."
              : "This question refers to a diagram that isn't available yet."}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
