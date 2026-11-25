import { basePath } from "../../shared/locale";
/** The showcase is reachable in development, or anywhere NUXT_PUBLIC_DESIGN_SHOWCASE is true. */
export function designShowcaseEnabled(dev: boolean, flag: unknown) {
  return dev || flag === true || flag === "true";
}
/** True for the showcase in either locale: /design and /en/design. */
export const isDesignShowcasePath = (path: string) => /^\/design(?:\/|$)/i.test(basePath(path));
