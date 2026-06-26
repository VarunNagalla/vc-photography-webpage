import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBackdrop from "@/components/BackgroundBackdrop";
import PhotoCard from "@/components/PhotoCard";
import Hero3D from "@/components/Hero3DLoader";
import Reveal from "@/components/Reveal";
import { PhotoViewerProvider } from "@/components/gallery/PhotoViewer";
import { getPhotos } from "@/lib/photos";
import { getContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";

// Always render fresh — admin can change photos/content/background at
// any time and visitors must see the update immediately, not a build-time
// snapshot.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [photos, content, settings] = await Promise.all([getPhotos(), getContent(), getSettings()]);
  const featured = photos.slice(0, 6);

  return (
    <PhotoViewerProvider photos={featured}>
      <main className="relative min-h-screen">
        <BackgroundBackdrop imageUrl={settings.backgroundImage || undefined} />
        <Navbar />

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
          <Hero3D photoUrls={photos.slice(0, 5).map((p) => p.url)} />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <p className="mb-4 animate-fade-in text-xs uppercase tracking-[0.35em] text-accent/90">
              Photography Portfolio
            </p>
            <Reveal variant="mask">
              <h1 className="font-display text-balance text-5xl font-medium leading-tight sm:text-7xl">
                {content.hero.title}
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mx-auto mt-6 max-w-xl text-balance text-base text-bone/70 sm:text-lg">
                {content.hero.subtitle}
              </p>
            </Reveal>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/gallery"
                data-cursor="go"
                className="rounded-full border border-accent/60 bg-accent/10 px-7 py-3 text-sm uppercase tracking-[0.18em] text-bone transition hover:bg-accent/20"
              >
                View Gallery
              </Link>
              <Link
                href="/contact"
                data-cursor="go"
                className="rounded-full px-7 py-3 text-sm uppercase tracking-[0.18em] text-bone/70 transition hover:text-bone"
              >
                Get in Touch
              </Link>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-bone/40">
            Scroll
          </div>
        </section>

        {featured.length > 0 && (
          <section className="relative z-10 px-6 pb-28 pt-10 sm:px-10">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="mb-10 flex items-end justify-between">
                  <h2 className="font-display text-3xl text-bone/90">Selected Work</h2>
                  <Link href="/gallery" data-cursor="go" className="text-xs uppercase tracking-[0.2em] text-accent hover:underline">
                    View all &rarr;
                  </Link>
                </div>
              </Reveal>
              <div className="grid grid-cols-1 gap-px sm:grid-cols-3">
                {featured.map((photo, i) => (
                  <PhotoCard key={photo.id} photo={photo} index={i} priority={i < 3} />
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer email={content.contact.email} instagram={content.contact.instagram} location={content.contact.location} />
      </main>
    </PhotoViewerProvider>
  );
}
