<script setup lang="ts">
import type { LinkTarget, NavTrack } from "../ui/nav";
import { useSampleNav, sampleNavTracks, sampleUser, screenPath } from "./sample";
/** The signed-in shell with sample navigation, shared by the mock screens. */
defineProps<{
  current?: string;
  currentTrack?: string;
  tracks?: NavTrack[];
  crumbs?: { label: string; to?: LinkTarget }[];
  flush?: boolean;
}>();
const sampleNav = useSampleNav();
const { push: notify } = useToast();
</script>
<template>
  <UiAppShell
    :items="sampleNav"
    :tracks="tracks ?? sampleNavTracks"
    :user="sampleUser"
    :current="current"
    :current-track="currentTrack"
    :crumbs="crumbs"
    :flush="flush"
    :home="screenPath('dashboard')"
    @logout="notify({ title: $t('showcase.signedOut'), text: $t('showcase.mock') })"
  >
    <template #actions><slot name="actions" /></template>
    <slot />
  </UiAppShell>
</template>
