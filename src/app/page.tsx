import nextDynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBackdrop from "@/components/BackgroundBackdrop";
import PhotoCard from "@/components/PhotoCard";
import { getPhotos } from "@/lib/photos";
import { getContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";

// Always render fresh — admin can change photos/content/background at
// any time and visitors must see the update immediately, not a build-time
// snapshot.
export const dynamic = "force-dynamic";

const Hero3D = nextDynamic(() => import("@/components/Hero3D"), { ssr: false });

export default async function HomePage() {
  const [photos, content, settings] = await Promise.all([getPhotos(), getContent(), getSettings()]);
  const featured = photos.slice(0, 6);

  return (
    <main className="relative min-h-screen">
      <BackgroundBackdrop imageUrl={settings.backgroundImage || undefined} />
      <Navbar />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <Hero3D photoUrls={photos.slice(0, 5).map((p) => p.url)} />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="mb-4 animate-fade-in text-xs uppercase tracking-[0.35em] text-accent/90">
            Photography Portfolio
          </p>
          <h1 className="animate-fade-up font-display text-balance text-5xl font-medium leading-tight sm:text-7xl">
            {content.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl animate-fade-up text-balance text-base text-bone/70 sm:text-lg" style={{ animationDelay: "0.2s" }}>
            {content.hero.subtitle}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4" style={{ animationDelay: "0.4s" }}>
            <Link
              href="/gallery"
              className="rounded-full border border-accent/60 bg-accent/10 px-7 py-3 text-sm uppercase tracking-[0.18em] text-bone transition hover:bg-accent/20"
            >
              View Gallery
            </Link>
            <Link
              href="/contact"
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
            <div className="mb-10 flex items-end justify-between">
              <h2 className="font-display text-3xl text-bone/90">Selected Work</h2>
              <Link href="/gallery" className="text-xs uppercase tracking-[0.2em] text-accent hover:underline">
                View all &rarr;
              </Link>
            </div>
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {featured.map((photo, i) => (
                <PhotoCard key={photo.id} src={photo.url} caption={photo.caption} priority={i < 3} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer email={content.contact.email} instagram={content.contact.instagram} location={content.contact.location} />
    </main>
  );
}
