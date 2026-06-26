import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { promises as fs } from "fs";
import { authOptions } from "@/lib/auth";
import { getSettings, setBackgroundImage } from "@/lib/settings";
import { sniffImage, isWithinSizeLimit, MAX_FILE_BYTES } from "@/lib/fileValidation";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "backgrounds");

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

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Clean up the previously uploaded background (if any) before saving
  // the new one, so unused images don't accumulate on disk forever.
  const previous = await getSettings();
  if (previous.backgroundImage.startsWith("/uploads/backgrounds/")) {
    const previousPath = path.join(process.cwd(), "public", previous.backgroundImage);
    await fs.unlink(previousPath).catch(() => undefined);
  }

  const filename = `${uuidv4()}.${sniffed.ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const url = `/uploads/backgrounds/${filename}`;
  const settings = await setBackgroundImage(url);
  return NextResponse.json({ settings });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const previous = await getSettings();
  if (previous.backgroundImage.startsWith("/uploads/backgrounds/")) {
    const previousPath = path.join(process.cwd(), "public", previous.backgroundImage);
    await fs.unlink(previousPath).catch(() => undefined);
  }
  const settings = await setBackgroundImage("");
  return NextResponse.json({ settings });
}
