import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getWhiteboardFileById } from "@/lib/db";
import { getServerTranslator, getLocaleFromCookie } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { StandaloneWhiteboardEditor } from "@/components/whiteboard-files/StandaloneWhiteboardEditor";
import { StandaloneWhiteboardViewer } from "@/components/whiteboard-files/StandaloneWhiteboardViewer";

type Props = { params: Promise<{ id: string }> };

export default async function WhiteboardFileEditPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const [file, t, locale] = await Promise.all([
    getWhiteboardFileById(id),
    getServerTranslator(),
    getLocaleFromCookie(),
  ]);

  if (!file) notFound();

  const title = pickLocalizedText(locale, file.titleAr, file.title);
  const isPublished = file.status === "published";

  return (
    <div>
      <Link href="/dashboard/whiteboard-files" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("dashboard.whiteboardFiles.backToList", "← Whiteboard library")}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">{title}</h2>
      <div className="mt-6">
        {isPublished ? (
          <StandaloneWhiteboardViewer fileId={file.id} />
        ) : (
          <StandaloneWhiteboardEditor
            fileId={file.id}
            fileTitle={title}
            initialSnapshotUrl={file.snapshotJsonUrl}
            isPublished={false}
          />
        )}
      </div>
    </div>
  );
}
