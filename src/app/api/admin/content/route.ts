import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getContent, updateContent } from "@/lib/content";

export const dynamic = "force-dynamic";

const contentSchema = z.object({
  hero: z.object({
    title: z.string().min(1).max(120),
    subtitle: z.string().max(240),
  }),
  about: z.object({
    heading: z.string().min(1).max(120),
    body: z.string().max(4000),
  }),
  contact: z.object({
    email: z.string().email().or(z.literal("")),
    phone: z.string().max(40),
    instagram: z.string().max(120),
    location: z.string().max(160),
  }),
});

function stripControlChars<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/[\x00-\x1F\x7F]/g, "") as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(stripControlChars) as unknown as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripControlChars(v)])
    ) as unknown as T;
  }
  return value;
}

export async function GET() {
  // Public: the site needs this to render hero/about/contact text.
  const content = await getContent();
  return NextResponse.json({ content });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content", details: parsed.error.flatten() }, { status: 400 });
  }

  const sanitized = stripControlChars(parsed.data);
  const updated = await updateContent(sanitized);
  return NextResponse.json({ content: updated });
}
