"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import SmoothScrollProvider from "./SmoothScrollProvider";
import CustomCursor from "./CustomCursor";
import PageTransition from "./PageTransition";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SmoothScrollProvider>
        <CustomCursor />
        <PageTransition>{children}</PageTransition>
      </SmoothScrollProvider>
    </SessionProvider>
  );
}
