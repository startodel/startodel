<script setup lang="ts">
import type { LinkTarget } from "./nav";

defineProps<{
  connected: boolean;
  prompt: string;
  connectTo?: LinkTarget;
}>();
</script>
<template>
  <UiNextUp
    :kicker="connected ? $t('dashboard.waiting') : undefined"
    :title="$t('dashboard.first')"
    :why="connected ? $t('dashboard.sendPrompt') : $t('dashboard.start')"
    :prompt="connected ? prompt : undefined"
  >
    <template v-if="!connected" #actions>
      <UiButton variant="primary" icon="plug" :to="connectTo ?? '/onboarding/connect'">{{
        $t("dashboard.connect")
      }}</UiButton>
    </template>
  </UiNextUp>
</template>
