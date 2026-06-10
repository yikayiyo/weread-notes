import Link from "next/link";
import { SiteNav } from "./SiteNav";
import { ShareCardButton } from "./ShareCardButton";
import { SiteMark } from "./SiteMark";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header mb-[var(--header-gap)] pb-[var(--block-gap)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
        <Link
          href="/"
          className="group touch-target inline-flex items-center rounded-[2px] text-primary focus-ring transition-colors hover:text-accent"
          aria-label="不高山 首页"
        >
          <SiteMark />
        </Link>
        <div className="flex items-center gap-4 sm:gap-5">
          <SiteNav />
          <ShareCardButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
