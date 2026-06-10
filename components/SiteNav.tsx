"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pageAccent, sectionAccents } from "@/lib/colors";

const links = [
  { href: "/", label: "首页" },
  { href: "/notes", label: "摘录" },
  { href: "/archive", label: "归档" },
  { href: "/about", label: "关于" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-4 gap-y-0 text-sm text-secondary sm:gap-x-5">
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        const accent = sectionAccents[pageAccent[link.href] ?? "sage"];

        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={link.href === "/" || link.href === "/about"}
            className={`inline-flex min-h-11 items-center rounded-[2px] focus-ring transition-colors ${
              active
                ? `${accent.tabActive} font-medium`
                : "hover:text-accent"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
