import type { RouteLocationNamedI18n } from "vue-router";
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
  id: string;
  title: string;
  to: LinkTarget;
  percent: number;
}
export interface NavUser {
  name: string;
  login: string;
  avatarUrl?: string | null;
}
