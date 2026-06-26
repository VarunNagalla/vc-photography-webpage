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
    <div className="grid grid-cols-1 gap-px sm:grid-cols-2">
      {photos.map((photo, i) => (
        <div key={photo.id} className={i % 5 === 0 ? "sm:col-span-2" : ""}>
          <PhotoCard photo={photo} index={i} priority={i < 2} />
        </div>
      ))}
    </div>
  );
}
