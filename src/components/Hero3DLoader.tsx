"use client";

import dynamic from "next/dynamic";

// Next.js 15 disallows `ssr: false` inside next/dynamic() when the call site
// is a Server Component. This thin client-only wrapper owns that option so
// page.tsx (an async Server Component) can stay server-rendered for content
// while the WebGL hero still loads client-side only.
const Hero3D = dynamic(() => import("@/components/Hero3D"), { ssr: false });

export default Hero3D;
