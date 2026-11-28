<script setup lang="ts">
import { specimenEmailActions } from "../signin";
defineProps<{ state?: string }>();
</script>
<template>
  <UiFocusLayout
    ><template #actions><UiLanguageSwitcher /></template>
    <UiSignInPanel
      :actions="state === 'unavailable' ? undefined : specimenEmailActions"
      github-href="#github"
      :initial="state === 'code' ? { id: 'sample', email: 'learner@example.org' } : undefined"
      :link-state="state === 'expired' ? 'error' : undefined"
      :message="state === 'expired' ? $t('signin.expired') : undefined"
    />
  </UiFocusLayout>
</template>
