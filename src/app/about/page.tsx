import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBackdrop from "@/components/BackgroundBackdrop";
import Reveal from "@/components/Reveal";
import { getContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";

// Always render fresh — admin can change photos/content/background at
// any time and visitors must see the update immediately, not a build-time
// snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "About — Varun Nagalla Photography" };

export default async function AboutPage() {
  const [content, settings] = await Promise.all([getContent(), getSettings()]);

  return (
    <main className="relative min-h-screen">
      <BackgroundBackdrop imageUrl={settings.backgroundImage || undefined} />
      <Navbar />
      <section className="relative z-10 flex min-h-screen items-center px-6 pt-24 sm:px-10">
        <div className="mx-auto grid max-w-4xl items-center gap-12 sm:grid-cols-[minmax(0,220px)_1fr]">
          {settings.aboutImage && (
            <Reveal>
              <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-lg border border-white/10">
                <Image
                  src={settings.aboutImage}
                  alt="Varun Nagalla"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </Reveal>
          )}
          <div>
            <Reveal variant="mask">
              <h1 className="mb-8 font-display text-4xl text-bone/90 sm:text-5xl">{content.about.heading}</h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="whitespace-pre-line text-lg leading-relaxed text-bone/75">{content.about.body}</p>
            </Reveal>
          </div>
        </div>
      </section>
      <Footer email={content.contact.email} instagram={content.contact.instagram} location={content.contact.location} />
    </main>
  );
}
