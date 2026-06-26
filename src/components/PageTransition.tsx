"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const curtain = {
  initial: { scaleY: 1 },
  animate: { scaleY: 0, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] as const, delay: 0.05 } },
  exit: { scaleY: 1, transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] as const } },
};

const page = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay: 0.35 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: [0.7, 0, 0.84, 0] as const } },
};

/**
 * Wraps every route in a curtain-wipe transition: a solid panel sweeps
 * down to cover the outgoing page, then sweeps away (origin-top -> bottom)
 * to reveal the new one underneath as it fades/rises into place. Keyed on
 * the pathname so App Router navigations re-trigger it.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} className="relative">
        <motion.div
          variants={curtain}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ transformOrigin: "top" }}
          className="pointer-events-none fixed inset-0 z-[70] bg-ink"
        />
        <motion.div variants={page} initial="initial" animate="animate" exit="exit">
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
