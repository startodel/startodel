/** The showcase is reachable in development, or anywhere NUXT_PUBLIC_DESIGN_SHOWCASE is true. */
export function designShowcaseEnabled(dev: boolean, flag: unknown) {
  return dev || flag === true || flag === "true";
}
export const isDesignShowcasePath = (path: string) => /^\/design(?:\/|$)/i.test(path);
