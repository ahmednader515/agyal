import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhiteboardFileById, updateWhiteboardFile } from "@/lib/db";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const file = await getWhiteboardFileById(id);
  if (!file) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  if (file.status === "published") {
    return NextResponse.json({ error: "لا يمكن تعديل مسودة منشورة — أنشئ نسخة جديدة" }, { status: 400 });
  }
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 غير مضبوط" }, { status: 503 });
  }

  let body: { snapshot?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (!body.snapshot) {
    return NextResponse.json({ error: "اللقطة مطلوبة" }, { status: 400 });
  }

  const json = JSON.stringify(body.snapshot);
  const buffer = Buffer.from(json, "utf-8");
  const key = `whiteboard-files/${id}/draft.json`;
  try {
    const { url } = await uploadToR2(buffer, key, "application/json");
    await updateWhiteboardFile(id, { snapshot_json_url: url });
    return NextResponse.json({ success: true, snapshotJsonUrl: url });
  } catch (e) {
    console.error("whiteboard draft save", e);
    const message = e instanceof Error && /Unauthorized/i.test(e.message)
      ? "فشل رفع الملف إلى R2: مفتاح R2 غير مصرح له بالكتابة على هذا البكت"
      : "فشل حفظ المسودة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
