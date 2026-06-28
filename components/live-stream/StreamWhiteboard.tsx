"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Editor,
  Tldraw,
  defaultBindingUtils,
  defaultShapeUtils,
} from "tldraw";
import { useSync } from "@tldraw/sync";
import "tldraw/tldraw.css";
import { useT } from "@/components/LocaleProvider";
import { createMultiplayerAssetStore } from "@/lib/tldraw/multiplayerAssetStore";
import type { WhiteboardTokenMode } from "@/lib/tldraw/whiteboard-token";

type Props = {
  streamId: string;
  syncUrl: string;
  token: string;
  mode: WhiteboardTokenMode;
  userName: string;
  readonlyHint: string;
  connectingLabel: string;
  errorLabel: string;
};

function configureEditor(editor: Editor, mode: WhiteboardTokenMode, userName: string) {
  editor.user.updateUserPreferences({ name: userName });
  if (mode === "viewer") {
    editor.updateInstanceState({ isReadonly: true });
    editor.setCurrentTool("hand");
  }
}

function FullscreenIcon({ exit }: { exit?: boolean }) {
  if (exit) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
        <path d="M3 16h3a2 2 0 0 1 2 2v3" />
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function StreamWhiteboard({
  streamId,
  syncUrl,
  token,
  mode,
  userName,
  readonlyHint,
  connectingLabel,
  errorLabel,
}: Props) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const assets = useMemo(
    () => createMultiplayerAssetStore(syncUrl, token),
    [syncUrl, token],
  );

  const uri = useMemo(() => {
    const base = syncUrl.replace(/\/$/, "");
    return `${base}/api/connect/${encodeURIComponent(streamId)}?token=${encodeURIComponent(token)}`;
  }, [syncUrl, streamId, token]);

  const store = useSync({
    uri,
    assets,
    shapeUtils: defaultShapeUtils,
    bindingUtils: defaultBindingUtils,
  });

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Browser blocked or unsupported
    }
  };

  if (store.status === "loading") {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-muted)]">
        {connectingLabel}
      </div>
    );
  }

  if (store.status === "error") {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-[var(--radius-card)] border border-red-300 bg-red-50 px-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
        {errorLabel}: {store.error?.message ?? "Unknown error"}
      </div>
    );
  }

  const fullscreenLabel = isFullscreen
    ? t("courses.whiteboardExitFullscreen", "Exit fullscreen")
    : t("courses.whiteboardFullscreen", "Fullscreen");

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)] [&:fullscreen]:min-h-0 [&:fullscreen]:h-screen [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        {mode === "viewer" ? (
          <p className="min-w-0 flex-1 truncate text-xs text-[var(--color-muted)]">{readonlyHint}</p>
        ) : (
          <span className="flex-1" />
        )}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-border)]/40"
          aria-label={fullscreenLabel}
          title={fullscreenLabel}
        >
          <FullscreenIcon exit={isFullscreen} />
          {fullscreenLabel}
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <Tldraw
          store={store.store}
          licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
          onMount={(editor) => configureEditor(editor, mode, userName)}
        />
      </div>
    </div>
  );
}
