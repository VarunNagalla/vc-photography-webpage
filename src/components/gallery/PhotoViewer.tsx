"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { Photo } from "@/lib/photos";
import ProtectedImage from "@/components/ProtectedImage";

// Loaded client-only: see PhotoDissolveCanvas.tsx for why this can't be a
// plain top-level import in a component that gets server-rendered.
const PhotoDissolveCanvas = dynamic(() => import("./PhotoDissolveCanvas"), {
  ssr: false,
});

interface ViewerState {
  photo: Photo | null;
  origin: { x: number; y: number };
  phase: "closed" | "opening" | "open" | "closing";
}

interface PhotoViewerContextValue {
  open: (photo: Photo, e: { clientX: number; clientY: number }) => void;
  close: () => void;
}

const PhotoViewerContext = createContext<PhotoViewerContextValue | null>(null);

export function usePhotoViewer() {
  const ctx = useContext(PhotoViewerContext);
  if (!ctx) throw new Error("usePhotoViewer must be used within PhotoViewerProvider");
  return ctx;
}

function useCapabilities() {
  const [canUseWebGL, setCanUseWebGL] = useState(false);
  useEffect(() => {
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let glOk = false;
    try {
      const canvas = document.createElement("canvas");
      glOk = !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      glOk = false;
    }
    setCanUseWebGL(glOk && !coarse && !reduced);
  }, []);
  return canUseWebGL;
}

export function PhotoViewerProvider({
  photos,
  children,
}: {
  photos: Photo[];
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canUseWebGL = useCapabilities();

  const [state, setState] = useState<ViewerState>({
    photo: null,
    origin: { x: 0.5, y: 0.5 },
    phase: "closed",
  });

  // Deep-linkable: /gallery?photo=<id> opens directly (also makes the
  // browser back button close the viewer correctly).
  useEffect(() => {
    const id = searchParams.get("photo");
    if (!id) {
      if (state.phase === "open") setState((s) => ({ ...s, phase: "closing" }));
      return;
    }
    const match = photos.find((p) => p.id === id);
    if (match && state.photo?.id !== match.id) {
      setState({ photo: match, origin: { x: 0.5, y: 0.5 }, phase: canUseWebGL ? "opening" : "open" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, photos, canUseWebGL]);

  const open = useCallback(
    (photo: Photo, e: { clientX: number; clientY: number }) => {
      const origin = {
        x: e.clientX / window.innerWidth,
        y: 1 - e.clientY / window.innerHeight,
      };
      setState({ photo, origin, phase: canUseWebGL ? "opening" : "open" });
      router.push(`?photo=${photo.id}`, { scroll: false });
    },
    [canUseWebGL, router]
  );

  const close = useCallback(() => {
    setState((s) => ({ ...s, phase: canUseWebGL ? "closing" : "closed" }));
    router.push("?", { scroll: false });
  }, [canUseWebGL, router]);

  useEffect(() => {
    if (state.phase !== "closing" || canUseWebGL) return;
    setState((s) => ({ ...s, photo: null, phase: "closed" }));
  }, [state.phase, canUseWebGL]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.photo) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.photo, close]);

  const ctxValue = useMemo(() => ({ open, close }), [open, close]);

  return (
    <PhotoViewerContext.Provider value={ctxValue}>
      {children}

      {state.photo && canUseWebGL && (state.phase === "opening" || state.phase === "closing") && (
        <PhotoDissolveCanvas
          url={state.photo.url}
          origin={state.origin}
          reverse={state.phase === "closing"}
          onDone={() =>
            setState((s) =>
              s.phase === "opening"
                ? { ...s, phase: "open" }
                : { photo: null, origin: s.origin, phase: "closed" }
            )
          }
        />
      )}

      {state.photo && state.phase === "open" && (
        <div
          className="fixed inset-0 z-[64] flex items-center justify-center bg-ink/95 px-4 py-10 backdrop-blur-sm sm:px-10"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            data-cursor="close"
            className="absolute right-6 top-6 z-10 text-xs uppercase tracking-[0.2em] text-bone/70 transition-colors hover:text-accent sm:right-10 sm:top-8"
          >
            Close ✕
          </button>
          <figure className="relative flex max-h-full max-w-5xl flex-col items-center">
            <div className="relative max-h-[78vh] w-full">
              <ProtectedImage
                src={state.photo.url}
                alt={state.photo.caption || "Photograph"}
                width={1600}
                height={1067}
                sizes="90vw"
                className="h-auto max-h-[78vh] w-auto rounded-sm object-contain"
                priority
              />
            </div>
            {state.photo.caption && (
              <figcaption className="mt-6 text-center text-sm uppercase tracking-[0.15em] text-bone/60">
                {state.photo.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </PhotoViewerContext.Provider>
  );
}
