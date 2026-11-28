export type EmailActions = {
  request: (email: string) => Promise<{ id: string }>;
  verify: (id: string, code: string) => Promise<unknown>;
};

export function useEmailActions(change = false): EmailActions {
  const { locale } = useI18n();
  return {
    request: (email) =>
      $fetch(change ? "/api/sign-in/email/request" : "/api/auth/email/request", {
        method: "POST",
        body: { email, locale: locale.value },
      }),
    verify: (id, code) =>
      $fetch(change ? "/api/sign-in/email/verify" : "/api/auth/email/verify", {
        method: "POST",
        body: { id, code },
      }),
  };
}

export function emailFailure(error: unknown) {
  return (error as { data?: { data?: { reason?: string; remaining?: number } } } | null)?.data
    ?.data;
}

export function useSignInError() {
  const { t } = useI18n();
  return (error: unknown) => {
    const data = emailFailure(error);
    switch (data?.reason) {
      case "wrong":
        return t("signin.wrong", { remaining: data.remaining });
      case "expired":
        return t("signin.expired");
      case "locked":
        return t("signin.locked");
      case "limited":
        return t("signin.limited");
      case "conflict":
        return t("signin.conflict");
      case "unavailable":
        return t("signin.unavailable");
      case "delivery":
        return t("signin.delivery");
      case "invalid":
        return t("signin.invalid");
      case "lastMethod":
        return t("signin.lastMethod");
      default:
        return t("signin.retry");
    }
  };
}
