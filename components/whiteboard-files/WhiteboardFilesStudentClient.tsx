"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/LocaleProvider";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { StandaloneWhiteboardViewer } from "@/components/whiteboard-files/StandaloneWhiteboardViewer";

export type StudentWhiteboardFile = {
  id: string;
  title: string;
  titleAr: string | null;
  description: string;
  descriptionEn: string | null;
  publishedAt: string | null;
  hasAccess: boolean;
};

export function WhiteboardFilesStudentClient({ initialFiles }: { initialFiles: StudentWhiteboardFile[] }) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const W = "dashboard.whiteboardFiles";
  const [files, setFiles] = useState(initialFiles);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRedeeming(true);
    const res = await fetch("/api/whiteboard-files/redeem-code", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setRedeeming(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : t(`${W}.redeemFailed`, "Invalid code"));
      return;
    }
    setCode("");
    setSuccess(typeof data.message === "string" ? data.message : t(`${W}.redeemSuccess`, "Unlocked"));
    const fileId = data.whiteboardFileId as string | undefined;
    if (fileId) {
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, hasAccess: true } : f)));
      setViewId(fileId);
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold">{t(`${W}.studentTitle`, "Whiteboard library")}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t(`${W}.studentIntro`, "Browse whiteboard notes. Enter a purchase code to unlock viewing and download.")}</p>
        <form onSubmit={(e) => void redeem(e)} className="mt-4 flex flex-wrap gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t(`${W}.codePlaceholder`, "Activation code")}
            className="min-w-[200px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <button type="submit" disabled={redeeming} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {redeeming ? t(`${W}.redeemBusy`, "Activating…") : t(`${W}.redeemIdle`, "Unlock")}
          </button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {success ? <p className="mt-2 text-sm text-[var(--color-primary)]">{success}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {files.length === 0 ? (
          <p className="text-[var(--color-muted)]">{t(`${W}.studentEmpty`, "No whiteboards published yet.")}</p>
        ) : (
          files.map((f) => {
            const label = pickLocalizedText(locale, f.titleAr, f.title);
            return (
              <article key={f.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[var(--color-foreground)]">{label}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${f.hasAccess ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]" : "bg-[var(--color-border)]/50 text-[var(--color-muted)]"}`}>
                    {f.hasAccess ? t(`${W}.unlocked`, "Unlocked") : t(`${W}.locked`, "Locked")}
                  </span>
                </div>
                {f.description ? <p className="mt-2 text-sm text-[var(--color-muted)] line-clamp-3">{f.description}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {f.hasAccess ? (
                    <>
                      <button type="button" onClick={() => setViewId(viewId === f.id ? null : f.id)} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white">
                        {viewId === f.id ? t(`${W}.hideViewer`, "Hide") : t(`${W}.view`, "View")}
                      </button>
                      <a href={`/api/whiteboard-files/${f.id}/download?format=image`} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium">
                        {t(`${W}.download`, "Download")}
                      </a>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">{t(`${W}.needCode`, "Enter a code above to unlock")}</span>
                  )}
                </div>
                {viewId === f.id && f.hasAccess ? (
                  <div className="mt-4">
                    <StandaloneWhiteboardViewer fileId={f.id} />
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
