import type { TrackLanguage } from "@startodel/core";
import type { RouteLocationNamedI18n } from "vue-router";
import { basePath } from "../../../shared/locale";
import type { IconName } from "./icons";

/** Where a link leads. Components resolve it in the current interface language. */
export type LinkTarget = RouteLocationNamedI18n;

export interface NavItem {
  id: string;
  label: string;
  /** A shorter label for the tab bar, where space is tight. */
  short?: string;
  icon: IconName;
  to: LinkTarget;
  /** A small readout beside the label, such as due reviews. */
  count?: number;
}
export interface NavTrack {
  language: TrackLanguage;
  id: string;
  title: string;
  to: LinkTarget;
  percent: number;
}
export interface NavUser {
  name: string | null;
  login: string;
  avatarUrl?: string | null;
}

export function appNavigation(
  path: string,
  items: Pick<NavItem, "id" | "label" | "to">[],
  tracks: Pick<NavTrack, "id" | "title">[] = [],
) {
  const [, section, id] = basePath(path).split("/");
  const item = items.find(({ to }) => to === "/" + section);
  const currentTrack = section === "tracks" && id ? id : undefined;
  const crumbs: { label: string; to?: LinkTarget }[] = [];
  if (item)
    crumbs.push({ label: item.label, to: section === "grills" && id ? item.to : undefined });
  const track = currentTrack && tracks.find(({ id }) => id === currentTrack);
  if (track) {
    const dashboard = items.find(({ id }) => id === "dashboard");
    if (dashboard) crumbs.push({ label: dashboard.label, to: dashboard.to });
    crumbs.push({ label: track.title });
  }
  return { current: item?.id, currentTrack, crumbs };
}
