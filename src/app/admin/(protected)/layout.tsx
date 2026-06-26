import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/content", label: "Site Content" },
  { href: "/admin/background", label: "Background" },
];

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already gates this route, but we also
  // verify the session server-side in case middleware config ever drifts.
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-ink text-bone">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 flex-col border-r border-white/10 bg-black/30 p-6 sm:flex">
          <p className="mb-8 font-display text-xl text-bone/90">Admin Panel</p>
          <nav className="flex flex-col gap-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-3 py-2 text-bone/70 transition hover:bg-white/5 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <Link href="/" className="block text-xs uppercase tracking-[0.15em] text-bone/50 hover:text-bone">
              &larr; View Site
            </Link>
            <LogoutButton />
          </div>
        </aside>
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
