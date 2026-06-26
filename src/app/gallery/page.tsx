import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBackdrop from "@/components/BackgroundBackdrop";
import GalleryGrid from "@/components/GalleryGrid";
import { PhotoViewerProvider } from "@/components/gallery/PhotoViewer";
import { getPhotos } from "@/lib/photos";
import { getContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";

// Always render fresh — admin can change photos/content/background at
// any time and visitors must see the update immediately, not a build-time
// snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Gallery — Varun Nagalla Photography" };

export default async function GalleryPage() {
  const [photos, content, settings] = await Promise.all([getPhotos(), getContent(), getSettings()]);

  return (
    <PhotoViewerProvider photos={photos}>
      <main className="relative min-h-screen">
        <BackgroundBackdrop imageUrl={settings.backgroundImage || undefined} />
        <Navbar />
        <section className="relative z-10 px-6 pb-28 pt-36 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-12 font-display text-4xl text-bone/90 sm:text-5xl" data-reveal>
              Gallery
            </h1>
            <GalleryGrid photos={photos} />
          </div>
        </section>
        <Footer email={content.contact.email} instagram={content.contact.instagram} location={content.contact.location} />
      </main>
    </PhotoViewerProvider>
  );
}
