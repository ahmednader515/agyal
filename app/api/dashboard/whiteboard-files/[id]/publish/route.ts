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
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 غير مضبوط" }, { status: 503 });
  }

  const form = await request.formData();
  const snapshotRaw = form.get("snapshot");
  const imageFile = form.get("image");

  if (typeof snapshotRaw !== "string" || !snapshotRaw.trim()) {
    return NextResponse.json({ error: "لقطة السبورة مطلوبة" }, { status: 400 });
  }

  try {
    const snapshotBuffer = Buffer.from(snapshotRaw, "utf-8");
    const jsonKey = `whiteboard-files/${id}/published.json`;
    const { url: snapshotJsonUrl } = await uploadToR2(snapshotBuffer, jsonKey, "application/json");

    let imageUrl: string | null = null;
    let pdfUrl: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      const buf = Buffer.from(await imageFile.arrayBuffer());
      const ext = imageFile.type.includes("svg") ? "svg" : "png";
      const mime = ext === "svg" ? "image/svg+xml" : "image/png";
      const imgKey = `whiteboard-files/${id}/published.${ext}`;
      const uploaded = await uploadToR2(buf, imgKey, mime);
      imageUrl = uploaded.url;
      pdfUrl = uploaded.url;
    }

    await updateWhiteboardFile(id, {
      snapshot_json_url: snapshotJsonUrl,
      image_url: imageUrl,
      pdf_url: pdfUrl,
      status: "published",
      published_at: new Date(),
      is_active: true,
    });

    const updated = await getWhiteboardFileById(id);
    return NextResponse.json({ success: true, file: updated });
  } catch (e) {
    console.error("whiteboard publish", e);
    const message = e instanceof Error && /Unauthorized/i.test(e.message)
      ? "فشل رفع الملف إلى R2: مفتاح R2 غير مصرح له بالكتابة على هذا البكت"
      : "فشل النشر";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
