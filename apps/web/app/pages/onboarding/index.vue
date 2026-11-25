<script setup lang="ts">
const localePath = useLocalePath();
const { t } = useI18n();
useHead({ title: t("onboarding.title") });
const profile = useMe().value?.profile;
const stack = ref(profile?.stack ?? []);
const goals = ref(profile?.goals ?? []);
const goalLabels = computed<Record<string, string>>(() => ({
  "Prepare for interviews": t("onboarding.interviews"),
  "Get better at my current job": t("onboarding.job"),
  "Learn a new technology": t("onboarding.technology"),
  "Understand internals": t("onboarding.internals"),
}));
const grade = ref(profile?.experience ?? null);
const busy = ref(false);
const message = ref("");
async function submit() {
  if (!stack.value.length || !goals.value.length || !grade.value) {
    message.value = t("onboarding.required");
    return;
  }
  busy.value = true;
  message.value = "";
  try {
    await $fetch("/api/profile/questionnaire", {
      method: "PUT",
      body: { stack: stack.value, goals: goals.value, experience: grade.value },
    });
    await navigateTo(localePath("/onboarding/connect"));
  } catch {
    message.value = t("onboarding.error");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main class="narrow">
    <h1>{{ $t("onboarding.profile") }}</h1>
    <p class="muted">{{ $t("onboarding.intro") }}</p>
    <form @submit.prevent="submit" class="panel questionnaire">
      <QuestionChoices
        v-model="stack"
        :question="$t('onboarding.stack')"
        :label="$t('onboarding.technologies')"
        :presets="[
          $t('technology.typescript'),
          $t('technology.javascript'),
          $t('technology.react'),
          $t('technology.nextjs'),
          $t('technology.vue'),
          $t('technology.nuxt'),
          $t('technology.nodejs'),
          $t('technology.python'),
          $t('technology.go'),
          $t('technology.rust'),
        ]"
      />
      <QuestionChoices
        v-model="goals"
        :question="$t('onboarding.goal')"
        :label="$t('onboarding.goals')"
        :presets="Object.keys(goalLabels)"
        :labels="goalLabels"
      />
      <fieldset>
        <legend>{{ $t("onboarding.grade") }}</legend>
        <div class="choices">
          <label v-for="value in ['junior', 'middle', 'senior', 'lead']" :key="value" class="choice"
            ><input required type="radio" v-model="grade" :value="value" name="grade" />{{
              $t(`grade.${value}`)
            }}</label
          >
        </div>
      </fieldset>
      <div>
        <button class="primary" :disabled="busy">{{ $t("onboarding.continue") }}</button>
        <p v-if="message" role="alert">{{ message }}</p>
      </div>
    </form>
  </main>
</template>
<style scoped>
.questionnaire {
  display: grid;
  gap: 1.6rem;
}
.questionnaire fieldset + fieldset {
  border-top: 1px solid var(--line);
  padding-top: 0.5rem;
}
</style>
