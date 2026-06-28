import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCourseById, getLiveStreamById, updateLiveStreamWhiteboardSnapshot } from "@/lib/db";
import { getLiveStreamWhiteboardAccess } from "@/lib/live-stream-access";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const stream = await getLiveStreamById(id);
  if (!stream) {
    return NextResponse.json({ error: "البث غير موجود" }, { status: 404 });
  }

  const courseId =
    (stream as { courseId?: string }).courseId ??
    stream.course_id;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });
  }

  const createdBy =
    (course as { createdById?: string | null; created_by_id?: string | null }).createdById ??
    (course as { created_by_id?: string | null }).created_by_id ??
    null;

  const access = await getLiveStreamWhiteboardAccess(session.user, stream, createdBy);
  if (!access.allowed || access.mode !== "editor") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
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
  const key = `whiteboard-snapshots/${id}.json`;

  try {
    const { url } = await uploadToR2(buffer, key, "application/json");
    if (url) {
      await updateLiveStreamWhiteboardSnapshot(id, url);
    }
    return NextResponse.json({ ok: true, url: url ?? null, key });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل حفظ اللقطة" }, { status: 500 });
  }
}
