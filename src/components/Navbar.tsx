import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "#gallery", label: "Gallery" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar({ logoImage }: { logoImage?: string }) {
  return (
    <header className="fixed top-0 inset-x-0 z-30">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link
          href="/"
          aria-label="Varun Nagalla Photography — Home"
          data-cursor="home"
          className="font-display text-xl tracking-[0.15em] text-bone/90 hover:text-accent transition-colors"
        >
          {logoImage ? (
            <Image src={logoImage} alt="Varun Nagalla Photography logo" width={48} height={48}
              priority className="h-12 w-12 rounded-full object-contain" />
          ) : "VN"}
        </Link>
        <ul className="flex items-center gap-4 text-xs sm:gap-8 sm:text-sm uppercase tracking-[0.18em] text-bone/70">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} data-cursor="go" className="hover:text-accent transition-colors">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
