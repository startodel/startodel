import { basePath } from "./locale";
export function isPublicPage(path: string) {
  path = basePath(path);
  return path === "/" || path.startsWith("/u/") || /^\/(rules|terms)\/?$/.test(path);
}
