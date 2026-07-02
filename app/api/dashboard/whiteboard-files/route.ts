import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createWhiteboardFile, listWhiteboardFilesAll } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const files = await listWhiteboardFilesAll();
  return NextResponse.json({ files });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { title?: string; titleAr?: string; description?: string; descriptionEn?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  }
  try {
    const file = await createWhiteboardFile({
      title,
      title_ar: body.titleAr ?? null,
      description: body.description ?? "",
      description_en: body.descriptionEn ?? null,
      created_by_id: session.user.id,
    });
    return NextResponse.json({ success: true, file });
  } catch (e) {
    console.error("POST /api/dashboard/whiteboard-files", e);
    return NextResponse.json({ error: "فشل إنشاء ملف السبورة" }, { status: 500 });
  }
}
