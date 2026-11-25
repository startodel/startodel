import { basePath } from "../../shared/locale";
export function isPublicPage(path: string) {
  path = basePath(path);
  return path.startsWith("/u/") || /^\/(rules|terms)\/?$/.test(path);
}
