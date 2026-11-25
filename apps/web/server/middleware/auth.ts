import { basePath } from "../../shared/locale";
import { defineHandler, getRequestURL } from "nuxt/server";
import { requireUser } from "../utils/require-user";

const publicApiPaths = new Set(["/api/health", "/api/_auth/session"]);
const publicApiPrefixes = ["/api/auth/"];

export default defineHandler(async (event) => {
  const { pathname } = getRequestURL(event);
  if (!/^\/api(?:\/|$)/i.test(basePath(pathname))) return;
  if (
    (event.req.method === "GET" && pathname.startsWith("/api/public/")) ||
    publicApiPaths.has(pathname) ||
    publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))
  )
    return;
  await requireUser(event);
});
