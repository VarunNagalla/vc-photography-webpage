import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { del } from "@vercel/blob";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { deletePhoto, updatePhoto, getPhotos } from "@/lib/photos";

const patchSchema = z.object({
  caption: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sanitizedCaption =
    parsed.data.caption !== undefined
      ? parsed.data.caption.replace(/[\x00-\x1F\x7F]/g, "").trim()
      : undefined;

  const updated = await updatePhoto(id, { caption: sanitizedCaption });
  if (!updated) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  return NextResponse.json({ photo: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photos = await getPhotos();
  const exists = photos.some((p) => p.id === id);
  if (!exists) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const removed = await deletePhoto(id);
  // removed.url is the full Vercel Blob URL — del() accepts that directly.
  // It's a no-op (not an error) if the blob is already gone, and free of
  // charge, so no need to guard this beyond the usual catch-and-ignore.
  if (removed) {
    await del(removed.url).catch(() => undefined);
  }

  return NextResponse.json({ success: true });
}
