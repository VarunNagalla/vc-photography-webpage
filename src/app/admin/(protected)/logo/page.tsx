"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLogoPage() {
  const router = useRouter();
  const [logoImage, setLogoImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/logo", { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Couldn't load your logo. Refresh the page to retry.");
        const data = await response.json();
        setLogoImage(data.settings.logoImage || "");
      })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function save(file?: File) {
    setMessage("");
    setError("");
    if (file && (file.size === 0 || file.size > 4 * 1024 * 1024)) {
      setError("Choose a non-empty image under 4 MB.");
      return;
    }
    if (!file && !confirm("Remove your logo and show VN instead?")) return;
    setBusy(true);
    try {
      const body = new FormData();
      if (file) body.append("file", file);
      const response = await fetch("/api/admin/logo", {
        method: file ? "POST" : "DELETE", body: file ? body : undefined,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't save your logo. Please try again.");
      }
      const data = await response.json();
      setLogoImage(data.settings.logoImage || "");
      setMessage(file ? "Logo updated in the header and beside Let’s Connect." : "Logo removed from both places. The header now shows VN.");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn't save your logo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-3xl text-bone/90">Logo</h1>
      <p className="mb-8 text-sm text-bone/60">
        Upload once to update your logo in the website header and beside Let’s Connect at the bottom.
        Near-white backgrounds are removed automatically so the logo blends into the site. PNG, JPEG, WebP or GIF, up to 4 MB.
      </p>
      <div className="mb-6 flex h-40 w-56 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-black/30">
        {loading ? <span className="text-sm text-bone/60">Loading…</span> : logoImage ? (
          <Image src={logoImage} alt="Current photography logo" width={160} height={160} className="logo-blend h-full w-full object-contain" />
        ) : <span className="font-display text-4xl text-bone/90">VN</span>}
      </div>
      <label htmlFor="logo-file" className="mb-2 block text-sm text-bone/80">{logoImage ? "Replace logo" : "Upload logo"}</label>
      <input id="logo-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={loading || busy}
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void save(file);
        }}
        className="block w-full text-sm text-bone/70 file:mr-4 file:rounded-full file:border-0 file:bg-accent/90 file:px-4 file:py-2 file:text-ink disabled:opacity-50" />
      {logoImage && <button type="button" disabled={busy || loading} onClick={() => void save()}
        className="mt-4 text-sm text-bone/70 hover:text-red-400 disabled:opacity-50">Remove logo</button>}
      <p role="status" className="mt-4 text-sm text-emerald-400">{busy ? "Saving…" : message}</p>
      {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
