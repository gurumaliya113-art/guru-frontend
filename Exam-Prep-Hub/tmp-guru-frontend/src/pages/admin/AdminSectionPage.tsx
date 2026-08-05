import { Icon } from "@/components/ui";
import { colors } from "@/lib/colors";

interface AdminSectionPageProps {
  title: string;
  description: string;
  help?: string;
}

export default function AdminSectionPage({ title, description, help }: AdminSectionPageProps) {
  return (
    <div className="min-h-full p-6 max-w-5xl mx-auto">
      <div className="rounded-3xl border p-6" style={{ borderColor: colors.border, background: colors.card }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: colors.primary }}>
            <Icon name="settings" size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>{title}</h1>
            <p className="mt-1 text-sm" style={{ color: colors.mutedForeground }}>{description}</p>
          </div>
        </div>

        <div className="mt-6 text-sm leading-6" style={{ color: colors.foreground }}>
          {help ? help : "This section is under construction but the navigation is now stable. Use the existing admin pages for Notes, PYP, Upload PDF, Questions, and Flashcards."}
        </div>
      </div>
    </div>
  );
}
