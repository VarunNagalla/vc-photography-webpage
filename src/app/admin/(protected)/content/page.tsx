"use client";

import { useEffect, useState, type FormEvent } from "react";

interface SiteContent {
  hero: { title: string; subtitle: string };
  about: { heading: string; body: string };
  contact: { email: string; phone: string; instagram: string; location: string };
}

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((data) => setContent(data.content));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });

    setSaving(false);
    if (res.ok) {
      setMessage("Saved.");
    } else {
      setError("Could not save. Check the form for invalid values.");
    }
  }

  if (!content) return <p className="text-sm text-bone/50">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-3xl text-bone/90">Site Content</h1>
      <p className="mb-8 text-sm text-bone/50">Edit every piece of text shown across the site.</p>

      <form onSubmit={handleSubmit} className="space-y-10">
        <fieldset className="space-y-4">
          <legend className="mb-2 font-display text-lg text-accent/90">Home Hero</legend>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-bone/60">Title</span>
            <input
              value={content.hero.title}
              maxLength={120}
              onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-bone outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-bone/60">Subtitle</span>
            <textarea
              value={content.hero.subtitle}
              maxLength={240}
              rows={2}
              onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-bone outline-none focus:border-accent"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 font-display text-lg text-accent/90">About</legend>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-bone/60">Heading</span>
            <input
              value={content.about.heading}
              maxLength={120}
              onChange={(e) => setContent({ ...content, about: { ...content.about, heading: e.target.value } })}
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-bone outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-bone/60">Body</span>
            <textarea
              value={content.about.body}
              maxLength={4000}
              rows={6}
              onChange={(e) => setContent({ ...content, about: { ...content.about, body: e.target.value } })}
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-bone outline-none focus:border-accent"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 font-display text-lg text-accent/90">Contact</legend>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-bone/60">Email</span>
            <input
              type="email"
              value={content.contact.email}
              maxLength={120}
              onChange={(e) => setContent({ ...content, contact: { ...content.contact, email: e.target.value } })}
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-bone outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-bone/60">Phone</span>
            <input
              value={content.contact.phone}
              maxLength={40}
              onChange={(e) => setContent({ ...content, contact: { ...content.contact, phone: e.target.value } })}
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-bone outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-bone/60">Instagram</span>
            <input
              value={content.contact.instagram}
              maxLength={120}
              onChange={(e) => setContent({ ...content, contact: { ...content.contact, instagram: e.target.value } })}
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-bone outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-[0.15em] text-bone/60">Location</span>
            <input
              value={content.contact.location}
              maxLength={160}
              onChange={(e) => setContent({ ...content, contact: { ...content.contact, location: e.target.value } })}
              className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-bone outline-none focus:border-accent"
            />
          </label>
        </fieldset>

        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent/90 px-6 py-2.5 text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-accent disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
