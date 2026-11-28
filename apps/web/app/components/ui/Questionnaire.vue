<script setup lang="ts">
import type { ProfileQuestionnaire } from "@startodel/core";
type Grade = NonNullable<ProfileQuestionnaire["experience"]>;
export type QuestionnaireAnswers = {
  stack: string[];
  goals: string[];
  experience: Grade;
  notes: string;
  yearsOfExperience: number | null;
};
/**
 * The Onboarding Questionnaire as one short form: goals, what the learner already knows and how
 * experienced they are. Notes and years are optional and stay folded until asked for.
 */
const props = defineProps<{
  initial?: Partial<
    Pick<ProfileQuestionnaire, "stack" | "goals" | "experience" | "notes" | "yearsOfExperience">
  >;
  busy?: boolean;
  /** Why the last save failed. */
  error?: string;
  /** The Owner has answered before, so the form saves and does not lead on. */
  edit?: boolean;
  /** Opens with the answers already checked. A specimen uses it to show the errors. */
  checked?: boolean;
}>();
const emit = defineEmits<{ submit: [answers: QuestionnaireAnswers] }>();
const { t } = useI18n();
const goalLabels = useGoalLabels();
const goals = ref([...(props.initial?.goals ?? [])]);
const stack = ref([...(props.initial?.stack ?? [])]);
const grade = ref<Grade | undefined>(props.initial?.experience ?? undefined);
const notes = ref(props.initial?.notes ?? "");
const years = ref(props.initial?.yearsOfExperience?.toString() ?? "");
const more = ref(Boolean(notes.value || years.value));
const tried = ref(Boolean(props.checked));
const summary = useTemplateRef("summary");
const goalOptions = computed(() =>
  [...new Set([...goalLabels.value.keys(), ...goals.value])].map((value) => ({
    value,
    label: goalLabels.value.get(value) ?? value,
  })),
);
const stackOptions = computed(() => [
  ...new Set([
    t("skill.python"),
    t("skill.javascript"),
    t("skill.typescript"),
    t("skill.sql"),
    t("skill.excel"),
    t("skill.analytics"),
    t("skill.design"),
    t("skill.marketing"),
    t("skill.projects"),
    t("skill.scratch"),
    ...stack.value,
  ]),
]);
const levels = computed(() => [
  { value: "junior" as const, label: t("onboarding.levelJunior"), hint: t("grade.junior") },
  { value: "middle" as const, label: t("onboarding.levelMiddle"), hint: t("grade.middle") },
  { value: "senior" as const, label: t("onboarding.levelSenior"), hint: t("grade.senior") },
  { value: "lead" as const, label: t("onboarding.levelLead"), hint: t("grade.lead") },
]);
const invalidYears = computed(
  () => !!years.value.trim() && (!/^\d+$/.test(years.value.trim()) || Number(years.value) > 60),
);
const errors = computed(() =>
  [
    { field: "onboarding-goals", message: t("onboarding.needGoal"), on: !goals.value.length },
    { field: "onboarding-stack", message: t("onboarding.needStack"), on: !stack.value.length },
    { field: "onboarding-grade", message: t("onboarding.needGrade"), on: !grade.value },
    { field: "onboarding-years", message: t("onboarding.yearsRange"), on: invalidYears.value },
  ].filter((e) => e.on),
);
const shown = computed(() => (tried.value ? errors.value : []));
const errorOf = (field: string) => shown.value.find((e) => e.field === field)?.message;
async function submit() {
  if (props.busy) return;
  tried.value = true;
  if (errors.value.length || !grade.value) {
    if (invalidYears.value) more.value = true;
    await nextTick();
    summary.value?.focus();
    return;
  }
  emit("submit", {
    stack: stack.value,
    goals: goals.value,
    experience: grade.value,
    notes: notes.value.trim(),
    yearsOfExperience: years.value.trim() ? Number(years.value) : null,
  });
}
</script>
<template>
  <form class="s-questionnaire" novalidate @submit.prevent="submit">
    <UiFormErrors ref="summary" :errors="shown" />
    <UiQuestion
      id="onboarding-goals"
      :title="t('onboarding.goal')"
      :hint="t('onboarding.goalHint')"
      :error="errorOf('onboarding-goals')"
    >
      <UiChoiceChips
        v-model="goals"
        :legend="t('onboarding.goal')"
        hide-legend
        name="goals"
        multiple
        :options="goalOptions"
      />
      <UiTagInput
        :aria-label="t('onboarding.goals')"
        :placeholder="t('onboarding.goals')"
        :max-length="Infinity"
        @add="goals = [...new Set([...goals, ...$event])]"
      />
    </UiQuestion>
    <UiQuestion
      id="onboarding-stack"
      :title="t('onboarding.stack')"
      :hint="t('onboarding.stackHint')"
      :error="errorOf('onboarding-stack')"
    >
      <UiChoiceChips
        v-model="stack"
        :legend="t('onboarding.stack')"
        hide-legend
        name="stack"
        multiple
        :options="stackOptions"
      />
      <UiTagInput
        :aria-label="t('onboarding.technologies')"
        :placeholder="t('onboarding.ownSkill')"
        :max-length="Infinity"
        @add="stack = [...new Set([...stack, ...$event])]"
      />
    </UiQuestion>
    <UiQuestion
      id="onboarding-grade"
      :title="t('onboarding.grade')"
      :error="errorOf('onboarding-grade')"
    >
      <UiRadioGroup
        v-model="grade"
        :label="t('onboarding.grade')"
        name="grade"
        variant="cards"
        :options="levels"
        style="--s-radio-card: 15rem"
      />
    </UiQuestion>
    <UiCollapsible v-model:open="more" :title="t('onboarding.more')" keep-mounted>
      <div class="s-questionnaire__more">
        <UiField :label="t('onboarding.notes')" optional :hint="t('onboarding.notesHint')"
          ><UiTextarea v-model="notes" :rows="3"
        /></UiField>
        <UiField
          :label="t('onboarding.years')"
          for="onboarding-years"
          optional
          :error="errorOf('onboarding-years')"
        >
          <div class="s-questionnaire__years">
            <UiInput id="onboarding-years" v-model="years" inputmode="numeric" mono />
          </div>
        </UiField>
      </div>
    </UiCollapsible>
    <UiNotice v-if="error" tone="danger" :title="error" />
    <div class="s-questionnaire__foot">
      <UiButton
        type="submit"
        variant="primary"
        size="lg"
        :icon-right="edit ? undefined : 'arrow-right'"
        :loading="busy"
        >{{ edit ? t("onboarding.save") : t("onboarding.forward") }}</UiButton
      >
    </div>
  </form>
</template>
<style scoped>
.s-questionnaire {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-8);
}
.s-questionnaire__more {
  display: grid;
  gap: var(--s-5);
}
.s-questionnaire__years {
  max-width: 8rem;
}
.s-questionnaire__foot {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--s-5);
  border-top: 1px solid var(--s-line);
}
</style>
