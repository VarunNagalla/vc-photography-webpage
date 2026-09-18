import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { authorizeAdmin } from "@/lib/adminAccess";
import { getSettings, setLogoImage } from "@/lib/settings";
import { sniffImage } from "@/lib/fileValidation";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
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

  // Logos are commonly supplied on a solid white or black card. Estimate the
  // card color from the four corners, then make matching pixels transparent.
  const raw = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const corners: number[][] = [];
  const points = [[0, 0], [raw.info.width - 1, 0], [0, raw.info.height - 1], [raw.info.width - 1, raw.info.height - 1]];
  for (const [x, y] of points) {
    const i = (y * raw.info.width + x) * 4;
    corners.push([raw.data[i], raw.data[i + 1], raw.data[i + 2]]);
  }
  const background = corners[0].map((_, channel) => corners.reduce((sum, color) => sum + color[channel], 0) / corners.length);
  for (let i = 0; i < raw.data.length; i += 4) {
    const distance = Math.hypot(raw.data[i] - background[0], raw.data[i + 1] - background[1], raw.data[i + 2] - background[2]);
    raw.data[i + 3] = distance < 30 ? 0 : distance < 90 ? Math.round((distance - 30) * 4.25) : 255;
  }
  const transparentLogo = await sharp(raw.data, {
    raw: { width: raw.info.width, height: raw.info.height, channels: 4 },
  }).png().toBuffer();

  const filename = `${randomUUID()}.png`;
  const blob = await put(`logos/${filename}`, transparentLogo, {
    access: "public",
    contentType: "image/png",
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

