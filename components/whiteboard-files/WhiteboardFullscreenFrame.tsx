"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";

export function FullscreenIcon({ exit }: { exit?: boolean }) {
  if (exit) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
        <path d="M3 16h3a2 2 0 0 1 2 2v3" />
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export type WhiteboardFullscreenHandle = {
  toggleFullscreen: () => Promise<void>;
  isFullscreen: boolean;
};

type Props = {
  children: ReactNode;
  fullscreenLabel: string;
  exitFullscreenLabel: string;
  className?: string;
  showOverlayButton?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
};

export const WhiteboardFullscreenFrame = forwardRef<WhiteboardFullscreenHandle, Props>(
  function WhiteboardFullscreenFrame(
    {
      children,
      fullscreenLabel,
      exitFullscreenLabel,
      className = "",
      showOverlayButton = true,
      onFullscreenChange,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
      const onFullscreenChangeEvent = () => {
        const next = document.fullscreenElement === containerRef.current;
        setIsFullscreen(next);
        onFullscreenChange?.(next);
      };
      document.addEventListener("fullscreenchange", onFullscreenChangeEvent);
      document.addEventListener("webkitfullscreenchange", onFullscreenChangeEvent);
      return () => {
        document.removeEventListener("fullscreenchange", onFullscreenChangeEvent);
        document.removeEventListener("webkitfullscreenchange", onFullscreenChangeEvent);
      };
    }, [onFullscreenChange]);

    async function toggleFullscreen() {
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
    }

    useImperativeHandle(ref, () => ({ toggleFullscreen, isFullscreen }), [isFullscreen]);

    const label = isFullscreen ? exitFullscreenLabel : fullscreenLabel;

    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)] [&:fullscreen]:h-screen [&:fullscreen]:min-h-0 [&:fullscreen]:rounded-none [&:fullscreen]:border-0 ${className}`}
      >
        {showOverlayButton ? (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="absolute end-2 top-2 z-20 inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2.5 py-1.5 text-xs font-medium text-[var(--color-foreground)] shadow-sm backdrop-blur-sm transition hover:bg-[var(--color-border)]/40"
            aria-label={label}
            title={label}
          >
            <FullscreenIcon exit={isFullscreen} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ) : null}
        {children}
      </div>
    );
  },
);
