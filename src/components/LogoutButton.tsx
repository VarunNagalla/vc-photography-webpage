"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.15em] text-bone/70 transition hover:border-accent/60 hover:text-accent"
    >
      Sign Out
    </button>
  );
}
