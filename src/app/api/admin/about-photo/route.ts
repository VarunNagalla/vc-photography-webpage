import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { put, del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { getSettings, setAboutImage } from "@/lib/settings";
import { sniffImage, isWithinSizeLimit, MAX_FILE_BYTES } from "@/lib/fileValidation";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Clean up the previously uploaded about photo (if any) before saving
  // the new one, so unused blobs don't accumulate and rack up storage.
  const previous = await getSettings();
  if (previous.aboutImage?.startsWith("https://")) {
    await del(previous.aboutImage).catch(() => undefined);
  }

  const filename = `${uuidv4()}.${sniffed.ext}`;
  const blob = await put(`about/${filename}`, buffer, {
    access: "public",
    addRandomSuffix: true,
  });

  const settings = await setAboutImage(blob.url);
  return NextResponse.json({ settings });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const previous = await getSettings();
  if (previous.aboutImage?.startsWith("https://")) {
    await del(previous.aboutImage).catch(() => undefined);
  }
  const settings = await setAboutImage("");
  return NextResponse.json({ settings });
}
