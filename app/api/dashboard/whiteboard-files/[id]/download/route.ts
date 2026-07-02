import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhiteboardFileById } from "@/lib/db";
import { canDownloadWhiteboardFile, pickWhiteboardDownloadUrl } from "@/lib/whiteboard-file-access";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const file = await getWhiteboardFileById(id);
  if (!file) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const format = (request.nextUrl.searchParams.get("format") ?? "image") as "pdf" | "image" | "json";
  const allowed = canDownloadWhiteboardFile(session.user.role, file, true);
  if (!allowed) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const url = pickWhiteboardDownloadUrl(file, format);
  if (!url) {
    return NextResponse.json({ error: "الملف غير متوفر" }, { status: 404 });
  }
  return NextResponse.redirect(url);
}
