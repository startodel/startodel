<script setup lang="ts">
import { usePlannedSample } from "./sample-content";
const sample = usePlannedSample();
const practice = computed(() => sample.value.practice);
const allPassed = computed(() =>
  practice.value.tests.map(({ id, name, durationMs }) => ({
    id,
    name,
    durationMs,
    result: "passed" as const,
  })),
);

type Run = "idle" | "running" | "passed" | "failed" | "error";
const run = ref<Run>("idle");
const runStates = computed(() =>
  (["idle", "running", "passed", "failed", "error"] as const).map((id) => ({
    id,
    label: practice.value.states[id],
  })),
);
const save = ref<"saved" | "unsaved" | "saving">("saved");
const savedAt = ref("2026-11-28T12:04:00");
const editor = ref(0);

const outcomes = ["failed", "passed", "error"] as const;
let next = 0;
let running: ReturnType<typeof setTimeout> | undefined;
let saving: ReturnType<typeof setTimeout> | undefined;
function runTests() {
  clearTimeout(running);
  run.value = "running";
  running = setTimeout(() => (run.value = outcomes[next++ % outcomes.length]!), 1200);
}
function saveAttempt() {
  clearTimeout(saving);
  save.value = "saving";
  saving = setTimeout(() => {
    savedAt.value = new Date().toISOString();
    save.value = "saved";
  }, 800);
}
// The editor keeps its text to itself, so the specimen resets it by clearing its draft and remounting it.
function resetToStarter() {
  try {
    localStorage.removeItem("startodel:exercise:planned:workbench");
  } catch {
    // The remount alone restores the starter when storage is unavailable.
  }
  editor.value++;
  clearTimeout(running);
  run.value = "idle";
  save.value = "unsaved";
}
onBeforeUnmount(() => {
  clearTimeout(running);
  clearTimeout(saving);
});
</script>
<template>
  <ShowcaseSpecimen
    id="planned-workbench"
    label="Exercise workbench"
    note="Run the tests a few times: the specimen walks through failed, passed and an error. Type in the editor to see the unsaved state"
    layout="stack"
  >
    <div style="overflow-x: auto">
      <UiSegmented
        v-model="run"
        style="min-width: max-content"
        size="sm"
        :options="runStates"
        :label="practice.states.label"
      />
    </div>
    <UiExerciseWorkbench :save="save" :saved-at="savedAt">
      <template #editor>
        <div @input="save = 'unsaved'">
          <UiExerciseEditor
            :key="editor"
            :starter="practice.starter"
            language="javascript"
            lesson-id="planned"
            block-id="workbench"
          />
        </div>
      </template>
      <template #actions>
        <UiButton variant="primary" icon="play" :loading="run === 'running'" @click="runTests">{{
          practice.actions.run
        }}</UiButton>
        <UiButton :loading="save === 'saving'" @click="saveAttempt">{{
          practice.actions.save
        }}</UiButton>
        <UiButton variant="ghost" @click="resetToStarter">{{ practice.actions.reset }}</UiButton>
      </template>
      <template #results>
        <UiTestRunner
          :state="run === 'passed' || run === 'failed' ? 'done' : run"
          :tests="run === 'passed' ? allPassed : practice.tests"
          :runtime="practice.runtime"
          :error="practice.syntaxError"
        />
      </template>
    </UiExerciseWorkbench>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-workbench-status"
    label="Exercise workbench · the saved attempt"
    note="Saved, unsaved and saving each carry a shape and a word. Without results the editor takes the whole width"
    layout="grid"
  >
    <UiExerciseWorkbench save="saved" saved-at="2026-11-28T12:04:00">
      <template #editor>
        <UiCodeBlock :code="practice.attempt" language="javascript" />
      </template>
    </UiExerciseWorkbench>
    <UiExerciseWorkbench save="unsaved">
      <template #editor>
        <UiCodeBlock :code="practice.attempt" language="javascript" />
      </template>
    </UiExerciseWorkbench>
    <UiExerciseWorkbench save="saving">
      <template #editor>
        <UiCodeBlock :code="practice.attempt" language="javascript" />
      </template>
    </UiExerciseWorkbench>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-runner-idle"
    label="Test runner · idle and running"
    note="Before a run the panel says what to do. During a run every test waits with a dashed ring"
  >
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiTestRunner :runtime="practice.runtime" />
    </div>
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiTestRunner state="running" :tests="practice.tests" :runtime="practice.runtime" />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-runner-results"
    label="Test runner · passed and failed"
    note="A full pad passed, a hollow pad failed. The first failure opens by itself"
  >
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiTestRunner state="done" :tests="allPassed" :runtime="practice.runtime">
        <template #actions>
          <UiButton size="sm" variant="ghost">{{ practice.actions.again }}</UiButton>
        </template>
      </UiTestRunner>
    </div>
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiTestRunner state="done" :tests="practice.tests" :runtime="practice.runtime">
        <template #actions>
          <UiButton size="sm" variant="ghost">{{ practice.actions.again }}</UiButton>
        </template>
      </UiTestRunner>
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-runner-error"
    label="Test runner · the code did not run"
    note="A syntax error and a timeout stop the run before the first test"
  >
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiTestRunner
        state="error"
        :tests="practice.tests"
        :runtime="practice.runtime"
        :error="practice.syntaxError"
      />
    </div>
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiTestRunner
        state="error"
        :tests="practice.sqlTests"
        :runtime="practice.sqlRuntime"
        :error="practice.timeout"
      />
    </div>
  </ShowcaseSpecimen>
</template>
