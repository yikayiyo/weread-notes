"use client";

import { useState } from "react";
import { useTheme } from "../ui-adapters";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = mounted && theme === "dark";
  const [animate, setAnimate] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setAnimate(true);
        toggleTheme();
      }}
      className="theme-toggle icon-btn inline-flex shrink-0 items-center justify-center"
      data-animate={animate ? "" : undefined}
      aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
      title={isDark ? "浅色模式" : "深色模式"}
    >
      <span className="theme-toggle-icons" aria-hidden="true">
        <span className="theme-toggle-sun"><SunIcon /></span>
        <span className="theme-toggle-moon"><MoonIcon /></span>
      </span>
    </button>
  );
}
