import { basePath, localizedPath, pageLocale } from "../shared/locale";
import en from "../i18n/locales/en.json";
import ru from "../i18n/locales/ru.json";

// Keep request URLs, diagnostics and hydration data out of public 404s.
export default defineNitroErrorHandler(async (error, event) => {
  if (error.statusCode !== 404) return;
  const path = getRequestURL(event).pathname;
  const json = path.startsWith("/api/public/") || path.startsWith("/og/");
  if (!json && !basePath(path).startsWith("/u/")) return;
  const lang = pageLocale(path);
  const { brand, common, legal } = lang === "en" ? en : ru;
  const body = json
    ? '{"message":"Not found"}'
    : `<!doctype html><html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${common.notFound} · ${brand}</title>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">
<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png">
</head>
<body>
<main><h1>${common.notFound}</h1><a href="${localizedPath("/", lang)}">${brand}</a></main>
<footer><a href="${localizedPath("/terms", lang)}">${legal.terms}</a> · <a href="${localizedPath("/rules", lang)}">${legal.rules}</a></footer>
</body></html>`;
  await sendWebResponse(
    event,
    new Response(body, {
      status: 404,
      headers: {
        "content-type": json ? "application/json" : "text/html; charset=utf-8",
      },
    }),
  );
});
