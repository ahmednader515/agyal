import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import {
  getWhiteboardLibraryFeatureEnabled,
  listWhiteboardFilesAll,
  listWhiteboardFileIdsForUser,
  listWhiteboardFilesPublished,
} from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { WhiteboardFilesAdminClient } from "./WhiteboardFilesAdminClient";
import { WhiteboardFilesStudentClient } from "@/components/whiteboard-files/WhiteboardFilesStudentClient";

export default async function WhiteboardFilesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const enabled = await getWhiteboardLibraryFeatureEnabled();

  const t = await getServerTranslator();
  const isAdmin = session.user.role === "ADMIN";
  const isStudent = session.user.role === "STUDENT";

  if (!isAdmin && !isStudent) {
    redirect("/dashboard");
  }

  // Students can only reach the catalog when the feature is enabled.
  // Admins can always reach the page so they can enable/manage it.
  if (isStudent && !enabled) {
    redirect("/dashboard");
  }

  if (isAdmin) {
    const files = await listWhiteboardFilesAll();
    return (
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          {t("dashboard.backToDashboard")}
        </Link>
        <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">
          {t("dashboard.whiteboardFiles.pageTitle", "Whiteboard library")}
        </h2>
        <div className="mt-6">
          <WhiteboardFilesAdminClient initialEnabled={enabled} initialFiles={files} />
        </div>
      </div>
    );
  }

  const [files, accessIds] = await Promise.all([
    listWhiteboardFilesPublished(),
    listWhiteboardFileIdsForUser(session.user.id),
  ]);

  const studentFiles = files.map((f) => ({
    id: f.id,
    title: f.title,
    titleAr: f.titleAr,
    description: f.description,
    descriptionEn: f.descriptionEn,
    publishedAt: f.publishedAt,
    hasAccess: accessIds.has(f.id),
  }));

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.whiteboardFiles.studentPageTitle", "Whiteboard library")}
      </h2>
      <div className="mt-6">
        <WhiteboardFilesStudentClient initialFiles={studentFiles} />
      </div>
    </div>
  );
}
