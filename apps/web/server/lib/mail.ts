import { h } from "vue";
import { renderToString } from "vue/server-renderer";
import Challenge, { palette } from "virtual:sign-in-email";
import en from "../../i18n/locales/en.json";
import ru from "../../i18n/locales/ru.json";

import { sendMail } from "./mail-transport";

export async function sendChallenge(
  email: string,
  code: string,
  locale: "ru" | "en",
  link: string | null,
) {
  const catalog = (locale === "ru" ? ru : en).mail;
  const t = (key: `mail.${keyof typeof catalog}`) => catalog[key.slice(5) as keyof typeof catalog];
  const copy = {
    heading: link ? t("mail.signIn") : t("mail.change"),
    expires: link ? t("mail.expires") : t("mail.changeExpires"),
    button: t("mail.button"),
    ignore: t("mail.ignore"),
  };
  const message = {
    to: email,
    subject: (link ? t("mail.subject") : t("mail.changeSubject")).replace("{code}", code),
    text: [copy.heading, code, copy.expires, link && copy.button + "\n" + link, copy.ignore]
      .filter(Boolean)
      .join("\n\n"),
    html:
      "<!doctype html>" +
      (await renderToString(h(Challenge, { palette, locale, copy, code, link }))),
  };
  await sendMail(message);
}
