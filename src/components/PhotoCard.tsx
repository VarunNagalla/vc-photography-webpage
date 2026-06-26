"use client";

import Image from "next/image";
import { useState } from "react";

interface PhotoCardProps {
  src: string;
  caption?: string;
  priority?: boolean;
}

export default function PhotoCard({ src, caption, priority }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="group relative mb-6 break-inside-avoid overflow-hidden rounded-sm bg-white/5">
      <div className={`relative w-full transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}>
        <Image
          src={src}
          alt={caption || "Photograph"}
          width={1200}
          height={1500}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          priority={priority}
          onLoad={() => setLoaded(true)}
        />
      </div>
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm text-bone/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
