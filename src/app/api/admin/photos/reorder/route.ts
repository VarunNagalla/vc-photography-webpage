import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/adminAccess";
import { reorderPhotos } from "@/lib/photos";

const schema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(10000)
    .refine(ids => new Set(ids).size === ids.length, "Duplicate photo IDs"),
});

export async function POST(req: NextRequest) {
  const denied = await authorizeAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const photos = await reorderPhotos(parsed.data.orderedIds);
  return NextResponse.json({ photos });
}
