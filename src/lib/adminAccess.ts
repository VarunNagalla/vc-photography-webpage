import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

// Called inside every admin API handler, independently of middleware.
export async function authorizeAdmin(req: Request): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.headers.get("origin") !== new URL(req.url).origin ||
        req.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }
  }
  return null;
}
