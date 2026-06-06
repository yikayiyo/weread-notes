import { sectionAccents, type SectionAccent } from "@/lib/colors";

export function PageSection({
  accent,
  bleed = false,
  className = "",
  children,
}: {
  accent?: SectionAccent;
  bleed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const surface = accent ? sectionAccents[accent].surface : undefined;

  return (
    <section
      className={[
        "space-y-[var(--block-gap)] rounded-sm py-[var(--block-gap)]",
        surface,
        bleed ? "-mx-[var(--page-gutter)] px-[var(--page-gutter)]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
