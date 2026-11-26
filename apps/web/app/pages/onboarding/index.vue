<script setup lang="ts">
definePageMeta({ layout: "focus" });
const localePath = useLocalePath();
const { t } = useI18n();
useHead({ title: t("onboarding.title") });
const profile = useMe().value?.profile;
const stack = ref(profile?.stack ?? []);
const goals = ref(profile?.goals ?? []);
const goalLabels = useGoalLabels();
const notes = ref(profile?.notes ?? "");
const years = ref(profile?.yearsOfExperience?.toString() ?? "");
const invalidYears = computed(
  () => !!years.value.trim() && (!/^\d+$/.test(years.value.trim()) || Number(years.value) > 60),
);
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
  if (invalidYears.value) {
    message.value = t("onboarding.yearsRange");
    return;
  }
  busy.value = true;
  message.value = "";
  try {
    await $fetch("/api/profile/questionnaire", {
      method: "PUT",
      body: {
        stack: stack.value,
        goals: goals.value,
        experience: grade.value,
        ...(notes.value !== (profile?.notes ?? "") && { notes: notes.value.trim() || null }),
        ...(years.value !== (profile?.yearsOfExperience?.toString() ?? "") && {
          yearsOfExperience: years.value.trim() ? Number(years.value) : null,
        }),
      },
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
  <form class="s-stack" style="--s-gap: var(--s-8)" @submit.prevent="submit">
    <header class="s-stack" style="--s-gap: var(--s-3)">
      <p class="s-label">
        {{ $t("onboarding.title") }} · {{ $n(steps.findIndex((s) => s.id === step) + 1) }} /
        {{ $n(steps.length) }}
      </p>
      <h1 class="s-title">
        {{
          step === "stack"
            ? $t("onboarding.stack")
            : step === "goals"
              ? $t("onboarding.goal")
              : $t("onboarding.grade")
        }}
      </h1>
      <p class="lead">{{ $t("onboarding.intro") }}</p>
    </header>
    <UiStepper v-model="step" :steps="steps" />
    <div v-if="step === 'stack'" class="s-stack">
      <UiChoiceChips
        v-model="stack"
        :legend="$t('onboarding.stackStep')"
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
        :legend="$t('onboarding.goalsStep')"
        name="goals"
        multiple
        :options="goalOptions"
      />
      <UiField :label="$t('onboarding.goals')"
        ><UiTagInput :max-length="Infinity" @add="goals = [...new Set([...goals, ...$event])]"
      /></UiField>
      <UiField :label="$t('onboarding.notes')" optional :hint="$t('onboarding.notesHint')"
        ><UiTextarea v-model="notes" :rows="3"
      /></UiField>
    </div>
    <section v-else class="s-stack">
      <UiRadioGroup
        v-model="grade"
        :label="$t('onboarding.grade')"
        name="grade"
        variant="cards"
        :options="grades"
      />
      <UiField
        :label="$t('onboarding.years')"
        optional
        :error="invalidYears ? $t('onboarding.yearsRange') : undefined"
      >
        <UiInput v-model="years" inputmode="numeric" mono class="years" />
      </UiField>
    </section>
    <UiNotice v-if="message" tone="danger" :title="message" />
    <footer class="actions-row">
      <UiButton
        v-if="step !== 'stack'"
        icon="arrow-left"
        :disabled="busy"
        @click="step = step === 'grade' ? 'goals' : 'stack'"
        >{{ $t("onboarding.back") }}</UiButton
      >
      <span class="summary">{{
        $t("onboarding.summary", { stack: $n(stack.length), goals: $n(goals.length) })
      }}</span>
      <UiButton type="submit" variant="primary" icon-right="arrow-right" :loading="busy">{{
        step === "grade" ? $t("onboarding.continue") : $t("onboarding.forward")
      }}</UiButton>
    </footer>
  </form>
</template>
<style scoped>
.lead {
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3);
  padding-top: var(--s-5);
  border-top: 1px solid var(--s-line);
}
.summary {
  margin-left: auto;
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.years {
  max-width: 8rem;
}
</style>
