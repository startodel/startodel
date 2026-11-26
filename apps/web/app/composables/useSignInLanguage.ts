import { languageCookie } from "../../shared/locale";

export function useSignInLanguage() {
  const { locale } = useI18n();
  const preference = useCookie(languageCookie, { sameSite: "lax", maxAge: 31536000, path: "/" });
  return () => {
    preference.value = locale.value;
  };
}
