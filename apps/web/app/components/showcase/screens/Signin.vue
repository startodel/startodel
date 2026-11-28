<script setup lang="ts">
import { specimenEmailActions } from "../signin";
const props = defineProps<{ state?: string }>();
const email = "learner@example.org";
const initial = computed(() => {
  switch (props.state) {
    case "code":
      return { id: "sample", email };
    case "wrong":
      return { id: "sample", email, failure: { reason: "wrong", remaining: 4 } };
    case "locked":
      return { id: "sample", email, failure: { reason: "locked" } };
    case "limited":
      return { email, failure: { reason: "limited" } };
    default:
      return undefined;
  }
});
</script>
<template>
  <UiFocusLayout
    ><template #actions><UiLanguageSwitcher /></template>
    <UiSignInPanel
      :actions="state === 'unavailable' ? undefined : specimenEmailActions"
      github-href="#github"
      :initial="initial"
      :link-state="state === 'expired' ? 'error' : state === 'verifying' ? 'pending' : undefined"
      :message="state === 'expired' ? $t('signin.expired') : undefined"
    />
  </UiFocusLayout>
</template>
