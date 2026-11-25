import type { RouteLocationRaw } from "vue-router";
import type { IconName } from "./icons";

export interface NavItem {
  id: string;
  label: string;
  /** A shorter label for the tab bar, where space is tight. */
  short?: string;
  icon: IconName;
  to: RouteLocationRaw;
  /** A small readout beside the label, such as due reviews. */
  count?: number;
}
export interface NavTrack {
  id: string;
  title: string;
  to: RouteLocationRaw;
  percent: number;
}
export interface NavUser {
  name: string;
  login: string;
  avatarUrl?: string | null;
}
