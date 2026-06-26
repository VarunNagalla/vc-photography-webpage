import PhotoCard from "./PhotoCard";
import type { Photo } from "@/lib/photos";

export default function GalleryGrid({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center text-bone/50">
        <p className="font-display text-lg">No photographs published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
      {photos.map((photo, i) => (
        <PhotoCard key={photo.id} src={photo.url} caption={photo.caption} priority={i < 3} />
      ))}
    </div>
  );
}
