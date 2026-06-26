import { NextResponse } from "next/server";
import { getPhotos } from "@/lib/photos";

export const dynamic = "force-dynamic";

// Public, read-only endpoint — anyone can view the gallery, nobody can
// write to it without an authenticated admin session (enforced in
// /api/admin/* and by middleware.ts).
export async function GET() {
  const photos = await getPhotos();
  return NextResponse.json({ photos });
}
