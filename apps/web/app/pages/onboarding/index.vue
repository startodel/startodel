<script setup lang="ts">
definePageMeta({ layout: "focus" });
const localePath = useLocalePath();
const { t } = useI18n();
useHead({ title: t("onboarding.title") });
const profile = useMe().value?.profile;
const stack = ref(profile?.stack ?? []);
const goals = ref(profile?.goals ?? []);
const goalLabels = useGoalLabels();
const grade = ref(profile?.experience ?? undefined);
const busy = ref(false);
const message = ref("");
const step = ref("stack");
const steps = computed(() => [
  { id: "stack", label: t("onboarding.stackStep") },
  { id: "goals", label: t("onboarding.goalsStep") },
  { id: "grade", label: t("onboarding.gradeStep") },
]);
const stackOptions = computed(() => [
  ...new Set([
    t("technology.typescript"),
    t("technology.javascript"),
    t("technology.react"),
    t("technology.nextjs"),
    t("technology.vue"),
    t("technology.nuxt"),
    t("technology.nodejs"),
    t("technology.python"),
    t("technology.go"),
    t("technology.rust"),
    ...stack.value,
  ]),
]);
const goalOptions = computed(() =>
  [...new Set([...goalLabels.value.keys(), ...goals.value])].map((value) => ({
    value,
    label: goalLabels.value.get(value) ?? value,
  })),
);
const grades = computed(() =>
  (["junior", "middle", "senior", "lead"] as const).map((value) => ({
    value,
    label: t(`grade.${value}`),
  })),
);
async function submit() {
  if (busy.value) return;
  message.value = "";
  if (step.value !== "grade") {
    if (step.value === "stack" ? !stack.value.length : !goals.value.length) {
      message.value = t("onboarding.required");
      return;
    }
    step.value = step.value === "stack" ? "goals" : "grade";
    return;
  }
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
  <form class="s-stack" @submit.prevent="submit">
    <UiPageHeader
      :kicker="$t('onboarding.title')"
      :title="$t('onboarding.profile')"
      :description="$t('onboarding.intro')"
    />
    <UiStepper v-model="step" :steps="steps" />
    <div v-if="step === 'stack'" class="s-stack">
      <UiChoiceChips
        v-model="stack"
        :legend="$t('onboarding.stack')"
        name="stack"
        multiple
        :options="stackOptions"
      />
      <UiField :label="$t('onboarding.technologies')"
        ><UiTagInput :max-length="Infinity" @add="stack = [...new Set([...stack, ...$event])]"
      /></UiField>
    </div>
    <div v-else-if="step === 'goals'" class="s-stack">
      <UiChoiceChips
        v-model="goals"
        :legend="$t('onboarding.goal')"
        name="goals"
        multiple
        :options="goalOptions"
      />
      <UiField :label="$t('onboarding.goals')"
        ><UiTagInput :max-length="Infinity" @add="goals = [...new Set([...goals, ...$event])]"
      /></UiField>
    </div>
    <section v-else class="s-stack">
      <UiSectionHeading :title="$t('onboarding.grade')" />
      <UiRadioGroup
        v-model="grade"
        :label="$t('onboarding.grade')"
        name="grade"
        variant="cards"
        :options="grades"
      />
    </section>
    <UiNotice v-if="message" tone="danger" :title="message" />
    <div class="s-cluster">
      <UiButton
        v-if="step !== 'stack'"
        icon="arrow-left"
        :disabled="busy"
        @click="step = step === 'grade' ? 'goals' : 'stack'"
        >{{ $t("onboarding.back") }}</UiButton
      >
      <UiButton type="submit" variant="primary" icon-right="arrow-right" :loading="busy">{{
        step === "grade" ? $t("onboarding.continue") : $t("onboarding.forward")
      }}</UiButton>
    </div>
  </form>
</template>
