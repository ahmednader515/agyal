import type { WhiteboardFileRow } from "@/lib/db";

export function canDownloadWhiteboardFile(
  role: string | undefined,
  file: WhiteboardFileRow,
  hasStudentAccess: boolean,
): boolean {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") return true;
  if (file.status !== "published") return false;
  if (role === "STUDENT") return hasStudentAccess;
  return false;
}

export function pickWhiteboardDownloadUrl(
  file: WhiteboardFileRow,
  format: "pdf" | "image" | "json",
): string | null {
  if (format === "json") return file.snapshotJsonUrl;
  if (format === "image") return file.imageUrl ?? file.pdfUrl;
  return file.pdfUrl ?? file.imageUrl;
}
