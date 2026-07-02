import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getWhiteboardFileById,
  getWhiteboardLibraryFeatureEnabled,
  userHasWhiteboardFileAccess,
} from "@/lib/db";
import { canDownloadWhiteboardFile, pickWhiteboardDownloadUrl } from "@/lib/whiteboard-file-access";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const enabled = await getWhiteboardLibraryFeatureEnabled();
  if (!enabled) {
    return NextResponse.json({ error: "الميزة غير مفعّلة" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 403 });
  }

  const { id } = await params;
  const file = await getWhiteboardFileById(id);
  if (!file || file.status !== "published" || !file.isActive) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const hasAccess =
    session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN"
      ? true
      : session.user.role === "STUDENT"
        ? await userHasWhiteboardFileAccess(session.user.id, id)
        : false;

  const format = (request.nextUrl.searchParams.get("format") ?? "image") as "pdf" | "image" | "json";
  if (!canDownloadWhiteboardFile(session.user.role, file, hasAccess)) {
    return NextResponse.json({ error: "غير مصرح — فعّل كود الشراء أولاً" }, { status: 403 });
  }

  const url = pickWhiteboardDownloadUrl(file, format);
  if (!url) {
    return NextResponse.json({ error: "الملف غير متوفر" }, { status: 404 });
  }
  return NextResponse.redirect(url);
}
