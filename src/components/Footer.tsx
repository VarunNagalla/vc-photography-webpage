interface FooterProps {
  email?: string;
  instagram?: string;
  location?: string;
}

export default function Footer({ email, instagram, location }: FooterProps) {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/40 px-6 py-10 text-center text-sm text-bone/60 sm:px-10">
      <p className="font-display text-base tracking-wide text-bone/80">Varun Nagalla Photography</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.15em]">
        {email && <span>{email}</span>}
        {instagram && <span>{instagram}</span>}
        {location && <span>{location}</span>}
      </div>
      <p className="mt-6 text-[11px] text-bone/40">
        &copy; {new Date().getFullYear()} Varun Nagalla. All rights reserved.
      </p>
    </footer>
  );
}
