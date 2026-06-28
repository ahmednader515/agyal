"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useT } from "@/components/LocaleProvider";
import type { WhiteboardTokenMode } from "@/lib/tldraw/whiteboard-token";

const StreamWhiteboard = dynamic(
  () => import("./StreamWhiteboard").then((m) => m.StreamWhiteboard),
  { ssr: false, loading: () => <div className="min-h-[420px] animate-pulse rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]" /> },
);

type StreamInfo = {
  id: string;
  title: string;
  titleAr: string;
  meetingUrl: string;
  meetingPassword: string;
  provider: "zoom" | "google_meet";
  scheduledAt: string;
};

type Props = {
  streamId: string;
  courseHref: string;
  courseTitle: string;
  userName: string;
  initialStream?: StreamInfo;
};

export function LiveStreamRoom({
  streamId,
  courseHref,
  courseTitle,
  userName,
  initialStream,
}: Props) {
  const t = useT();
  const [loading, setLoading] = useState(!initialStream);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [syncUrl, setSyncUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<WhiteboardTokenMode>("viewer");
  const [stream, setStream] = useState<StreamInfo | null>(initialStream ?? null);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/live-streams/${streamId}/whiteboard-token`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || t("courses.whiteboardAccessDenied", "Access denied"));
        }
        if (cancelled) return;
        setToken(data.token);
        setSyncUrl(data.syncUrl);
        setMode(data.mode);
        setStream(data.stream);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("courses.whiteboardLoadFailed", "Failed to load whiteboard"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [streamId, t]);

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-[var(--color-muted)]">{t("courses.whiteboardConnecting", "Connecting to live room...")}</p>
      </div>
    );
  }

  if (error || !token || !syncUrl || !stream) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href={courseHref} className="text-sm text-[var(--color-primary)] hover:underline">
          ← {courseTitle}
        </Link>
        <p className="mt-4 rounded-[var(--radius-card)] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error || t("courses.whiteboardLoadFailed", "Failed to load whiteboard")}
        </p>
      </div>
    );
  }

  const displayTitle = stream.titleAr || stream.title;
  const providerLabel =
    stream.provider === "google_meet"
      ? t("courses.providerMeet", "Google Meet")
      : t("courses.providerZoom", "Zoom");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={courseHref} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            ← {courseTitle}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-foreground)]">{displayTitle}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {providerLabel} — {formatDate(stream.scheduledAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm lg:hidden"
        >
          {panelOpen
            ? t("courses.hideMeetingPanel", "Hide meeting info")
            : t("courses.showMeetingPanel", "Show meeting info")}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(240px,35%)_1fr]">
        {panelOpen && (
          <aside className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              {t("courses.meetingPanelTitle", "Video meeting")}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{providerLabel}</p>
            {stream.meetingPassword && mode === "editor" && (
              <p className="mt-2 text-sm text-[var(--color-foreground)]">
                <span className="text-[var(--color-muted)]">{t("courses.meetingPassword", "Password")}: </span>
                {stream.meetingPassword}
              </p>
            )}
            <a
              href={stream.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full justify-center rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
            >
              {t("courses.openMeetingExternal", "Open in Zoom/Meet")}
            </a>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              {t("courses.meetingPanelHint", "Join the video call in a new tab, then use the whiteboard here.")}
            </p>
          </aside>
        )}

        <section className="min-h-[480px] lg:min-h-0">
          <StreamWhiteboard
            streamId={streamId}
            syncUrl={syncUrl}
            token={token}
            mode={mode}
            userName={userName}
            readonlyHint={t("courses.whiteboardReadonly", "View-only — only the teacher can draw")}
            connectingLabel={t("courses.whiteboardConnecting", "Connecting to whiteboard...")}
            errorLabel={t("courses.whiteboardError", "Whiteboard error")}
          />
        </section>
      </div>
    </div>
  );
}
