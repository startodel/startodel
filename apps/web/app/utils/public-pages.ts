export function isPublicPage(path: string) {
  return path.startsWith("/u/") || /^\/(rules|terms)\/?$/.test(path);
}
