<script setup lang="ts">
import type { TrackLanguage } from "@startodel/core";
defineProps<{ language: TrackLanguage }>();
</script>
<template>
  <UiBadge variant="outline" :title="$t('trackLanguage.label')">
    <span class="s-sr">{{ $t("trackLanguage.label") }} </span>{{ language }}
  </UiBadge>
</template>
