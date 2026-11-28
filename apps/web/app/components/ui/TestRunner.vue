<script setup lang="ts">
import type { TestCase } from "./practice";
/** The result panel of a sandboxed test run. The run either finished with results or did not start. */
const props = withDefaults(
  defineProps<{
    /** `done` reads as passed or failed from the results of the tests. */
    state?: "idle" | "running" | "done" | "error";
    tests?: TestCase[];
    /** Where the code runs, such as "JavaScript · Web Worker". */
    runtime?: string;
    /** Why the code did not run: a syntax error or a timeout. */
    error?: string;
  }>(),
  { state: "idle", tests: () => [] },
);
const { t, locale } = useI18n();

const passed = computed(() => props.tests.filter((test) => test.result === "passed").length);
const outcome = computed(() => {
  if (props.state !== "done") return props.state;
  return passed.value === props.tests.length ? "passed" : "failed";
});
const status = computed(() => {
  if (outcome.value === "idle") return t("testRunner.notRun");
  if (outcome.value === "running") return t("testRunner.running");
  if (outcome.value === "error") return t("testRunner.error");
  return t("testRunner.tally", { passed: passed.value, total: props.tests.length });
});

const duration = computed(() => {
  const ms = new Intl.NumberFormat(locale.value, {
    style: "unit",
    unit: "millisecond",
    maximumFractionDigits: 0,
  });
  const s = new Intl.NumberFormat(locale.value, {
    style: "unit",
    unit: "second",
    maximumFractionDigits: 1,
  });
  return (value: number) => (value < 1000 ? ms.format(value) : s.format(value / 1000));
});
const rows = computed(() =>
  props.tests.map((test) => {
    const result = props.state === "done" ? test.result : undefined;
    return {
      ...test,
      result,
      verdict: result === "passed" ? "strong" : result === "failed" ? "weak" : "pending",
      word:
        result === "passed"
          ? t("testRunner.passed")
          : result === "failed"
            ? t("testRunner.failed")
            : props.state === "running"
              ? t("testRunner.waiting")
              : t("testRunner.skipped"),
      time: result && test.durationMs !== undefined ? duration.value(test.durationMs) : undefined,
      detail:
        result === "failed" &&
        (test.message !== undefined || test.expected !== undefined || test.received !== undefined),
    } as const;
  }),
);

// The first failure opens by itself: it is what the learner fixes first.
const opened = ref<Record<string, boolean>>({});
const firstFailed = computed(() => rows.value.find((row) => row.detail)?.id);
watch(
  () => props.state,
  () => (opened.value = {}),
);
</script>
<template>
  <section class="s-runner" :class="'is-' + outcome" :aria-label="t('testRunner.label')">
    <header class="s-runner__head">
      <div class="s-runner__summary">
        <p class="s-runner__status" role="status">
          <UiPending v-if="outcome === 'running'" />
          <UiIcon v-else-if="outcome === 'error'" name="alert" :size="14" />
          <UiVerdict
            v-else
            :verdict="outcome === 'passed' ? 'strong' : outcome === 'failed' ? 'weak' : 'pending'"
            glyph-only
            aria-hidden="true"
          />
          <span>{{ status }}</span>
        </p>
        <UiBadge v-if="runtime" variant="outline">{{ runtime }}</UiBadge>
      </div>
      <div v-if="$slots.actions" class="s-runner__actions"><slot name="actions" /></div>
    </header>
    <p v-if="outcome === 'idle'" class="s-runner__hint">{{ t("testRunner.idle") }}</p>
    <div v-if="outcome === 'error'" class="s-runner__error">
      <p>{{ t("testRunner.errorText") }}</p>
      <pre v-if="error" class="s-runner__output" tabindex="0">{{ error }}</pre>
    </div>
    <ol v-if="rows.length" class="s-runner__tests">
      <li v-for="row in rows" :key="row.id" class="s-runner__test" :class="'is-' + row.verdict">
        <UiVerdict class="s-runner__pad" :verdict="row.verdict" glyph-only aria-hidden="true" />
        <span class="s-runner__name">{{ row.name }}</span>
        <span class="s-runner__result"
          ><span class="s-runner__word">{{ row.word }}</span
          ><template v-if="row.time"> · {{ row.time }}</template></span
        >
        <UiCollapsible
          v-if="row.detail"
          class="s-runner__detail"
          :title="t('testRunner.detail')"
          :open="opened[row.id] ?? row.id === firstFailed"
          @update:open="opened[row.id] = $event"
        >
          <p v-if="row.message" class="s-runner__message">{{ row.message }}</p>
          <dl v-if="row.expected !== undefined || row.received !== undefined">
            <template v-if="row.expected !== undefined">
              <dt>{{ t("testRunner.expected") }}</dt>
              <dd>
                <pre class="s-runner__output" tabindex="0">{{ row.expected }}</pre>
              </dd>
            </template>
            <template v-if="row.received !== undefined">
              <dt>{{ t("testRunner.received") }}</dt>
              <dd>
                <pre class="s-runner__output is-received" tabindex="0">{{ row.received }}</pre>
              </dd>
            </template>
          </dl>
        </UiCollapsible>
      </li>
    </ol>
  </section>
</template>
<style>
.s-root .s-runner {
  container: s-runner / inline-size;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-surface);
}
.s-root .s-runner__head {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-1) var(--s-1) var(--s-1) var(--s-3);
}
.s-root .s-runner__summary {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-3);
  min-height: var(--s-control-sm);
  padding: var(--s-1) var(--s-2) var(--s-1) 0;
}
.s-root .s-runner__status {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin-right: auto;
  color: var(--s-ink-2);
  font: 600 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-root .s-runner.is-passed .s-runner__status {
  color: var(--s-verdigris);
}
.s-root .s-runner.is-failed .s-runner__status,
.s-root .s-runner.is-error .s-runner__status {
  color: var(--s-oxide);
}
.s-root .s-runner.is-running .s-runner__status {
  color: var(--s-copper);
}
.s-root .s-runner__actions {
  display: flex;
  gap: var(--s-1);
}
.s-root .s-runner__hint,
.s-root .s-runner__error {
  padding: var(--s-3);
  border-top: 1px solid var(--s-line);
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-root .s-runner__error {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-2);
}
.s-root .s-runner__tests {
  border-top: 1px solid var(--s-line);
}
.s-root .s-runner__test {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: baseline;
  gap: var(--s-1) var(--s-3);
  padding: var(--s-2) var(--s-3);
  font-size: var(--s-text-sm);
}
.s-root .s-runner__test + .s-runner__test {
  border-top: 1px solid var(--s-line);
}
/* The pad stays on the first line of a name that wraps. */
.s-root .s-runner__test .s-runner__pad {
  align-self: start;
  height: calc(var(--s-text-sm) * 1.45);
}
.s-root .s-runner__name {
  overflow-wrap: anywhere;
  line-height: 1.45;
  color: var(--s-ink);
}
.s-root .s-runner__test.is-pending .s-runner__name {
  color: var(--s-ink-2);
}
.s-root .s-runner__result {
  color: var(--s-ink-3);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.s-root .s-runner__test.is-strong .s-runner__word {
  color: var(--s-verdigris);
}
.s-root .s-runner__test.is-weak .s-runner__word {
  color: var(--s-oxide);
}
@container s-runner (max-width: 26rem) {
  .s-root .s-runner__result {
    grid-column: 2;
  }
}
.s-root .s-runner__test .s-runner__detail {
  grid-column: 2 / -1;
  margin: var(--s-1) 0;
  background: transparent;
}
.s-root .s-runner__detail .s-collapsible__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  padding: var(--s-3);
}
.s-root .s-runner__message {
  overflow-wrap: anywhere;
  font: 400 var(--s-text-xs) / 1.5 var(--s-font-mono);
  font-stretch: 87.5%;
  color: var(--s-ink);
}
.s-root .s-runner__detail dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-1);
}
.s-root .s-runner__detail dt {
  color: var(--s-ink-3);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-root .s-runner__detail dd + dt {
  margin-top: var(--s-2);
}
.s-root .s-runner__output {
  overflow-x: auto;
  padding: var(--s-2) var(--s-3);
  border-radius: var(--s-radius-xs);
  box-shadow: inset 2px 0 0 var(--s-verdigris);
  background: var(--s-code-bg);
  color: var(--s-code-text);
  font: 400 var(--s-text-xs) / 1.6 var(--s-font-mono);
  font-stretch: 87.5%;
  tab-size: 2;
}
.s-root .s-runner__output.is-received,
.s-root .s-runner__error .s-runner__output {
  box-shadow: inset 2px 0 0 var(--s-oxide);
}
.s-root .s-runner__error .s-runner__output {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.s-root .s-runner__output:focus-visible {
  outline: 2px solid var(--s-focus);
  outline-offset: -2px;
}
</style>
