"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSnapshot, type Editor, type TLStoreSnapshot } from "@tldraw/editor";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useT } from "@/components/LocaleProvider";
import { useRouter } from "next/navigation";
import {
  FullscreenIcon,
  WhiteboardFullscreenFrame,
  type WhiteboardFullscreenHandle,
} from "./WhiteboardFullscreenFrame";

type Props = {
  fileId: string;
  fileTitle: string;
  initialSnapshotUrl: string | null;
  isPublished: boolean;
  onPublished?: () => void;
};

export function StandaloneWhiteboardEditor({
  fileId,
  fileTitle,
  initialSnapshotUrl,
  isPublished,
  onPublished,
}: Props) {
  const t = useT();
  const router = useRouter();
  const W = "dashboard.whiteboardFiles";
  const editorRef = useRef<Editor | null>(null);
  const fullscreenRef = useRef<WhiteboardFullscreenHandle>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingSnapshot, setLoadingSnapshot] = useState(!!initialSnapshotUrl);
  const [initialSnapshot, setInitialSnapshot] = useState<TLStoreSnapshot | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!initialSnapshotUrl) {
      setLoadingSnapshot(false);
      return;
    }
    let cancelled = false;
    fetch(initialSnapshotUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setInitialSnapshot(data as TLStoreSnapshot);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingSnapshot(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialSnapshotUrl]);

  const onMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      editor.user.updateUserPreferences({ name: fileTitle || "Admin" });
      if (initialSnapshot) {
        editor.loadSnapshot(initialSnapshot);
      }
    },
    [fileTitle, initialSnapshot],
  );

  useEffect(() => {
    if (initialSnapshot && editorRef.current) {
      editorRef.current.loadSnapshot(initialSnapshot);
    }
  }, [initialSnapshot]);

  async function saveDraft() {
    const editor = editorRef.current;
    if (!editor) return;
    setError("");
    setSuccess("");
    setSaving(true);
    const snapshot = getSnapshot(editor.store);
    const res = await fetch(`/api/dashboard/whiteboard-files/${encodeURIComponent(fileId)}/draft`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : t(`${W}.saveDraftFailed`, "Save failed"));
      return;
    }
    setSuccess(t(`${W}.saveDraftSuccess`, "Draft saved"));
  }

  async function publish() {
    const editor = editorRef.current;
    if (!editor) return;
    if (!confirm(t(`${W}.publishConfirm`, "Publish this whiteboard? Students will need a code to access it."))) {
      return;
    }
    setError("");
    setSuccess("");
    setPublishing(true);
    try {
      const ids = [...editor.getCurrentPageShapeIds()];
      const snapshot = getSnapshot(editor.store);
      const form = new FormData();
      form.append("snapshot", JSON.stringify(snapshot));
      if (ids.length > 0) {
        const { blob } = await editor.toImage(ids, { format: "png", background: true });
        form.append("image", new File([blob], "whiteboard.png", { type: blob.type || "image/png" }));
      }
      const res = await fetch(`/api/dashboard/whiteboard-files/${encodeURIComponent(fileId)}/publish`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t(`${W}.publishFailed`, "Publish failed"));
        return;
      }
      setSuccess(t(`${W}.publishSuccess`, "Published"));
      onPublished?.();
      router.push("/dashboard/whiteboard-files");
      router.refresh();
    } catch {
      setError(t(`${W}.publishFailed`, "Publish failed"));
    } finally {
      setPublishing(false);
    }
  }

  async function downloadImage() {
    const editor = editorRef.current;
    if (!editor) return;
    setError("");
    setSuccess("");
    const ids = [...editor.getCurrentPageShapeIds()];
    if (ids.length === 0) {
      setError(t(`${W}.emptyCanvas`, "The whiteboard is empty."));
      return;
    }
    setDownloading(true);
    try {
      const { blob } = await editor.toImage(ids, { format: "png", background: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (fileTitle || "whiteboard").replace(/[^\p{L}\p{N}_-]+/gu, "_");
      a.download = `${safeTitle}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(t(`${W}.downloadFailed`, "Download failed"));
    } finally {
      setDownloading(false);
    }
  }

  if (loadingSnapshot) {
    return (
      <div className="flex h-[min(70vh,640px)] items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-sm text-[var(--color-muted)]">{t(`${W}.loadingEditor`, "Loading whiteboard…")}</p>
      </div>
    );
  }

  const fullscreenLabel = isFullscreen
    ? t(`${W}.exitFullscreen`, "Exit fullscreen")
    : t(`${W}.fullscreen`, "Fullscreen");

  return (
    <div className="space-y-3">
      {isPublished ? (
        <p className="rounded-[var(--radius-btn)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm text-[var(--color-primary)]">
          {t(`${W}.publishedReadOnlyHint`, "This file is published. Create a new file to edit a different whiteboard.")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || isPublished}
          onClick={() => void saveDraft()}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? t(`${W}.saveDraftBusy`, "Saving…") : t(`${W}.saveDraft`, "Save draft")}
        </button>
        <button
          type="button"
          disabled={publishing || isPublished}
          onClick={() => void publish()}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {publishing ? t(`${W}.publishBusy`, "Publishing…") : t(`${W}.publish`, "Publish")}
        </button>
        <button
          type="button"
          disabled={downloading}
          onClick={() => void downloadImage()}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {downloading ? t(`${W}.saveDraftBusy`, "Saving…") : t(`${W}.downloadImage`, "Download image")}
        </button>
        <button
          type="button"
          onClick={() => void fullscreenRef.current?.toggleFullscreen()}
          className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
          aria-label={fullscreenLabel}
          title={fullscreenLabel}
        >
          <FullscreenIcon exit={isFullscreen} />
          {fullscreenLabel}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-[var(--color-primary)]">{success}</p> : null}
      <WhiteboardFullscreenFrame
        ref={fullscreenRef}
        className="h-[min(70vh,640px)]"
        fullscreenLabel={t(`${W}.fullscreen`, "Fullscreen")}
        exitFullscreenLabel={t(`${W}.exitFullscreen`, "Exit fullscreen")}
        onFullscreenChange={setIsFullscreen}
      >
        <div className="h-full">
          <Tldraw onMount={onMount} />
        </div>
      </WhiteboardFullscreenFrame>
    </div>
  );
}
