"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Photo {
  id: string;
  url: string;
  caption: string;
  order: number;
  createdAt: string;
}

interface PendingFile {
  file: File;
  caption: string;
  previewUrl: string;
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/photos");
    if (res.ok) {
      const data = await res.json();
      setPhotos(data.photos);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // No limit is applied here on purpose — you can select and queue as
  // many photos as you want in one go.
  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const newPending: PendingFile[] = Array.from(fileList).map((file) => ({
      file,
      caption: "",
      previewUrl: URL.createObjectURL(file),
    }));
    setPending((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updatePendingCaption(index: number, caption: string) {
    setPending((prev) => prev.map((p, i) => (i === index ? { ...p, caption } : p)));
  }

  function removePending(index: number) {
    setPending((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleUploadAll() {
    if (pending.length === 0) return;
    setUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    pending.forEach((p) => {
      formData.append("files", p.file);
      formData.append("captions", p.caption);
    });

    try {
      const res = await fetch("/api/admin/photos", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok && (!data.created || data.created.length === 0)) {
        setError(data.error || "Upload failed.");
      } else {
        const count = data.created?.length ?? 0;
        const rejectedCount = data.rejected?.length ?? 0;
        setMessage(
          `Uploaded ${count} photo${count === 1 ? "" : "s"}.` +
            (rejectedCount > 0 ? ` ${rejectedCount} file(s) were rejected (invalid image or too large).` : "")
        );
        pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPending([]);
        await loadPhotos();
      }
    } catch {
      setError("Network error while uploading.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCaptionSave(id: string, caption: string) {
    await fetch(`/api/admin/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this photo permanently?")) return;
    await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function moveOrder(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= photos.length) return;
    const updated = [...photos];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setPhotos(updated);
    await fetch("/api/admin/photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: updated.map((p) => p.id) }),
    });
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-bone/90">Photos</h1>
      <p className="mb-8 text-sm text-bone/50">
        Upload as many photographs as you like, in one batch or many. Add a caption to each before publishing.
      </p>

      <section className="mb-12 rounded-lg border border-dashed border-white/20 bg-white/5 p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="block w-full text-sm text-bone/70 file:mr-4 file:rounded-full file:border-0 file:bg-accent/90 file:px-4 file:py-2 file:text-ink file:uppercase file:tracking-wide hover:file:bg-accent"
        />

        {pending.length > 0 && (
          <div className="mt-6 space-y-4">
            {pending.map((p, i) => (
              <div key={i} className="flex items-center gap-4 rounded border border-white/10 bg-black/20 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
                  <Image src={p.previewUrl} alt="" fill className="object-cover" unoptimized />
                </div>
                <input
                  type="text"
                  placeholder="Add a caption…"
                  value={p.caption}
                  onChange={(e) => updatePendingCaption(i, e.target.value)}
                  maxLength={500}
                  className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-1.5 text-sm text-bone outline-none focus:border-accent"
                />
                <button
                  onClick={() => removePending(i)}
                  className="text-xs uppercase tracking-wide text-bone/50 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={handleUploadAll}
              disabled={uploading}
              className="rounded-full bg-accent/90 px-6 py-2.5 text-sm uppercase tracking-[0.15em] text-ink transition hover:bg-accent disabled:opacity-50"
            >
              {uploading ? "Uploading…" : `Upload ${pending.length} photo${pending.length === 1 ? "" : "s"}`}
            </button>
          </div>
        )}

        {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </section>

      <h2 className="mb-4 font-display text-xl text-bone/90">Published ({photos.length})</h2>
      {loading ? (
        <p className="text-sm text-bone/50">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-bone/50">No photos published yet.</p>
      ) : (
        <div className="space-y-3">
          {photos.map((photo, i) => (
            <div key={photo.id} className="flex items-center gap-4 rounded border border-white/10 bg-white/5 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
                <Image src={photo.url} alt={photo.caption} fill className="object-cover" />
              </div>
              <input
                type="text"
                defaultValue={photo.caption}
                maxLength={500}
                onBlur={(e) => handleCaptionSave(photo.id, e.target.value)}
                placeholder="Add a caption…"
                className="flex-1 rounded border border-white/15 bg-black/30 px-3 py-1.5 text-sm text-bone outline-none focus:border-accent"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveOrder(i, -1)}
                  disabled={i === 0}
                  className="rounded px-2 py-1 text-bone/50 hover:text-accent disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveOrder(i, 1)}
                  disabled={i === photos.length - 1}
                  className="rounded px-2 py-1 text-bone/50 hover:text-accent disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
              <button
                onClick={() => handleDelete(photo.id)}
                className="text-xs uppercase tracking-wide text-bone/50 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
