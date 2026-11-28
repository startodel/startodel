<script setup lang="ts">
import type { QuestionnaireAnswers } from "../../components/ui/Questionnaire.vue";
definePageMeta({ layout: "focus" });
const localePath = useLocalePath();
const { t, n } = useI18n();
useHead({ title: t("onboarding.title") });
const account = useMe().value;
const profile = account?.profile;
const edit = Boolean(account?.onboarded);
const busy = ref(false);
const message = ref("");
async function submit(answers: QuestionnaireAnswers) {
  if (busy.value) return;
  busy.value = true;
  message.value = "";
  try {
    await $fetch("/api/profile/questionnaire", {
      method: "PUT",
      body: {
        stack: answers.stack,
        goals: answers.goals,
        experience: answers.experience,
        ...(answers.notes !== (profile?.notes ?? "") && { notes: answers.notes || null }),
        ...(answers.yearsOfExperience !== (profile?.yearsOfExperience ?? null) && {
          yearsOfExperience: answers.yearsOfExperience,
        }),
      },
    });
    await navigateTo(localePath(edit ? "/settings" : "/onboarding/connect"));
  } catch {
    message.value = t("onboarding.error");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="s-stack" style="--s-gap: var(--s-8)">
    <UiFocusHeader
      :kicker="edit ? undefined : t('onboarding.step', { n: n(1), total: n(2) })"
      :title="t('onboarding.about')"
      :lead="t('onboarding.lead')"
    />
    <UiQuestionnaire
      :initial="profile"
      :busy="busy"
      :error="message"
      :edit="edit"
      @submit="submit"
    />
  </div>
</template>
