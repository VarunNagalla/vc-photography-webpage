import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackgroundBackdrop from "@/components/BackgroundBackdrop";
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
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 font-display text-4xl text-bone/90 sm:text-5xl">{content.about.heading}</h1>
          <p className="whitespace-pre-line text-lg leading-relaxed text-bone/75">{content.about.body}</p>
        </div>
      </section>
      <Footer email={content.contact.email} instagram={content.contact.instagram} location={content.contact.location} />
    </main>
  );
}
