import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBackdrop from "@/components/BackgroundBackdrop";
import GalleryGrid from "@/components/GalleryGrid";
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
  const { email, phone, instagram, location } = content.contact;

  return (
    <PhotoViewerProvider photos={photos}>
      <main className="relative min-h-screen">
        <BackgroundBackdrop imageUrl={settings.backgroundImage || undefined} />
        <Navbar />

        {/* Hero */}
        <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
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
              <a
                href="#gallery"
                data-cursor="go"
                className="rounded-full border border-accent/60 bg-accent/10 px-7 py-3 text-sm uppercase tracking-[0.18em] text-bone transition hover:bg-accent/20"
              >
                View Gallery
              </a>
              <a
                href="#contact"
                data-cursor="go"
                className="rounded-full px-7 py-3 text-sm uppercase tracking-[0.18em] text-bone/70 transition hover:text-bone"
              >
                Get in Touch
              </a>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-bone/40">
            Scroll
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="relative z-10 px-6 pb-28 pt-28 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="mb-10 font-display text-3xl text-bone/90 sm:text-4xl">Gallery</h2>
            </Reveal>
            <GalleryGrid photos={photos} />
          </div>
        </section>

        {/* About */}
        <section id="about" className="relative z-10 px-6 pb-28 pt-10 sm:px-10">
          <div className="mx-auto grid max-w-4xl items-center gap-12 sm:grid-cols-[minmax(0,220px)_1fr]">
            {settings.aboutImage && (
              <Reveal>
                <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-lg border border-white/10">
                  <Image src={settings.aboutImage} alt="Varun Nagalla" fill className="object-cover" />
                </div>
              </Reveal>
            )}
            <div>
              <Reveal variant="mask">
                <h2 className="mb-8 font-display text-3xl text-bone/90 sm:text-4xl">{content.about.heading}</h2>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="whitespace-pre-line text-lg leading-relaxed text-bone/75">{content.about.body}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="relative z-10 flex min-h-[70vh] items-center px-6 pb-28 pt-10 sm:px-10">
          <div className="mx-auto max-w-2xl">
            <Reveal variant="mask">
              <h2 className="mb-8 font-display text-3xl text-bone/90 sm:text-4xl">Let&apos;s Connect</h2>
            </Reveal>
            <Reveal delay={0.15}>
              <dl className="space-y-6 text-lg text-bone/80">
                {email && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-accent/80">Email</dt>
                    <dd className="mt-1">
                      <a href={`mailto:${email}`} data-cursor="email" className="hover:text-accent transition-colors">
                        {email}
                      </a>
                    </dd>
                  </div>
                )}
                {phone && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-accent/80">Phone</dt>
                    <dd className="mt-1">{phone}</dd>
                  </div>
                )}
                {instagram && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-accent/80">Instagram</dt>
                    <dd className="mt-1">{instagram}</dd>
                  </div>
                )}
                {location && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.2em] text-accent/80">Based in</dt>
                    <dd className="mt-1">{location}</dd>
                  </div>
                )}
                {!email && !phone && !instagram && !location && (
                  <p className="text-bone/50">Contact details coming soon.</p>
                )}
              </dl>
            </Reveal>
          </div>
        </section>

        <Footer email={email} instagram={instagram} location={location} />
      </main>
    </PhotoViewerProvider>
  );
}
