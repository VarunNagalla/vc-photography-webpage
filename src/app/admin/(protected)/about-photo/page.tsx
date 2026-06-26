"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function AdminAboutPhotoPage() {
  const [aboutImage, setAboutImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/about-photo")
      .then((r) => r.json())
      .then((data) => setAboutImage(data.settings.aboutImage));
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/about-photo", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setAboutImage(data.settings.aboutImage);
      setMessage("About photo updated.");
    } else {
      setError(data.error || "Upload failed.");
    }
  }

  async function handleReset() {
    if (!confirm("Remove the photo from the About page?")) return;
    const res = await fetch("/api/admin/about-photo", { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setAboutImage(data.settings.aboutImage);
      setMessage("Photo removed.");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-3xl text-bone/90">About Photo</h1>
      <p className="mb-8 text-sm text-bone/50">
        This photo appears next to your bio on the About page. Leave it unset to show text only.
      </p>

      <div className="mb-6 aspect-square w-64 overflow-hidden rounded-lg border border-white/10 bg-black/30">
        {aboutImage ? (
          <div className="relative h-full w-full">
            <Image src={aboutImage} alt="About page photo" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-bone/40">
            No photo set
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

      {aboutImage && (
        <button
          onClick={handleReset}
          className="mt-4 text-xs uppercase tracking-wide text-bone/50 hover:text-red-400"
        >
          Remove photo
        </button>
      )}

      {uploading && <p className="mt-4 text-sm text-bone/50">Uploading…</p>}
      {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
