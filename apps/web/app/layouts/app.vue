<script setup lang="ts">
import type { NavItem } from "../components/ui/nav";

const { t } = useI18n();
const { user } = useUserSession();
const route = useRoute();
const baseName = useRouteBaseName();
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
const current = computed(() => items.value.find((item) => item.id === baseName(route)));
const tracks = computed(() => {
  const progress = new Map(dashboard.value?.tracks.map((track) => [track.trackId, track.percent]));
  return catalog.value?.map(({ id, title }) => ({
    id,
    title,
    to: "/tracks/" + id,
    percent: progress.get(id) ?? 0,
  }));
});
</script>
<template>
  <UiRoot>
    <UiAppShell
      style="--s-sticky-top: 0px"
      :items="items"
      :tracks="tracks"
      :user="user ?? undefined"
      :current="current?.id"
      :crumbs="current ? [{ label: current.label }] : []"
      @logout="logout"
      ><slot
    /></UiAppShell>
  </UiRoot>
</template>
