"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  initialVisible = false,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  initialVisible?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    if (initialVisible) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [initialVisible]);

  return (
    <div
      ref={ref}
      className={[
        "scroll-reveal",
        visible ? "scroll-reveal-visible" : "scroll-reveal-pending",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ transitionDelay: visible ? `${delayMs}ms` : undefined }}
    >
      {children}
    </div>
  );
}
