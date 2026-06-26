"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

interface NavItem {
  href: string;
  label: string;
}

export default function AdminMobileNav({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 bg-black/30 sm:hidden">
      <div className="flex items-center justify-between px-4 py-4">
        <p className="font-display text-lg text-bone/90">Admin Panel</p>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded border border-white/15 text-bone/80 transition hover:border-accent/50 hover:text-accent"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 py-4 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded px-3 py-3 text-bone/70 transition hover:bg-white/5 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="mt-2 rounded px-3 py-3 text-xs uppercase tracking-[0.15em] text-bone/50 hover:text-bone"
          >
            &larr; View Site
          </Link>
          <div className="mt-2 px-3">
            <LogoutButton />
          </div>
        </nav>
      )}
    </div>
  );
}
