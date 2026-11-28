<script setup lang="ts">
import type { CodeToken } from "../../utils/code-tokens";
import { lineDiff, textLines, type DiffLine } from "../../utils/line-diff";
/**
 * A Lesson Block that compares two versions of one snippet. The split view shows each version
 * whole, side by side in a wide container. The unified view lists removed lines, then added ones.
 * A language of "text" compares prose line by line in the reading voice.
 */
const props = withDefaults(
  defineProps<{
    before: string;
    after: string;
    language?: string;
    /** bad-good judges the two sides and marks them with a cross and a check. */
    mode?: "before-after" | "bad-good";
    beforeTitle?: string;
    afterTitle?: string;
    /** Markdown shown under the comparison. */
    explanation?: string;
    /** Offer the switch between the split and the unified view. */
    switcher?: boolean;
  }>(),
  { language: "text", mode: "before-after", switcher: true },
);
const view = defineModel<"split" | "unified">("view", { default: "split" });
const { t } = useI18n();
const { state, copy } = useCopy();
type Side = "before" | "after";
const prose = computed(() => props.language === "text");
const words = computed(() =>
  props.mode === "bad-good"
    ? { before: t("lessonDiff.bad"), after: t("lessonDiff.good") }
    : { before: t("lessonDiff.before"), after: t("lessonDiff.after") },
);
const views = computed(() => [
  { id: "split" as const, label: t("lessonDiff.split") },
  { id: "unified" as const, label: t("lessonDiff.unified") },
]);

const tokens = shallowRef<Record<Side, CodeToken[][]>>();
onMounted(() =>
  watchEffect(async (onCleanup) => {
    const { before, after, language } = props;
    let current = true;
    onCleanup(() => (current = false));
    if (language === "text") {
      tokens.value = undefined;
      return;
    }
    try {
      const { codeTokens } = await import("../../utils/code-tokens");
      const [a, b] = await Promise.all(
        [before, after].map((code) => codeTokens(textLines(code).join("\n"), language)),
      );
      if (current) tokens.value = { before: a!, after: b! };
    } catch {
      if (current) tokens.value = undefined;
    }
  }),
);

const diff = computed(() => lineDiff(props.before, props.after));
const row = (line: DiffLine, side: Side) => ({
  type: line.type,
  text: line.text,
  tokens: tokens.value?.[side][line[side]!],
});
const panes = computed(() => {
  const title = { before: props.beforeTitle, after: props.afterTitle };
  const head = (side: Side) => ({ side, word: words.value[side], title: title[side] });
  if (view.value === "unified")
    return [
      {
        id: "unified",
        label: t("lessonDiff.label", words.value),
        sides: [head("before"), head("after")],
        rows: diff.value.map((line) => row(line, line.type === "added" ? "after" : "before")),
      },
    ];
  return (["before", "after"] as const).map((side) => ({
    id: side,
    label: words.value[side],
    sides: [head(side)],
    rows: diff.value
      .filter((line) => line.type !== (side === "before" ? "added" : "removed"))
      .map((line) => row(line, side)),
  }));
});
</script>
<template>
  <div class="s-diff" :class="['s-diff--' + view, 's-diff--' + mode, { 's-diff--prose': prose }]">
    <div class="s-diff__plate" role="group" :aria-label="t('lessonDiff.label', words)">
      <div v-if="!prose || switcher" class="s-diff__bar">
        <span v-if="!prose" class="s-diff__lang">{{ language }}</span>
        <UiSegmented
          v-if="switcher"
          v-model="view"
          class="s-diff__switch"
          size="sm"
          :label="t('lessonDiff.view')"
          :options="views"
        />
      </div>
      <div class="s-diff__panes">
        <section v-for="pane in panes" :key="pane.id" class="s-diff__pane" :aria-label="pane.label">
          <header class="s-diff__head">
            <span
              v-for="side in pane.sides"
              :key="side.side"
              class="s-diff__side"
              :class="'s-diff__side--' + side.side"
            >
              <span class="s-diff__word">
                <span v-if="view === 'unified'" class="s-diff__sign" aria-hidden="true">{{
                  side.side === "before" ? "−" : "+"
                }}</span>
                <UiIcon
                  v-if="mode === 'bad-good'"
                  :name="side.side === 'before' ? 'x' : 'check'"
                  :size="12"
                />{{ side.word }}</span
              >
              <span v-if="side.title" class="s-diff__title">{{ side.title }}</span>
            </span>
            <button
              v-if="pane.id !== 'before'"
              type="button"
              class="s-diff__copy"
              :aria-label="t('lessonDiff.copy', { side: words.after })"
              @click="copy(after)"
            >
              <UiIcon :name="state === 'copied' ? 'check' : 'copy'" :size="14" />
              <span role="status">{{
                state === "copied"
                  ? t("common.copied")
                  : state === "failed"
                    ? t("ui.copyManual")
                    : t("ui.copy")
              }}</span>
            </button>
          </header>
          <pre
            class="s-diff__pre"
            tabindex="0"
          ><code class="s-diff__code"><span v-for="(line, i) in pane.rows" :key="i" class="s-diff__line" :class="'is-' + line.type"><span v-if="line.type !== 'same'" class="s-sr">{{ line.type === "removed" ? t("lessonDiff.removed") : t("lessonDiff.added") }} </span><span class="s-diff__text"><template v-if="line.tokens"><span v-for="(token, j) in line.tokens" :key="j" :style="{ color: token.color, fontStyle: token.italic ? 'italic' : undefined }">{{ token.content }}</span></template><template v-else>{{ line.text }}</template></span></span></code></pre>
        </section>
      </div>
    </div>
    <UiProse v-if="explanation" :markdown="explanation" size="sm" />
  </div>
</template>
<style scoped>
.s-diff {
  --shiki-foreground: var(--s-code-text);
  --shiki-token-comment: var(--s-code-comment);
  --shiki-token-keyword: var(--s-code-keyword);
  --shiki-token-string: var(--s-code-string);
  --shiki-token-string-expression: var(--s-code-string);
  --shiki-token-constant: var(--s-code-constant);
  --shiki-token-function: var(--s-code-function);
  --shiki-token-parameter: var(--s-code-parameter);
  --shiki-token-punctuation: var(--s-code-punctuation);
  --shiki-token-link: var(--s-code-constant);
  container: s-diff / inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  min-width: 0;
}
.s-diff__plate {
  min-width: 0;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-code-bg);
  overflow: hidden;
}
.s-diff__bar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: 2.25rem;
  padding: 0 var(--s-1) 0 var(--s-3);
  border-bottom: 1px solid var(--s-line);
  background: var(--s-surface);
}
.s-diff__lang,
.s-diff__head {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-diff__lang {
  color: var(--s-copper);
}
.s-diff .s-diff__switch {
  margin-left: auto;
}
.s-diff__panes {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.s-diff__pane {
  min-width: 0;
}
.s-diff__pane + .s-diff__pane {
  border-top: 1px solid var(--s-line);
}
@container s-diff (min-width: 46rem) {
  .s-diff--split .s-diff__panes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .s-diff--split .s-diff__pane + .s-diff__pane {
    border-top: 0;
    border-left: 1px solid var(--s-line);
  }
}
.s-diff__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-4);
  min-height: 2rem;
  padding: var(--s-1) var(--s-2) var(--s-1) 0;
}
.s-diff__side {
  display: inline-flex;
  align-items: baseline;
  gap: var(--s-2);
  min-width: 0;
  padding-left: var(--s-3);
}
.s-diff__word {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font-weight: 600;
  color: var(--s-ink-2);
}
.s-diff--bad-good .s-diff__side--before .s-diff__word,
.s-diff__side--before .s-diff__sign {
  color: var(--s-oxide);
}
.s-diff--bad-good .s-diff__side--after .s-diff__word,
.s-diff__side--after .s-diff__sign {
  color: var(--s-verdigris);
}
.s-diff__sign {
  font-stretch: 87.5%;
  font-size: var(--s-text-sm);
  letter-spacing: 0;
}
.s-diff__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0;
  text-transform: none;
}
.s-diff__copy {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 1.5rem;
  margin-left: auto;
  padding: 0 var(--s-2);
  border-radius: var(--s-radius-xs);
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: var(--s-ink-3);
}
.s-diff__copy:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-diff__pre {
  padding: var(--s-2) 0 var(--s-3);
  overflow-x: auto;
  color: var(--s-code-text);
  font: 400 var(--s-text-sm) / 1.7 var(--s-font-mono);
  font-stretch: 87.5%;
  font-variant-ligatures: none;
  tab-size: 2;
}
.s-diff__pre:focus-visible {
  outline-offset: -2px;
}
/* A code element takes the browser's monospace family unless it is told to inherit. */
.s-diff__code {
  display: grid;
  font: inherit;
  width: max-content;
  min-width: 100%;
}
.s-diff__line {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr);
  min-height: 1lh;
  background: var(--s-code-bg);
}
/* The gutter stays in view while a long line scrolls under it. */
.s-diff__line::before {
  content: "";
  position: sticky;
  left: 0;
  background: inherit;
  text-align: center;
  user-select: none;
}
.s-diff__line.is-removed {
  background: var(--s-oxide-soft);
}
.s-diff__line.is-removed::before {
  content: "−";
  box-shadow: inset 2px 0 0 var(--s-oxide);
  color: var(--s-oxide);
}
.s-diff__line.is-added {
  background: var(--s-verdigris-soft);
}
.s-diff__line.is-added::before {
  content: "+";
  box-shadow: inset 2px 0 0 var(--s-verdigris);
  color: var(--s-verdigris);
}
.s-diff__text {
  padding-right: var(--s-4);
}
.s-diff--prose .s-diff__pre {
  font: 400 var(--s-text-lg) / 1.6 var(--s-font-read);
  font-stretch: normal;
  font-variant-ligatures: common-ligatures;
  white-space: pre-wrap;
}
.s-diff--prose .s-diff__code {
  width: auto;
}
.s-diff--prose .s-diff__line {
  padding-block: 0.1875rem;
}
.s-diff--prose .s-diff__line::before {
  font-family: var(--s-font-mono);
  font-size: var(--s-text-sm);
  line-height: calc(var(--s-text-lg) * 1.6);
}
.s-diff--prose .s-diff__text {
  overflow-wrap: anywhere;
}
</style>
