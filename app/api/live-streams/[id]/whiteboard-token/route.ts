import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCourseById, getLiveStreamById } from "@/lib/db";
import { getLiveStreamWhiteboardAccess } from "@/lib/live-stream-access";
import { getTldrawSyncUrl, signWhiteboardToken } from "@/lib/tldraw/whiteboard-token";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const syncUrl = getTldrawSyncUrl();
  if (!syncUrl) {
    return NextResponse.json({ error: "خادم السبورة غير مضبوط" }, { status: 503 });
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
  if (!access.allowed) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const token = await signWhiteboardToken({
    streamId: id,
    userId: session.user.id,
    mode: access.mode,
  });
  if (!token) {
    return NextResponse.json({ error: "إعدادات السبورة غير مكتملة" }, { status: 503 });
  }

  const row = stream as unknown as Record<string, unknown>;
  return NextResponse.json({
    token,
    syncUrl,
    mode: access.mode,
    stream: {
      id,
      title: String(row.title ?? ""),
      titleAr: String(row.title_ar ?? row.titleAr ?? ""),
      meetingUrl: String(row.meeting_url ?? row.meetingUrl ?? ""),
      meetingPassword:
        access.mode === "editor"
          ? String(row.meeting_password ?? row.meetingPassword ?? "")
          : "",
      provider: row.provider === "google_meet" ? "google_meet" : "zoom",
      scheduledAt: row.scheduled_at ?? row.scheduledAt,
    },
  });
}
