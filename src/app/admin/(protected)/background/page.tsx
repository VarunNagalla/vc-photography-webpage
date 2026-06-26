"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminBackgroundPage() {
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/background")
      .then((r) => r.json())
      .then((data) => setBackgroundImage(data.settings.backgroundImage));
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/background", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setBackgroundImage(data.settings.backgroundImage);
      setMessage("Background updated.");
    } else {
      setError(data.error || "Upload failed.");
    }
  }

  async function handleReset() {
    if (!confirm("Reset to the default animated background?")) return;
    const res = await fetch("/api/admin/background", { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setBackgroundImage(data.settings.backgroundImage);
      setMessage("Background reset to default.");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-3xl text-bone/90">Background Image</h1>
      <p className="mb-8 text-sm text-bone/50">
        This image appears behind the 3D animation on every page. Leave it unset to use the default animated backdrop.
      </p>

      <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black/30">
        {backgroundImage ? (
          <div className="relative h-full w-full">
            <Image src={backgroundImage} alt="Current background" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-bone/40">
            Using default animated backdrop
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
        className="block w-full text-sm text-bone/70 file:mr-4 file:rounded-full file:border-0 file:bg-accent/90 file:px-4 file:py-2 file:text-ink file:uppercase file:tracking-wide hover:file:bg-accent"
      />

      {backgroundImage && (
        <button
          onClick={handleReset}
          className="mt-4 text-xs uppercase tracking-wide text-bone/50 hover:text-red-400"
        >
          Reset to default
        </button>
      )}

      {uploading && <p className="mt-4 text-sm text-bone/50">Uploading…</p>}
      {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
