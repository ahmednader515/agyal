import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getWhiteboardLibraryFeatureEnabled,
  listWhiteboardFileIdsForUser,
  listWhiteboardFilesPublished,
} from "@/lib/db";

export async function GET() {
  const enabled = await getWhiteboardLibraryFeatureEnabled();
  if (!enabled) {
    return NextResponse.json({ error: "الميزة غير مفعّلة" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const files = await listWhiteboardFilesPublished();
  let accessIds = new Set<string>();
  if (session?.user?.role === "STUDENT") {
    accessIds = await listWhiteboardFileIdsForUser(session.user.id);
  }

  return NextResponse.json({
    files: files.map((f) => ({
      id: f.id,
      title: f.title,
      titleAr: f.titleAr,
      description: f.description,
      descriptionEn: f.descriptionEn,
      publishedAt: f.publishedAt,
      hasAccess: accessIds.has(f.id),
    })),
  });
}
