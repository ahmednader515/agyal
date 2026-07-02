import type { HomepageSetting } from "@/lib/types";
import type { Locale } from "@/lib/i18n/types";

export type AddBalancePaymentMethodId = "vodafone" | "paypal" | "instapay";

export type AddBalancePaymentMethod = {
  id: AddBalancePaymentMethodId;
  methodTitle: string;
  transferInstruction: string;
  accountValue: string;
};

type MethodMsgKey = "methodTitle" | "transferInstruction";

const METHOD_FALLBACK_EN: Record<AddBalancePaymentMethodId, Record<MethodMsgKey, string>> = {
  vodafone: {
    methodTitle: "Vodafone Cash",
    transferInstruction: "Transfer the required amount to the following wallet number:",
  },
  paypal: {
    methodTitle: "PayPal",
    transferInstruction: "Send the required amount to the following PayPal account:",
  },
  instapay: {
    methodTitle: "InstaPay",
    transferInstruction: "Transfer the required amount to the following InstaPay address:",
  },
};

const METHOD_FALLBACK_AR: Record<AddBalancePaymentMethodId, Record<MethodMsgKey, string>> = {
  vodafone: {
    methodTitle: "فودافون كاش",
    transferInstruction: "قم بتحويل المبلغ المطلوب إلى رقم المحفظة التالي:",
  },
  paypal: {
    methodTitle: "PayPal",
    transferInstruction: "أرسل المبلغ المطلوب إلى حساب PayPal التالي:",
  },
  instapay: {
    methodTitle: "InstaPay",
    transferInstruction: "حوّل المبلغ المطلوب إلى عنوان InstaPay التالي:",
  },
};

function resolveMethodCopy(
  locale: Locale,
  adminAr: string | null | undefined,
  adminEn: string | null | undefined,
  methodId: AddBalancePaymentMethodId,
  key: MethodMsgKey,
): string {
  if (locale === "en") {
    const fromAdmin = (adminEn ?? "").trim();
    if (fromAdmin) return fromAdmin;
    return METHOD_FALLBACK_EN[methodId][key];
  }
  const fromAdmin = (adminAr ?? "").trim();
  if (fromAdmin) return fromAdmin;
  return METHOD_FALLBACK_AR[methodId][key];
}

export function buildAddBalancePaymentMethods(
  settings: HomepageSetting,
  locale: Locale,
): AddBalancePaymentMethod[] {
  return [
    {
      id: "vodafone",
      methodTitle: resolveMethodCopy(
        locale,
        settings.addBalanceMethodTitle,
        settings.addBalanceMethodTitleEn,
        "vodafone",
        "methodTitle",
      ),
      transferInstruction: resolveMethodCopy(
        locale,
        settings.addBalanceTransferInstruction,
        settings.addBalanceTransferInstructionEn,
        "vodafone",
        "transferInstruction",
      ),
      accountValue: settings.addBalanceWalletNumber?.trim() || "01023005622",
    },
    {
      id: "paypal",
      methodTitle: resolveMethodCopy(
        locale,
        settings.addBalancePaypalMethodTitle,
        settings.addBalancePaypalMethodTitleEn,
        "paypal",
        "methodTitle",
      ),
      transferInstruction: resolveMethodCopy(
        locale,
        settings.addBalancePaypalTransferInstruction,
        settings.addBalancePaypalTransferInstructionEn,
        "paypal",
        "transferInstruction",
      ),
      accountValue: settings.addBalancePaypalAccount?.trim() || "",
    },
    {
      id: "instapay",
      methodTitle: resolveMethodCopy(
        locale,
        settings.addBalanceInstapayMethodTitle,
        settings.addBalanceInstapayMethodTitleEn,
        "instapay",
        "methodTitle",
      ),
      transferInstruction: resolveMethodCopy(
        locale,
        settings.addBalanceInstapayTransferInstruction,
        settings.addBalanceInstapayTransferInstructionEn,
        "instapay",
        "transferInstruction",
      ),
      accountValue: settings.addBalanceInstapayAccount?.trim() || "",
    },
  ];
}
