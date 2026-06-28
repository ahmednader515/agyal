import { notFound, redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCourseById, getCourseWithContent, getLiveStreamById } from "@/lib/db";
import { getLiveStreamWhiteboardAccess, isWhiteboardEnabled } from "@/lib/live-stream-access";
import { LiveStreamRoom } from "@/components/live-stream/LiveStreamRoom";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

type Props = { params: Promise<{ slug: string; streamId: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

function decodeSlug(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function courseHref(course: { slug?: string | null; id: string }): string {
  const segment =
    course.slug && course.slug.trim()
      ? encodeURIComponent(course.slug.trim())
      : course.id;
  return `/courses/${segment}`;
}

export default async function LiveStreamPage({ params }: Props) {
  unstable_noStore();
  const session = await getServerSession(authOptions);
  const { slug: slugSegment, streamId } = await params;

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/courses/${slugSegment}/live/${streamId}`)}`);
  }

  const stream = await getLiveStreamById(streamId);
  if (!stream || !isWhiteboardEnabled(stream)) {
    notFound();
  }

  const decodedSlug = decodeSlug(slugSegment);
  const data = await getCourseWithContent(decodedSlug);
  if (!data?.course) notFound();

  const streamCourseId =
    (stream as { courseId?: string }).courseId ?? stream.course_id;
  if (streamCourseId !== data.course.id) {
    notFound();
  }

  const course = await getCourseById(data.course.id);
  const createdBy =
    (course as { createdById?: string | null; created_by_id?: string | null } | null)?.createdById ??
    (course as { created_by_id?: string | null } | null)?.created_by_id ??
    null;

  const access = await getLiveStreamWhiteboardAccess(session.user, stream, createdBy);
  if (!access.allowed) {
    redirect(courseHref(data.course));
  }

  const locale = await getLocaleFromCookie();
  const t = await getServerTranslator();
  const courseTitle = pickLocalizedText(
    locale,
    (data.course as { titleAr?: string | null }).titleAr ?? null,
    data.course.title ?? null,
  );

  const userName =
    session.user.name?.trim() ||
    session.user.email?.split("@")[0] ||
    t("courses.liveParticipant", "Participant");

  return (
    <LiveStreamRoom
      streamId={streamId}
      courseHref={courseHref(data.course)}
      courseTitle={courseTitle}
      userName={userName}
    />
  );
}
