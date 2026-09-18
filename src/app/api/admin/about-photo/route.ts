import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { authorizeAdmin } from "@/lib/adminAccess";
import { getSettings, setAboutImage } from "@/lib/settings";
import { sniffImage, isWithinSizeLimit, MAX_FILE_BYTES } from "@/lib/fileValidation";

export const dynamic = "force-dynamic";

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

  if (!isWithinSizeLimit(file.size)) {
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
  const blob = await put(`about/${filename}`, buffer, {
    access: "public",
    contentType: sniffed.mime!,
    addRandomSuffix: true,
  });

  const settings = await setAboutImage(blob.url);
  if (previous.aboutImage?.startsWith("https://")) {
    await del(previous.aboutImage).catch(() => undefined);
  }
  return NextResponse.json({ settings });
}

export async function DELETE(req: NextRequest) {
  const denied = await authorizeAdmin(req);
  if (denied) return denied;

  const previous = await getSettings();
  const settings = await setAboutImage("");
  if (previous.aboutImage?.startsWith("https://")) {
    await del(previous.aboutImage).catch(() => undefined);
  }
  return NextResponse.json({ settings });
}
