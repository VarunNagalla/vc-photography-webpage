"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** "fade" for a simple fade-up, "mask" for a clip-path line reveal (good for headings). */
  variant?: "fade" | "mask";
}

/**
 * Scroll-triggered entrance animation used across About/Contact/Home.
 * Respects prefers-reduced-motion by skipping straight to the end state.
 */
export default function Reveal({ children, className, delay = 0, variant = "fade" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      gsap.set(el, { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" });
      return;
    }

    const fromVars =
      variant === "mask"
        ? { clipPath: "inset(0 0 100% 0)", opacity: 1 }
        : { opacity: 0, y: 32 };
    const toVars =
      variant === "mask"
        ? { clipPath: "inset(0 0 0% 0)" }
        : { opacity: 1, y: 0 };

    gsap.set(el, fromVars);
    const tween = gsap.to(el, {
      ...toVars,
      duration: 1.1,
      delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, variant]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
