import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { authorizeAdmin } from "@/lib/adminAccess";
import { getSettings, setLogoImage } from "@/lib/settings";
import { sniffImage } from "@/lib/fileValidation";

export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const denied = await authorizeAdmin(req);
  if (denied) return denied;
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const denied = await authorizeAdmin(req);
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB limit` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImage(buffer);
  if (!sniffed.valid || !sniffed.ext) {
    return NextResponse.json({ error: "File is not a valid image" }, { status: 400 });
  }

  // Keep the previous image until both upload and metadata save succeed.
  const previous = await getSettings();

  const filename = `${randomUUID()}.${sniffed.ext}`;
  const blob = await put(`logos/${filename}`, buffer, {
    access: "public",
    contentType: sniffed.mime!,
    addRandomSuffix: true,
  });

  const settings = await setLogoImage(blob.url);
  if (previous.logoImage?.startsWith("https://")) {
    await del(previous.logoImage).catch(() => undefined);
  }
  return NextResponse.json({ settings });
}

export async function DELETE(req: NextRequest) {
  const denied = await authorizeAdmin(req);
  if (denied) return denied;

  const previous = await getSettings();
  const settings = await setLogoImage("");
  if (previous.logoImage?.startsWith("https://")) {
    await del(previous.logoImage).catch(() => undefined);
  }
  return NextResponse.json({ settings });
}

