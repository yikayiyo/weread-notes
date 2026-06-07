"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";
import "lenis/dist/lenis.css";

export function LenisProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState({
    lerp: 1,
    smoothWheel: false,
    syncTouch: false,
  });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOptions(
      reduced
        ? { lerp: 1, smoothWheel: false, syncTouch: false }
        : { lerp: 0.08, smoothWheel: true, syncTouch: false },
    );
  }, []);

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
