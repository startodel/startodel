<script setup lang="ts">
import { sampleUser, screenPath } from "../sample";
const props = defineProps<{ state?: string }>();
const filled = {
  goals: ["Understand internals"],
  stack: ["TypeScript", "SQL"],
  experience: "senior" as const,
  notes: "",
  yearsOfExperience: 8,
};
const busy = ref(false);
const localePath = useLocalePath();
function next() {
  busy.value = true;
  const target = localePath(screenPath(props.state === "edit" ? "settings" : "connect"));
  setTimeout(() => navigateTo(target), 500);
}
</script>
<template>
  <UiFocusLayout :home="screenPath('landing')" :user="sampleUser">
    <div class="s-stack" style="--s-gap: var(--s-8)">
      <UiFocusHeader
        :kicker="state === 'edit' ? undefined : $t('onboarding.step', { n: 1, total: 2 })"
        :title="$t('onboarding.about')"
        :lead="$t('onboarding.lead')"
      />
      <UiQuestionnaire
        :initial="state === 'filled' || state === 'edit' ? filled : undefined"
        :busy="busy"
        :edit="state === 'edit'"
        :checked="state === 'errors'"
        @submit="next"
      />
    </div>
    <template #footer>{{ $t("onboarding.privacy") }}</template>
  </UiFocusLayout>
</template>
