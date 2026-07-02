"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/LocaleProvider";
import { useDashboardTable } from "@/lib/i18n/dashboard-table";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { WhiteboardFileRow } from "@/lib/db";

type CodeRow = {
  id: string;
  code: string;
  usedAt: string | null;
};

export function WhiteboardFilesAdminClient({
  initialEnabled,
  initialFiles,
}: {
  initialEnabled: boolean;
  initialFiles: WhiteboardFileRow[];
}) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const W = "dashboard.whiteboardFiles";
  const { dir, thClass } = useDashboardTable();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [files, setFiles] = useState(initialFiles);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [codesFileId, setCodesFileId] = useState<string | null>(null);
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [codeCount, setCodeCount] = useState(5);
  const [codesLoading, setCodesLoading] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/dashboard/whiteboard-files", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { files?: WhiteboardFileRow[] };
    if (data.files) setFiles(data.files);
  }, []);

  async function patchEnabled(next: boolean) {
    setError("");
    setToggleLoading(true);
    const res = await fetch("/api/dashboard/settings/whiteboard-library-enabled", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    const data = await res.json().catch(() => ({}));
    setToggleLoading(false);
    if (!res.ok) {
      setError(data.error ?? t(`${W}.toggleFailed`, "Update failed"));
      return;
    }
    setEnabled(next);
    setSuccess(next ? t(`${W}.enabledSuccess`, "Library enabled") : t(`${W}.disabledSuccess`, "Library disabled"));
    router.refresh();
  }

  async function createFile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    const res = await fetch("/api/dashboard/whiteboard-files", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), titleAr: titleAr.trim() || null, description }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? t(`${W}.createFailed`, "Create failed"));
      return;
    }
    setTitle("");
    setTitleAr("");
    setDescription("");
    setSuccess(t(`${W}.createSuccess`, "Whiteboard file created"));
    await reload();
    const fileId = (data as { file?: { id?: string } }).file?.id;
    if (fileId) router.push(`/dashboard/whiteboard-files/${fileId}/edit`);
  }

  async function openCodes(fileId: string) {
    setCodesFileId(fileId);
    setCodesLoading(true);
    const res = await fetch(`/api/dashboard/whiteboard-files/${encodeURIComponent(fileId)}/codes`, {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    setCodesLoading(false);
    if (res.ok && Array.isArray(data.codes)) {
      setCodes(
        data.codes.map((c: { id: string; code: string; usedAt?: string | null }) => ({
          id: c.id,
          code: c.code,
          usedAt: c.usedAt ?? null,
        })),
      );
    }
  }

  async function generateCodes() {
    if (!codesFileId) return;
    setCodesLoading(true);
    setError("");
    const res = await fetch(`/api/dashboard/whiteboard-files/${encodeURIComponent(codesFileId)}/codes`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: codeCount }),
    });
    const data = await res.json().catch(() => ({}));
    setCodesLoading(false);
    if (!res.ok) {
      setError(data.error ?? t(`${W}.codesFailed`, "Failed to generate codes"));
      return;
    }
    setSuccess(t(`${W}.codesSuccess`, "Codes generated"));
    await openCodes(codesFileId);
  }

  async function deleteFile(id: string, name: string) {
    if (!confirm(t(`${W}.deleteConfirm`, `Delete "${name}"?`))) return;
    const res = await fetch(`/api/dashboard/whiteboard-files/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t(`${W}.deleteFailed`, "Delete failed"));
      return;
    }
    if (codesFileId === id) setCodesFileId(null);
    await reload();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">{t(`${W}.libraryTitle`, "Whiteboard library")}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t(`${W}.libraryIntro`, "Standalone whiteboard files for all students. Each file requires an activation code.")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={toggleLoading || enabled} onClick={() => void patchEnabled(true)} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {t(`${W}.enableFeature`, "Enable")}
          </button>
          <button type="button" disabled={toggleLoading || !enabled} onClick={() => void patchEnabled(false)} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-50">
            {t(`${W}.disableFeature`, "Disable")}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-[var(--color-primary)]">{success}</p> : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold">{t(`${W}.createTitle`, "New whiteboard file")}</h2>
        <form onSubmit={(e) => void createFile(e)} className="mt-4 grid max-w-xl gap-4">
          <div>
            <label className="block text-sm font-medium">{t(`${W}.labelTitle`, "Title")}</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">{t(`${W}.labelTitleAr`, "Title (Arabic)")}</label>
            <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">{t(`${W}.labelDescription`, "Description")}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          </div>
          <button type="submit" disabled={creating} className="w-fit rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {creating ? t(`${W}.createBusy`, "Creating…") : t(`${W}.createIdle`, "Create & edit")}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t(`${W}.filesList`, "Files")}</h2>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]" dir={dir}>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <tr>
                <th className={`px-4 py-3 ${thClass} font-medium`}>{t(`${W}.colTitle`, "Title")}</th>
                <th className={`px-4 py-3 ${thClass} font-medium`}>{t(`${W}.colStatus`, "Status")}</th>
                <th className={`px-4 py-3 ${thClass} font-medium`}>{t(`${W}.colActions`, "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--color-muted)]">
                    {t(`${W}.empty`, "No whiteboard files yet.")}
                  </td>
                </tr>
              ) : (
                files.map((f) => (
                  <tr key={f.id} className="border-b border-[var(--color-border)]/60">
                    <td className="px-4 py-3 font-medium">
                      {pickLocalizedText(locale, f.titleAr, f.title)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {f.status === "published" ? t(`${W}.statusPublished`, "Published") : t(`${W}.statusDraft`, "Draft")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/whiteboard-files/${f.id}/edit`} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1 text-xs">
                          {f.status === "draft" ? t(`${W}.edit`, "Edit") : t(`${W}.view`, "View")}
                        </Link>
                        {f.status === "published" ? (
                          <>
                            <button type="button" onClick={() => void openCodes(f.id)} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1 text-xs">
                              {t(`${W}.codes`, "Codes")}
                            </button>
                            <a href={`/api/dashboard/whiteboard-files/${f.id}/download?format=image`} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1 text-xs">
                              {t(`${W}.download`, "Download")}
                            </a>
                          </>
                        ) : null}
                        <button type="button" onClick={() => void deleteFile(f.id, f.title)} className="rounded-[var(--radius-btn)] border border-red-500/40 px-3 py-1 text-xs text-red-600">
                          {t(`${W}.delete`, "Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {codesFileId ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h3 className="font-semibold">{t(`${W}.codesPanelTitle`, "Activation codes")}</h3>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm">{t(`${W}.codeCount`, "Count")}</label>
              <input type="number" min={1} max={500} value={codeCount} onChange={(e) => setCodeCount(Number(e.target.value))} className="mt-1 w-24 rounded-[var(--radius-btn)] border border-[var(--color-border)] px-2 py-1" />
            </div>
            <button type="button" disabled={codesLoading} onClick={() => void generateCodes()} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white disabled:opacity-50">
              {t(`${W}.generateCodes`, "Generate codes")}
            </button>
            <button type="button" onClick={() => setCodesFileId(null)} className="text-sm text-[var(--color-muted)]">
              {t(`${W}.close`, "Close")}
            </button>
          </div>
          {codesLoading ? <p className="mt-3 text-sm text-[var(--color-muted)]">{t(`${W}.loading`, "Loading…")}</p> : null}
          <ul className="mt-4 max-h-48 space-y-1 overflow-auto font-mono text-xs">
            {codes.map((c) => (
              <li key={c.id} className={c.usedAt ? "text-[var(--color-muted)] line-through" : ""}>
                {c.code} {c.usedAt ? `(${t(`${W}.used`, "used")})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
