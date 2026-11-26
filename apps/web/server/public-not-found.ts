import { basePath, localizedPath, pageLocale } from "../shared/locale";
import en from "../i18n/locales/en.json";
import ru from "../i18n/locales/ru.json";

// Keep request URLs, diagnostics and hydration data out of public 404s.
export default defineNitroErrorHandler(async (error, event) => {
  if (error.statusCode !== 404) return;
  const path = getRequestURL(event).pathname;
  const api = path.startsWith("/api/public/");
  if (!api && !basePath(path).startsWith("/u/")) return;
  const lang = pageLocale(path);
  const { common, legal } = lang === "en" ? en : ru;
  const body = api
    ? '{"message":"Not found"}'
    : `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${common.notFound} · Startodel</title><main><h1>${common.notFound}</h1><a href="${localizedPath("/", lang)}">Startodel</a></main><footer><a href="${localizedPath("/terms", lang)}">${legal.terms}</a> · <a href="${localizedPath("/rules", lang)}">${legal.rules}</a></footer></html>`;
  await sendWebResponse(
    event,
    new Response(body, {
      status: 404,
      headers: {
        "content-type": api ? "application/json" : "text/html; charset=utf-8",
      },
    }),
  );
});
