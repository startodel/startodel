<script setup lang="ts">
import type { EditorView } from "@codemirror/view";
const props = defineProps<{
  starter: string;
  language: string;
  lessonId: string;
  blockId: string;
}>();
const { t } = useI18n();
const host = useTemplateRef("host");
const ready = ref(false);
const modified = ref(false);
const key = "startodel:exercise:" + props.lessonId + ":" + props.blockId;
let view: EditorView | undefined;

onMounted(async () => {
  const { editorLanguage, mountEditor } = await import("../../utils/exercise-editor");
  const language = await editorLanguage(props.language);
  if (!host.value) return;
  let initial = props.starter;
  try {
    initial = localStorage.getItem(key) ?? initial;
  } catch {
    // Storage may be unavailable in a private browsing session.
  }
  modified.value = initial !== props.starter;
  view = mountEditor(
    host.value,
    initial,
    language,
    t("lesson.editor"),
    t("lesson.editorKeys"),
    (doc) => {
      modified.value = doc !== props.starter;
      try {
        if (modified.value) localStorage.setItem(key, doc);
        else localStorage.removeItem(key);
      } catch {
        // Editing still works in memory.
      }
    },
  );
  ready.value = true;
});
onBeforeUnmount(() => view?.destroy());
function reset() {
  if (!view) return;
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: props.starter } });
  view.focus();
}
</script>
<template>
  <div class="s-editor">
    <div class="s-editor__bar">
      <UiBadge variant="outline" icon="code">{{
        language === "text" ? $t("lesson.plainText") : language
      }}</UiBadge>
      <UiButton size="sm" variant="ghost" :disabled="!modified" @click="reset">{{
        $t("lesson.reset")
      }}</UiButton>
    </div>
    <pre v-if="!ready" class="s-editor__fallback">{{ starter }}</pre>
    <div ref="host" />
  </div>
</template>
<style scoped>
.s-editor {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  color: var(--s-code-text);
  background: var(--s-code-bg);
}
.s-editor:has(.cm-focused) {
  outline: 2px solid var(--s-focus);
  outline-offset: 2px;
}
.s-editor__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  padding: var(--s-1) var(--s-3);
  border-bottom: 1px solid var(--s-line);
  background: var(--s-surface);
}
.s-editor__fallback,
.s-editor :deep(.cm-scroller) {
  font: 400 var(--s-field-text-sm) / 1.65 var(--s-font-mono);
  font-stretch: 87.5%;
  tab-size: 2;
}
.s-editor__fallback,
.s-editor :deep(.cm-content) {
  min-height: 6.5rem;
}
.s-editor__fallback {
  padding: var(--s-3);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.s-editor :deep(.cm-editor.cm-focused) {
  outline: none;
}
.s-editor :deep(.cm-content) {
  padding: var(--s-3) 0;
  caret-color: var(--s-code-text);
}
.s-editor :deep(.cm-line) {
  padding: 0 var(--s-3);
}
.s-editor :deep(.cm-editor .cm-gutters) {
  border-right: 1px solid var(--s-line);
  background: var(--s-surface);
  color: var(--s-ink-3);
}
.s-editor :deep(.cm-lineNumbers .cm-gutterElement) {
  padding: 0 var(--s-2);
}
.s-editor :deep(.cm-content ::selection) {
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
}
</style>
