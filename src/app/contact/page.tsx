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

export const metadata = { title: "Contact — Varun Nagalla Photography" };

export default async function ContactPage() {
  const [content, settings] = await Promise.all([getContent(), getSettings()]);
  const { email, phone, instagram, location } = content.contact;

  return (
    <main className="relative min-h-screen">
      <BackgroundBackdrop imageUrl={settings.backgroundImage || undefined} />
      <Navbar />
      <section className="relative z-10 flex min-h-screen items-center px-6 pt-24 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <Reveal variant="mask">
            <h1 className="mb-8 font-display text-4xl text-bone/90 sm:text-5xl">Let&apos;s Connect</h1>
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
  );
}
