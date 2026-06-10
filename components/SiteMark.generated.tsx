/* eslint-disable */
// Static SVG logo — 不高山 in 京华老宋体 (KingHwaOldSong).
import {
  SITE_MARK_PATHS,
  SITE_MARK_VIEWBOX,
} from "@/lib/site-mark-data";

export { SITE_MARK_VIEWBOX } from "@/lib/site-mark-data";

export function SiteMarkSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      width="134"
      height="49"
      viewBox={SITE_MARK_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
    >
      {SITE_MARK_PATHS.map((path) => (
        <path
          key={path.transform}
          fill="currentColor"
          transform={path.transform}
          d={path.d}
        />
      ))}
    </svg>
  );
}
