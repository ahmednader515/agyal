"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSetting } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";

function MethodFields({
  title,
  methodTitleAr,
  methodTitleEn,
  transferAr,
  transferEn,
  account,
  onMethodTitleAr,
  onMethodTitleEn,
  onTransferAr,
  onTransferEn,
  onAccount,
  placeholders,
}: {
  title: string;
  methodTitleAr: string;
  methodTitleEn: string;
  transferAr: string;
  transferEn: string;
  account: string;
  onMethodTitleAr: (v: string) => void;
  onMethodTitleEn: (v: string) => void;
  onTransferAr: (v: string) => void;
  onTransferEn: (v: string) => void;
  onAccount: (v: string) => void;
  placeholders: {
    methodTitleAr: string;
    methodTitleEn: string;
    transferAr: string;
    transferEn: string;
    account: string;
  };
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{title}</h3>
      <div className="space-y-4">
        <input
          value={methodTitleAr}
          onChange={(e) => onMethodTitleAr(e.target.value)}
          placeholder={placeholders.methodTitleAr}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
        <input
          value={methodTitleEn}
          onChange={(e) => onMethodTitleEn(e.target.value)}
          placeholder={placeholders.methodTitleEn}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
        <textarea
          value={transferAr}
          onChange={(e) => onTransferAr(e.target.value)}
          placeholder={placeholders.transferAr}
          rows={2}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
        <textarea
          value={transferEn}
          onChange={(e) => onTransferEn(e.target.value)}
          placeholder={placeholders.transferEn}
          rows={2}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
        <input
          value={account}
          onChange={(e) => onAccount(e.target.value)}
          placeholder={placeholders.account}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
      </div>
    </div>
  );
}

export function AddBalanceSettingsForm({ initialSettings }: { initialSettings: HomepageSetting }) {
  const router = useRouter();
  const t = useT();
  const Ab = "dashboard.addBalanceSettings";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    addBalanceTitle: initialSettings.addBalanceTitle ?? "",
    addBalanceTitleEn: initialSettings.addBalanceTitleEn ?? "",
    addBalanceSubtitle: initialSettings.addBalanceSubtitle ?? "",
    addBalanceSubtitleEn: initialSettings.addBalanceSubtitleEn ?? "",
    addBalanceMethodTitle: initialSettings.addBalanceMethodTitle ?? "",
    addBalanceMethodTitleEn: initialSettings.addBalanceMethodTitleEn ?? "",
    addBalanceTransferInstruction: initialSettings.addBalanceTransferInstruction ?? "",
    addBalanceTransferInstructionEn: initialSettings.addBalanceTransferInstructionEn ?? "",
    addBalanceWalletNumber: initialSettings.addBalanceWalletNumber ?? "",
    addBalancePaypalMethodTitle: initialSettings.addBalancePaypalMethodTitle ?? "",
    addBalancePaypalMethodTitleEn: initialSettings.addBalancePaypalMethodTitleEn ?? "",
    addBalancePaypalTransferInstruction: initialSettings.addBalancePaypalTransferInstruction ?? "",
    addBalancePaypalTransferInstructionEn: initialSettings.addBalancePaypalTransferInstructionEn ?? "",
    addBalancePaypalAccount: initialSettings.addBalancePaypalAccount ?? "",
    addBalanceInstapayMethodTitle: initialSettings.addBalanceInstapayMethodTitle ?? "",
    addBalanceInstapayMethodTitleEn: initialSettings.addBalanceInstapayMethodTitleEn ?? "",
    addBalanceInstapayTransferInstruction: initialSettings.addBalanceInstapayTransferInstruction ?? "",
    addBalanceInstapayTransferInstructionEn: initialSettings.addBalanceInstapayTransferInstructionEn ?? "",
    addBalanceInstapayAccount: initialSettings.addBalanceInstapayAccount ?? "",
    addBalanceConfirmationNote: initialSettings.addBalanceConfirmationNote ?? "",
    addBalanceConfirmationNoteEn: initialSettings.addBalanceConfirmationNoteEn ?? "",
    addBalanceWhatsappNumber: initialSettings.addBalanceWhatsappNumber ?? "",
    addBalanceWhatsappButtonText: initialSettings.addBalanceWhatsappButtonText ?? "",
    addBalanceWhatsappButtonTextEn: initialSettings.addBalanceWhatsappButtonTextEn ?? "",
    addBalanceWaitingNote: initialSettings.addBalanceWaitingNote ?? "",
    addBalanceWaitingNoteEn: initialSettings.addBalanceWaitingNoteEn ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/settings/add-balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t(`${Ab}.saveFailed`));
      setSuccess(t(`${Ab}.saveSuccess`));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t(`${Ab}.genericError`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-6">
      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {success}
        </div>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{t(`${Ab}.sectionPageCopy`)}</h3>
        <div className="space-y-4">
          <input
            value={form.addBalanceTitle}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceTitle: e.target.value }))}
            placeholder={t(`${Ab}.phTitleAr`)}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceTitleEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceTitleEn: e.target.value }))}
            placeholder={t(`${Ab}.phTitleEn`)}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceSubtitle}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceSubtitle: e.target.value }))}
            placeholder={t(`${Ab}.phSubtitleAr`)}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceSubtitleEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceSubtitleEn: e.target.value }))}
            placeholder={t(`${Ab}.phSubtitleEn`)}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </div>
      </div>

      <MethodFields
        title={t(`${Ab}.sectionVodafone`)}
        methodTitleAr={form.addBalanceMethodTitle}
        methodTitleEn={form.addBalanceMethodTitleEn}
        transferAr={form.addBalanceTransferInstruction}
        transferEn={form.addBalanceTransferInstructionEn}
        account={form.addBalanceWalletNumber}
        onMethodTitleAr={(v) => setForm((f) => ({ ...f, addBalanceMethodTitle: v }))}
        onMethodTitleEn={(v) => setForm((f) => ({ ...f, addBalanceMethodTitleEn: v }))}
        onTransferAr={(v) => setForm((f) => ({ ...f, addBalanceTransferInstruction: v }))}
        onTransferEn={(v) => setForm((f) => ({ ...f, addBalanceTransferInstructionEn: v }))}
        onAccount={(v) => setForm((f) => ({ ...f, addBalanceWalletNumber: v }))}
        placeholders={{
          methodTitleAr: t(`${Ab}.phMethodTitleAr`),
          methodTitleEn: t(`${Ab}.phMethodTitleEn`),
          transferAr: t(`${Ab}.phTransferInstrAr`),
          transferEn: t(`${Ab}.phTransferInstrEn`),
          account: t(`${Ab}.phWallet`),
        }}
      />

      <MethodFields
        title={t(`${Ab}.sectionPaypal`)}
        methodTitleAr={form.addBalancePaypalMethodTitle}
        methodTitleEn={form.addBalancePaypalMethodTitleEn}
        transferAr={form.addBalancePaypalTransferInstruction}
        transferEn={form.addBalancePaypalTransferInstructionEn}
        account={form.addBalancePaypalAccount}
        onMethodTitleAr={(v) => setForm((f) => ({ ...f, addBalancePaypalMethodTitle: v }))}
        onMethodTitleEn={(v) => setForm((f) => ({ ...f, addBalancePaypalMethodTitleEn: v }))}
        onTransferAr={(v) => setForm((f) => ({ ...f, addBalancePaypalTransferInstruction: v }))}
        onTransferEn={(v) => setForm((f) => ({ ...f, addBalancePaypalTransferInstructionEn: v }))}
        onAccount={(v) => setForm((f) => ({ ...f, addBalancePaypalAccount: v }))}
        placeholders={{
          methodTitleAr: t(`${Ab}.phPaypalMethodTitleAr`),
          methodTitleEn: t(`${Ab}.phPaypalMethodTitleEn`),
          transferAr: t(`${Ab}.phPaypalTransferAr`),
          transferEn: t(`${Ab}.phPaypalTransferEn`),
          account: t(`${Ab}.phPaypalAccount`),
        }}
      />

      <MethodFields
        title={t(`${Ab}.sectionInstapay`)}
        methodTitleAr={form.addBalanceInstapayMethodTitle}
        methodTitleEn={form.addBalanceInstapayMethodTitleEn}
        transferAr={form.addBalanceInstapayTransferInstruction}
        transferEn={form.addBalanceInstapayTransferInstructionEn}
        account={form.addBalanceInstapayAccount}
        onMethodTitleAr={(v) => setForm((f) => ({ ...f, addBalanceInstapayMethodTitle: v }))}
        onMethodTitleEn={(v) => setForm((f) => ({ ...f, addBalanceInstapayMethodTitleEn: v }))}
        onTransferAr={(v) => setForm((f) => ({ ...f, addBalanceInstapayTransferInstruction: v }))}
        onTransferEn={(v) => setForm((f) => ({ ...f, addBalanceInstapayTransferInstructionEn: v }))}
        onAccount={(v) => setForm((f) => ({ ...f, addBalanceInstapayAccount: v }))}
        placeholders={{
          methodTitleAr: t(`${Ab}.phInstapayMethodTitleAr`),
          methodTitleEn: t(`${Ab}.phInstapayMethodTitleEn`),
          transferAr: t(`${Ab}.phInstapayTransferAr`),
          transferEn: t(`${Ab}.phInstapayTransferEn`),
          account: t(`${Ab}.phInstapayAccount`),
        }}
      />

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{t(`${Ab}.sectionShared`)}</h3>
        <div className="space-y-4">
          <textarea
            value={form.addBalanceConfirmationNote}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceConfirmationNote: e.target.value }))}
            placeholder={t(`${Ab}.phConfirmationAr`)}
            rows={2}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceConfirmationNoteEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceConfirmationNoteEn: e.target.value }))}
            placeholder={t(`${Ab}.phConfirmationEn`)}
            rows={2}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWhatsappNumber}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWhatsappNumber: e.target.value }))}
            placeholder={t(`${Ab}.phWhatsapp`)}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWhatsappButtonText}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWhatsappButtonText: e.target.value }))}
            placeholder={t(`${Ab}.phWhatsappBtnAr`)}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWhatsappButtonTextEn}
            onChange={(e) =>
              setForm((f) => ({ ...f, addBalanceWhatsappButtonTextEn: e.target.value }))
            }
            placeholder={t(`${Ab}.phWhatsappBtnEn`)}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceWaitingNote}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWaitingNote: e.target.value }))}
            placeholder={t(`${Ab}.phWaitingNoteAr`)}
            rows={3}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceWaitingNoteEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWaitingNoteEn: e.target.value }))}
            placeholder={t(`${Ab}.phWaitingNoteEn`)}
            rows={3}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2 font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving ? t(`${Ab}.saving`) : t(`${Ab}.saveIdle`)}
      </button>
    </form>
  );
}
