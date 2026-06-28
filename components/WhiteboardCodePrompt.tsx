"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/LocaleProvider";
import { getDir } from "@/lib/i18n/core";

export function WhiteboardCodePrompt() {
  const t = useT();
  const locale = useLocale();
  const dir = getDir(locale);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setMessage({
        type: "error",
        text: t("courses.whiteboardCodeEmpty", "Enter your whiteboard access code"),
      });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/activate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error ?? t("courses.whiteboardCodeFailed", "Failed to activate the code"),
        });
        return;
      }
      setMessage({
        type: "success",
        text:
          data.message ??
          t("courses.whiteboardCodeSuccess", "Whiteboard access unlocked — you can now enter the live room"),
      });
      setCode("");
      router.refresh();
    } catch {
      setMessage({
        type: "error",
        text: t("courses.whiteboardCodeFailed", "Failed to activate the code"),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
        {t("courses.whiteboardCodeTitle", "Unlock interactive whiteboard")}
      </h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "courses.whiteboardCodeHint",
          "Join the live video via Zoom/Meet above. Enter a whiteboard promo code to access the in-app whiteboard.",
        )}
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          dir={dir}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t("courses.whiteboardCodePlaceholder", "Whiteboard promo code")}
          className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-mono placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading
            ? t("courses.whiteboardCodeSubmitting", "Activating...")
            : t("courses.whiteboardCodeSubmit", "Unlock whiteboard")}
        </button>
      </form>
      {message && (
        <p
          className={`mt-2 text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
