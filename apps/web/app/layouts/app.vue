<script setup lang="ts">
import { privateTrackPath } from "../../shared/locale";
import { appNavigation, type NavItem } from "../components/ui/nav";

const { t } = useI18n();
const { user } = useUserSession();
const route = useRoute();
const logout = useLogout();
const collapsed = useCookie<boolean>("startodel-rail-collapsed", {
  default: () => false,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
});
const { data: dashboard } = await useDashboard();
const items = computed<NavItem[]>(() => [
  {
    id: "dashboard",
    label: t("nav.dashboard"),
    short: t("common.home"),
    icon: "dashboard",
    to: "/dashboard",
  },
  {
    id: "reviews",
    label: t("nav.reviews"),
    icon: "review",
    to: "/reviews",
    count: dashboard.value?.dueReviewsCount,
  },
  { id: "grills", label: t("nav.grills"), icon: "grill", to: "/grills" },
  { id: "progress", label: t("nav.progress"), icon: "progress", to: "/progress" },
  { id: "settings", label: t("nav.settings"), icon: "settings", to: "/settings" },
]);
const tracks = computed(() =>
  dashboard.value?.tracks.map(({ trackSlug, title, language, percent }) => ({
    id: trackSlug,
    language,
    title,
    to: privateTrackPath(trackSlug),
    percent,
  })),
);
const navigation = computed(() => appNavigation(route.path, items.value, tracks.value));
</script>
<template>
  <UiRoot>
    <UiAppShell
      v-model:collapsed="collapsed"
      style="--s-sticky-top: 0px"
      :items="items"
      :tracks="tracks"
      :user="user ?? undefined"
      :current="navigation.current"
      :current-track="navigation.currentTrack"
      :crumbs="navigation.crumbs"
      @logout="logout"
      ><slot
    /></UiAppShell>
  </UiRoot>
</template>
