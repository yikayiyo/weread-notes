import Link from "next/link";
import { sectionAccents, type SectionAccent } from "@/lib/colors";
import { ScrollReveal } from "./ScrollReveal";

export function SectionHeading({
  title,
  href,
  linkLabel,
  accent,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  accent?: SectionAccent;
}) {
  const colors = accent ? sectionAccents[accent] : null;

  return (
    <ScrollReveal>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-center gap-3">
          {colors && (
            <span
              className={`h-4 w-0.5 shrink-0 rounded-full ${colors.bar}`}
              aria-hidden="true"
            />
          )}
          <h2
            className={`font-title text-sm tracking-[0.2em] ${
              colors ? colors.title : "text-secondary"
            }`}
          >
            {title}
          </h2>
        </div>
        {href && linkLabel && (
          <Link
            href={href}
            className={`inline-flex min-h-11 shrink-0 items-center text-sm transition-colors ${
              colors
                ? `${colors.link} ${colors.linkHover}`
                : "text-accent hover:text-primary"
            }`}
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </ScrollReveal>
  );
}
