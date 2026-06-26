import Link from "next/link";
import { getPhotos } from "@/lib/photos";
import { getSettings } from "@/lib/settings";

export default async function AdminDashboardPage() {
  const [photos, settings] = await Promise.all([getPhotos(), getSettings()]);

  const cards = [
    { label: "Published Photos", value: photos.length, href: "/admin/photos" },
    { label: "Background Image", value: settings.backgroundImage ? "Custom" : "Default", href: "/admin/background" },
    { label: "Site Content", value: "Editable", href: "/admin/content" },
  ];

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-bone/90">Welcome back</h1>
      <p className="mb-10 text-sm text-bone/50">Manage every part of your photography site from here.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-white/10 bg-white/5 p-6 transition hover:border-accent/50 hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-[0.15em] text-bone/50">{card.label}</p>
            <p className="mt-2 font-display text-2xl text-bone/90">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
