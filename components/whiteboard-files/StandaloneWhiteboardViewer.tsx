"use client";

import { useEffect, useRef, useState } from "react";
import { type Editor, type TLStoreSnapshot } from "@tldraw/editor";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useT } from "@/components/LocaleProvider";
import { WhiteboardFullscreenFrame } from "./WhiteboardFullscreenFrame";

type Props = {
  fileId: string;
};

export function StandaloneWhiteboardViewer({ fileId }: Props) {
  const t = useT();
  const W = "dashboard.whiteboardFiles";
  const editorRef = useRef<Editor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [snapshot, setSnapshot] = useState<TLStoreSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/whiteboard-files/${encodeURIComponent(fileId)}/snapshot`, { credentials: "include" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
        return data as { file?: { title?: string }; snapshot?: TLStoreSnapshot };
      })
      .then((data) => {
        if (cancelled) return;
        setTitle(data.file?.title ?? "");
        if (data.snapshot) setSnapshot(data.snapshot);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : t(`${W}.viewerLoadFailed`, "Failed to load"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, t, W]);

  useEffect(() => {
    if (snapshot && editorRef.current) {
      editorRef.current.loadSnapshot(snapshot);
      editorRef.current.updateInstanceState({ isReadonly: true });
      editorRef.current.setCurrentTool("hand");
    }
  }, [snapshot]);

  return (
    <div className="space-y-3">
      {title ? <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h3> : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">{t(`${W}.loadingEditor`, "Loading whiteboard…")}</p>
      ) : null}
      <WhiteboardFullscreenFrame
        className="h-[min(60vh,560px)]"
        fullscreenLabel={t(`${W}.fullscreen`, "Fullscreen")}
        exitFullscreenLabel={t(`${W}.exitFullscreen`, "Exit fullscreen")}
      >
        <div className="h-full">
          <Tldraw
            onMount={(editor) => {
              editorRef.current = editor;
              editor.user.updateUserPreferences({ name: t(`${W}.viewerLabel`, "Student") });
              editor.updateInstanceState({ isReadonly: true });
              editor.setCurrentTool("hand");
              if (snapshot) editor.loadSnapshot(snapshot);
            }}
          />
        </div>
      </WhiteboardFullscreenFrame>
    </div>
  );
}
