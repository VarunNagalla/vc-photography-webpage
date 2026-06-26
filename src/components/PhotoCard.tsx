"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Photo } from "@/lib/photos";
import { usePhotoViewer } from "./gallery/PhotoViewer";
import ProtectedImage from "./ProtectedImage";

interface PhotoCardProps {
  photo: Photo;
  index: number;
  priority?: boolean;
}

/**
 * Large, full-bleed-feeling tile (no conventional small-thumbnail grid).
 * Hovering scales and slightly darkens the image and reveals an index +
 * caption; the custom cursor switches to a "View" label via data-cursor.
 * Clicking hands off to the PhotoViewer for the WebGL dissolve transition.
 */
export default function PhotoCard({ photo, index, priority }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const { open } = usePhotoViewer();

  return (
    <button
      type="button"
      onClick={(e) => open(photo, e)}
      data-cursor="view"
      className="group relative block aspect-[4/5] w-full overflow-hidden bg-white/5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/60"
    >
      <div className={`absolute inset-0 transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}>
        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.07 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <ProtectedImage
            src={photo.url}
            alt={photo.caption || "Photograph"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={priority}
            onLoad={() => setLoaded(true)}
          />
        </motion.div>
        <div className="absolute inset-0 bg-ink opacity-0 transition-opacity duration-500 group-hover:opacity-30" />
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-7">
        <span className="self-start text-xs uppercase tracking-[0.2em] text-bone/50">
          {String(index + 1).padStart(2, "0")}
        </span>
        {photo.caption && (
          <span className="max-w-[80%] translate-y-2 text-sm uppercase tracking-[0.15em] text-bone/90 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            {photo.caption}
          </span>
        )}
      </div>
    </button>
  );
}
