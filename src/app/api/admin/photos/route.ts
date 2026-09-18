import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { authorizeAdmin } from "@/lib/adminAccess";
import { addPhoto, getPhotos } from "@/lib/photos";
import { sniffImage, isWithinSizeLimit, MAX_FILE_BYTES } from "@/lib/fileValidation";

export const dynamic = "force-dynamic";

const MAX_CAPTION_LENGTH = 500;

function sanitizeCaption(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, MAX_CAPTION_LENGTH);
}

export async function GET(req: NextRequest) {
  const denied = await authorizeAdmin(req);
  if (denied) return denied;
  const photos = await getPhotos();
  return NextResponse.json({ photos });
}

// Accepts one or many photos in a single request. There is no cap on how
// many files can be uploaded — each file is validated independently by
// real file content (magic bytes), not by extension or declared MIME type.
//
// Files are stored in Vercel Blob rather than on local disk: Vercel's
// serverless Functions have a read-only filesystem at runtime, so a plain
// fs.writeFile here would either throw or silently disappear on the next
// cold start. addRandomSuffix avoids collisions instead of throwing on an
// existing pathname (randomUUID() filenames make collisions astronomically
// unlikely anyway, but the random suffix is free insurance).
export async function POST(req: NextRequest) {
  const denied = await authorizeAdmin(req);
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  const captionsRaw = formData.getAll("captions").map((c) => (typeof c === "string" ? c : ""));

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const created = [];
  const rejected: { name: string; reason: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const caption = sanitizeCaption(captionsRaw[i] ?? "");

    if (!isWithinSizeLimit(file.size)) {
      rejected.push({ name: file.name, reason: `File exceeds ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB limit` });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImage(buffer);

    if (!sniffed.valid || !sniffed.ext) {
      rejected.push({ name: file.name, reason: "File is not a valid image" });
      continue;
    }

    const filename = `${randomUUID()}.${sniffed.ext}`;
    const blob = await put(`photos/${filename}`, buffer, {
      access: "public",
      contentType: sniffed.mime!,
      addRandomSuffix: true,
    });

    const photo = await addPhoto({
      id: randomUUID(),
      filename: blob.pathname,
      url: blob.url,
      caption,
      createdAt: new Date().toISOString(),
    });
    created.push(photo);
  }

  return NextResponse.json({ created, rejected }, { status: created.length > 0 ? 201 : 400 });
}
