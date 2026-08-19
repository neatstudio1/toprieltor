"use client";

import { useEffect, useRef, type ReactNode, type HTMLAttributes } from "react";

type RevealTag = "div" | "section" | "article";

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: RevealTag;
  delayMs?: number;
}

export function Reveal({ children, as = "div", delayMs = 0, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.style.transitionDelay = `${delayMs}ms`;
            el.classList.add("is-visible");
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);

  const As = as as "div";

  return (
    <As ref={ref} data-reveal="" {...rest}>
      {children}
    </As>
  );
}
