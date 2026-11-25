<script setup lang="ts">
import { sampleGoalPresets, sampleGrades, sampleStackPresets, screenPath } from "../sample";
const props = defineProps<{ state?: string }>();
const steps = [
  { id: "stack", label: "Stack", hint: "What you work with" },
  { id: "goals", label: "Goals", hint: "What you want next" },
  { id: "grade", label: "Grade", hint: "Where you stand" },
];
const failed = props.state === "errors";
const step = ref(failed ? "grade" : (props.state ?? "stack"));
const stack = ref<string[]>(failed ? [] : ["TypeScript", "Node.js", "PostgreSQL"]);
const goals = ref<string[]>(["Go deeper in my stack"]);
const grade = ref<(typeof sampleGrades)[number]["value"] | undefined>(
  failed ? undefined : "senior",
);
const years = ref(failed ? "70" : "8");
const notes = ref("");
const stackOptions = computed(() => [...new Set([...sampleStackPresets, ...stack.value])]);
const goalOptions = computed(() => [...new Set([...sampleGoalPresets, ...goals.value])]);
const errors = computed(() =>
  failed
    ? [
        { field: "onb-stack", message: "Choose at least one technology in your stack" },
        { field: "onb-grade", message: "Choose your grade" },
        { field: "onb-years", message: "Years of experience must be between 0 and 60" },
      ]
    : [],
);
const at = computed(() => steps.findIndex((s) => s.id === step.value));
const busy = ref(false);
const localePath = useLocalePath();
function next() {
  if (at.value < steps.length - 1) step.value = steps[at.value + 1]!.id;
  else {
    busy.value = true;
    const target = localePath(screenPath("connect"));
    setTimeout(() => navigateTo(target), 500);
  }
}
</script>
<template>
  <UiFocusLayout :home="screenPath('landing')">
    <template #actions>
      <span class="who"><UiAvatar name="Alice Petrova" :size="24" />alice</span>
      <UiButton variant="ghost" size="sm" icon="logout" :to="screenPath('landing')"
        >Sign out</UiButton
      >
    </template>
    <form class="s-stack" style="--s-gap: var(--s-8)" novalidate @submit.prevent="next">
      <header class="s-stack" style="--s-gap: var(--s-3)">
        <p class="s-label">Onboarding Questionnaire · {{ at + 1 }} of 3</p>
        <h1 class="s-title">
          {{ ["What is in your stack?", "What do you want next?", "Where do you stand?"][at] }}
        </h1>
        <p class="lead">
          {{
            [
              "Your agent uses this to pick examples you already know. Choose all that apply.",
              "A Track is built around a goal. Pick one or more, or write your own.",
              "Lessons skip what your grade already covers. You can change this later.",
            ][at]
          }}
        </p>
      </header>

      <UiStepper v-model="step" :steps="steps" label="Onboarding steps" />

      <UiFormErrors v-if="errors.length" :errors="errors" />

      <div v-show="step === 'stack' || failed" class="s-stack" style="--s-gap: var(--s-4)">
        <UiChoiceChips
          id="onb-stack"
          v-model="stack"
          legend="Stack"
          name="stack"
          multiple
          :options="stackOptions"
        />
        <UiField
          label="Something else"
          for="onb-stack-extra"
          hint="Press Enter or a comma to add it."
          :error="failed ? 'Choose at least one technology in your stack' : undefined"
        >
          <UiTagInput
            id="onb-stack-extra"
            :invalid="failed"
            @add="stack = [...new Set([...stack, ...$event])]"
          />
        </UiField>
      </div>

      <div v-show="step === 'goals'" class="s-stack" style="--s-gap: var(--s-4)">
        <UiChoiceChips
          v-model="goals"
          legend="Goals"
          name="goals"
          multiple
          :options="goalOptions"
        />
        <UiField
          label="Another goal"
          for="onb-goal-extra"
          hint="For example: understand our Kafka outages."
        >
          <UiTagInput id="onb-goal-extra" @add="goals = [...new Set([...goals, ...$event])]" />
        </UiField>
        <UiField
          label="Notes for your agent"
          for="onb-notes"
          optional
          hint="Anything that helps it plan: a project, a deadline, a weak spot."
        >
          <UiTextarea id="onb-notes" v-model="notes" :rows="3" />
        </UiField>
      </div>

      <div v-show="step === 'grade'" class="s-stack" style="--s-gap: var(--s-5)">
        <UiField label="Grade" for="onb-grade" :error="failed ? 'Choose your grade' : undefined">
          <UiRadioGroup
            id="onb-grade"
            v-model="grade"
            label="Grade"
            name="grade"
            variant="cards"
            :options="sampleGrades"
          />
        </UiField>
        <UiField
          label="Years of experience"
          for="onb-years"
          optional
          :error="failed ? 'Enter a number between 0 and 60' : undefined"
        >
          <UiInput
            id="onb-years"
            v-model="years"
            inputmode="numeric"
            mono
            :invalid="failed"
            style="max-width: 8rem"
          />
        </UiField>
      </div>

      <footer class="actions-row">
        <UiButton v-if="at > 0" icon="arrow-left" @click="step = steps[at - 1]!.id">Back</UiButton>
        <span class="summary"
          >{{ stack.length }} in stack · {{ goals.length }}
          {{ goals.length === 1 ? "goal" : "goals" }}</span
        >
        <UiButton type="submit" variant="primary" icon-right="arrow-right" :loading="busy">
          {{ at === steps.length - 1 ? "Save and connect an agent" : "Continue" }}
        </UiButton>
      </footer>
    </form>
    <template #footer
      >Your answers are stored in your Profile. Only you and your agent can read them.</template
    >
  </UiFocusLayout>
</template>
<style scoped>
.who {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
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
</style>
