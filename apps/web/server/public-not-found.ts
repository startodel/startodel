// Keep framework diagnostics (including request URLs and hydration data) out of public 404s.
export default defineNitroErrorHandler(async (error, event) => {
  if (error.statusCode !== 404) return;
  const path = getRequestURL(event).pathname;
  const api = path.startsWith("/api/public/");
  if (!api && !path.startsWith("/u/")) return;
  const body = api
    ? '{"message":"Not found"}'
    : '<!doctype html><html lang="en"><meta charset="utf-8"><title>Not found · Startodel</title><main><h1>Not found</h1><a href="/">Startodel</a></main><footer><a href="/terms">Terms</a> · <a href="/rules">Publishing rules</a></footer></html>';
  await sendWebResponse(
    event,
    new Response(body, {
      status: 404,
      headers: {
        "content-type": api ? "application/json" : "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    }),
  );
});
