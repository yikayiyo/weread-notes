import { SiteMarkSvg } from "./SiteMark.generated";

export function SiteMark({ className }: { className?: string }) {
  return (
    <SiteMarkSvg
      className={[
        "h-[1.625rem] w-auto sm:h-[1.875rem]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
