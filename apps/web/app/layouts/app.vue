<script setup lang="ts">
import { appNavigation, type NavItem } from "../components/ui/nav";

const { t } = useI18n();
const { user } = useUserSession();
const route = useRoute();
const logout = useLogout();
const [{ data: catalog }, { data: dashboard }] = await Promise.all([
  useFetch("/api/tracks"),
  useFetch("/api/dashboard"),
]);
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
const tracks = computed(() => {
  const progress = new Map(dashboard.value?.tracks.map((track) => [track.trackId, track.percent]));
  return catalog.value?.map(({ id, title }) => ({
    id,
    title,
    to: "/tracks/" + id,
    percent: progress.get(id) ?? 0,
  }));
});
const navigation = computed(() => appNavigation(route.path, items.value, tracks.value));
</script>
<template>
  <UiRoot>
    <UiAppShell
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
