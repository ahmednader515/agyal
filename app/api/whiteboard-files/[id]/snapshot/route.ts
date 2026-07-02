import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getWhiteboardFileById,
  getWhiteboardLibraryFeatureEnabled,
  userHasWhiteboardFileAccess,
} from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** Snapshot JSON for in-app viewer (students with access only). */
export async function GET(_request: NextRequest, { params }: Params) {
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

  const isStaff = session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN";
  const hasAccess =
    isStaff ||
    (session.user.role === "STUDENT" && (await userHasWhiteboardFileAccess(session.user.id, id)));

  if (!hasAccess) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (!file.snapshotJsonUrl) {
    return NextResponse.json({ error: "لا توجد لقطة محفوظة" }, { status: 404 });
  }

  try {
    const res = await fetch(file.snapshotJsonUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "تعذر تحميل اللقطة" }, { status: 502 });
    }
    const snapshot = await res.json();
    return NextResponse.json({ file: { id: file.id, title: file.title, titleAr: file.titleAr }, snapshot });
  } catch (e) {
    console.error("whiteboard snapshot proxy", e);
    return NextResponse.json({ error: "تعذر تحميل اللقطة" }, { status: 502 });
  }
}
