"use client";

import { useEffect } from "react";

/* Adds .dwg-live to any [data-dwg] element once it enters the viewport, so
   its draw/pop animations start when seen rather than on page load. */
export function DrawingsLive() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-dwg]"));
    if (els.length === 0) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("dwg-live"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("dwg-live");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.25 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
