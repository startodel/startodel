<script setup lang="ts">
import type { LinkTarget } from "../ui/nav";
import { sampleNav, sampleNavTracks, sampleUser, screenPath } from "./sample";
/** The signed-in shell with sample navigation, shared by the mock screens. */
defineProps<{
  current?: string;
  currentTrack?: string;
  crumbs?: { label: string; to?: LinkTarget }[];
  flush?: boolean;
}>();
const { push: notify } = useToast();
</script>
<template>
  <UiAppShell
    :items="sampleNav"
    :tracks="sampleNavTracks"
    :user="sampleUser"
    :current="current"
    :current-track="currentTrack"
    :crumbs="crumbs"
    :flush="flush"
    :home="screenPath('dashboard')"
    @logout="notify({ title: 'Signed out', text: 'This is a mock screen.' })"
  >
    <template #actions><slot name="actions" /></template>
    <slot />
  </UiAppShell>
</template>
