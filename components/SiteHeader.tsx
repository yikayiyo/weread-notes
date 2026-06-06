import Link from "next/link";
import { SiteNav } from "./SiteNav";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header mb-[var(--header-gap)] pb-[var(--block-gap)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
        <Link href="/" className="group touch-target inline-flex items-center">
          <p className="font-title text-[1.625rem] tracking-wide text-primary transition-colors group-hover:text-accent sm:text-[1.875rem]">
            不高山
          </p>
        </Link>
        <div className="flex items-center gap-4 sm:gap-5">
          <SiteNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
