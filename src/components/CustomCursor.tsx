"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Active Theory-style custom cursor: a small dot plus a trailing ring that
 * eases toward the pointer. Expands and shows a label when hovering anything
 * carrying a `data-cursor` attribute (e.g. data-cursor="view").
 *
 * Disabled entirely on touch devices and when the user prefers reduced
 * motion — a custom cursor has no meaning on a touchscreen and forcing it
 * there would just break tap interactions.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { damping: 28, stiffness: 320, mass: 0.4 });
  const springY = useSpring(y, { damping: 28, stiffness: 320, mass: 0.4 });

  const targetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isEnabled = hasFinePointer && !reducedMotion;
    setEnabled(isEnabled);
    if (isEnabled) document.body.classList.add("cursor-none-custom");
    return () => document.body.classList.remove("cursor-none-custom");
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-cursor]");
      targetRef.current = el;
      if (el) {
        setHovering(true);
        setLabel(el.getAttribute("data-cursor") || null);
      } else {
        setHovering(false);
        setLabel(null);
      }
    };

    const leave = () => setVisible(false);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerleave", leave);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerleave", leave);
    };
  }, [enabled, visible, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[80] mix-blend-difference"
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
    >
      <motion.div
        className="flex items-center justify-center rounded-full border border-bone bg-bone/0 text-center"
        animate={{
          width: hovering ? 88 : 14,
          height: hovering ? 88 : 14,
          marginLeft: hovering ? -44 : -7,
          marginTop: hovering ? -44 : -7,
          backgroundColor: hovering ? "rgba(244,241,236,1)" : "rgba(244,241,236,0.9)",
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {hovering && label && (
          <span className="select-none text-[10px] font-medium uppercase tracking-[0.15em] text-ink">
            {label}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
