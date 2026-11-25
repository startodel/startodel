<script setup lang="ts">
import type { CodeToken } from "../../utils/code-tokens";
const props = withDefaults(
  defineProps<{ code: string; language?: string; title?: string; lineNumbers?: boolean }>(),
  { language: "text", lineNumbers: true },
);
const lines = shallowRef<CodeToken[][]>();
const plain = computed(() => props.code.replace(/\n$/, "").split("\n"));
const { state, copy } = useCopy();
onMounted(() =>
  watchEffect(async (onCleanup) => {
    const { code, language } = props;
    let current = true;
    onCleanup(() => (current = false));
    try {
      const { codeTokens } = await import("../../utils/code-tokens");
      const result = await codeTokens(code.replace(/\n$/, ""), language);
      if (current) lines.value = result;
    } catch {
      if (current) lines.value = undefined;
    }
  }),
);
</script>
<template>
  <figure class="s-code">
    <figcaption class="s-code__bar">
      <span class="s-code__lang">{{ language }}</span>
      <span v-if="title" class="s-code__title">{{ title }}</span>
      <button type="button" class="s-code__copy" @click="copy(code)">
        <UiIcon :name="state === 'copied' ? 'check' : 'copy'" :size="14" />
        <span role="status">{{
          state === "copied"
            ? $t("common.copied")
            : state === "failed"
              ? $t("ui.copyManual")
              : $t("ui.copy")
        }}</span>
      </button>
    </figcaption>
    <pre
      class="s-code__pre"
      :class="{ 's-code__pre--numbered': lineNumbers }"
      tabindex="0"
    ><code v-if="lines"><span v-for="(line, i) in lines" :key="i" class="s-code__line"><span v-for="(token, j) in line" :key="j" :style="{ color: token.color, fontStyle: token.italic ? 'italic' : undefined }">{{ token.content }}</span>{{ "\n" }}</span></code><code v-else><span v-for="(line, i) in plain" :key="i" class="s-code__line">{{ line + "\n" }}</span></code></pre>
  </figure>
</template>
<style scoped>
.s-code {
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
  min-width: 0;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-code-bg);
  overflow: hidden;
}
.s-code__bar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: 2rem;
  padding: 0 var(--s-2) 0 var(--s-3);
  border-bottom: 1px solid var(--s-line);
  background: var(--s-surface);
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-code__lang {
  color: var(--s-copper);
}
.s-code__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0;
  text-transform: none;
}
.s-code__copy {
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
.s-code__copy:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-code__pre {
  padding: var(--s-3) var(--s-4);
  overflow-x: auto;
  color: var(--s-code-text);
  font: 400 var(--s-text-sm) / 1.7 var(--s-font-mono);
  font-stretch: 87.5%;
  font-variant-ligatures: none;
  tab-size: 2;
  counter-reset: line;
}
.s-code__pre:focus-visible {
  outline-offset: -2px;
}
.s-code__pre--numbered {
  padding-left: 0;
}
.s-code__pre--numbered .s-code__line::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2.75rem;
  margin-right: var(--s-4);
  padding-right: var(--s-3);
  border-right: 1px solid var(--s-line);
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-3);
  user-select: none;
}
</style>
