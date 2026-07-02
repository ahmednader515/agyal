import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getWhiteboardFileById,
  getWhiteboardFileCodeByCode,
  getWhiteboardLibraryFeatureEnabled,
  userHasWhiteboardFileAccess,
  useWhiteboardFileCode,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "يجب تسجيل الدخول كطالب" }, { status: 403 });
  }

  const enabled = await getWhiteboardLibraryFeatureEnabled();
  if (!enabled) {
    return NextResponse.json({ error: "الميزة غير مفعّلة" }, { status: 404 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "كود التفعيل مطلوب" }, { status: 400 });
  }

  const row = await getWhiteboardFileCodeByCode(code);
  if (!row) {
    return NextResponse.json({ error: "كود غير صالح أو مستخدم مسبقاً" }, { status: 404 });
  }

  const file = await getWhiteboardFileById(row.whiteboardFileId);
  if (!file || file.status !== "published" || !file.isActive) {
    return NextResponse.json({ error: "ملف السبورة غير متاح" }, { status: 400 });
  }

  const already = await userHasWhiteboardFileAccess(session.user.id, row.whiteboardFileId);
  if (already) {
    return NextResponse.json({ error: "لديك وصول لهذا الملف بالفعل" }, { status: 400 });
  }

  const result = await useWhiteboardFileCode(row.id, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "كود غير صالح أو مستخدم مسبقاً" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "تم تفعيل الكود — يمكنك الآن عرض وتحميل السبورة",
    whiteboardFileId: result.whiteboardFileId,
    fileTitle: row.fileTitle ?? file.title,
  });
}
