import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CreateCourseForm } from "./CreateCourseForm";

export default async function NewCoursePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();
  const teacherProfile =
    role === "TEACHER" ? await getUserById(session.user.id) : null;

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        {t("dashboard.backToDashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.courseNewPage.title")}
      </h2>
      <CreateCourseForm
        role={role}
        teacherCountry={teacherProfile?.country ?? null}
        teacherLearningTrack={teacherProfile?.learning_track ?? null}
      />
    </div>
  );
}
