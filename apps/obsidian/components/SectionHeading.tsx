import Link from "../ui-adapters";
import { sectionAccents, type SectionAccent } from "../lib/colors";
import { ScrollReveal } from "./ScrollReveal";

export function SectionHeading({
  title,
  href,
  linkLabel,
  accent,
  initialVisible = false,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  accent?: SectionAccent;
  initialVisible?: boolean;
}) {
  const colors = accent ? sectionAccents[accent] : null;

  return (
    <ScrollReveal initialVisible={initialVisible}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="section-label">
          {title}
        </h2>
        {href && linkLabel && (
          <Link
            href={href}
            className={`inline-flex min-h-11 shrink-0 items-center text-sm transition-colors ${
              colors
                ? `${colors.link} ${colors.linkHover}`
                : "text-secondary hover:text-primary"
            }`}
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </ScrollReveal>
  );
}
