import Link from "next/link";

const links = [
  { href: "#gallery", label: "Gallery" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-30">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link
          href="/"
          data-cursor="home"
          className="font-display text-xl tracking-[0.15em] text-bone/90 hover:text-accent transition-colors"
        >
          VN
        </Link>
        <ul className="flex items-center gap-8 text-sm uppercase tracking-[0.18em] text-bone/70">
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
