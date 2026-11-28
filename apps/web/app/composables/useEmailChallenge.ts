export type EmailActions = {
  request: (email: string) => Promise<{ id: string }>;
  verify: (id: string, code: string) => Promise<unknown>;
};

export function useEmailActions(change = false) {
  const destination = ref("/dashboard");
  const { locale } = useI18n();
  return {
    destination,
    request: (email: string) =>
      $fetch(change ? "/api/sign-in/email/request" : "/api/auth/email/request", {
        method: "POST",
        body: { email, locale: locale.value },
      }),
    verify: async (id: string, code: string) => {
      const result = await $fetch<{ consent?: string }>(
        change ? "/api/sign-in/email/verify" : "/api/auth/email/verify",
        {
          method: "POST",
          body: { id, code },
        },
      );
      destination.value = result.consent ?? "/dashboard";
    },
  };
}

export type EmailFailure = { reason?: string; remaining?: number };

export function emailFailure(error: unknown) {
  return (error as { data?: { data?: EmailFailure } } | null)?.data?.data;
}

/** The message for a failure the email endpoints report. An unknown one asks to try again. */
export function useSignInFailureText() {
  const { t } = useI18n();
  return (data?: EmailFailure) => {
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

export function useSignInError() {
  const text = useSignInFailureText();
  return (error: unknown) => text(emailFailure(error));
}
