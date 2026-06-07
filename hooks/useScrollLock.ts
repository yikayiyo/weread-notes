"use client";

import { useLenis } from "lenis/react";
import { useEffect } from "react";

function getScrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth;
}

function setScrollbarCompensation(width: number) {
  if (width > 0) {
    document.documentElement.style.setProperty(
      "--scrollbar-compensation",
      `${width}px`,
    );
  } else {
    document.documentElement.style.removeProperty("--scrollbar-compensation");
  }
}

export function useScrollLock(locked: boolean) {
  const lenis = useLenis();

  useEffect(() => {
    if (!locked) return;

    const scrollbarWidth = getScrollbarWidth();
    setScrollbarCompensation(scrollbarWidth);

    lenis?.stop();
    document.documentElement.classList.add("scroll-locked");

    const scrollY = window.scrollY;
    let restored = false;

    const restore = () => {
      if (restored) return;
      restored = true;
      lenis?.start();
      document.documentElement.classList.remove("scroll-locked");
      setScrollbarCompensation(0);
      if (!lenis) {
        window.scrollTo(0, scrollY);
      }
    };

    if (!lenis) {
      document.body.style.setProperty("position", "fixed");
      document.body.style.setProperty("top", `-${scrollY}px`);
      document.body.style.setProperty("width", "100%");
    }

    return () => {
      if (!lenis) {
        document.body.style.removeProperty("position");
        document.body.style.removeProperty("top");
        document.body.style.removeProperty("width");
      }
      restore();
    };
  }, [locked, lenis]);
}
