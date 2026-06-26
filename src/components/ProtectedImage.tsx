"use client";

import Image, { type ImageProps } from "next/image";

/**
 * Drop-in replacement for next/image used anywhere we render a portfolio
 * photo. Blocks the most common casual ways visitors grab the file:
 * dragging it out, right-clicking "Save image as", and the iOS long-press
 * "Save to Photos" callout. This is a deterrent, not real protection — the
 * image is still loaded into the page and can be retrieved via dev tools or
 * the network tab by anyone determined to — but it stops the easy paths.
 */
export default function ProtectedImage(props: ImageProps) {
  return (
    <Image
      {...props}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
