import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import path from "path";
import { promises as fs } from "fs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { deletePhoto, updatePhoto, getPhotos } from "@/lib/photos";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "photos");

const patchSchema = z.object({
  caption: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const updated = await updatePhoto(params.id, { caption: sanitizedCaption });
  if (!updated) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  return NextResponse.json({ photo: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photos = await getPhotos();
  const exists = photos.some((p) => p.id === params.id);
  if (!exists) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const removed = await deletePhoto(params.id);
  if (removed) {
    const filePath = path.join(UPLOAD_DIR, removed.filename);
    await fs.unlink(filePath).catch(() => undefined);
  }

  return NextResponse.json({ success: true });
}
