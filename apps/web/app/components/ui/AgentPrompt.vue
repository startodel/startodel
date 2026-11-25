<script setup lang="ts">
/**
 * A prompt the learner hands to their own agent. Startodel has no model of its own, so this is
 * how work passes to the agent. The whole prompt is copied with one press.
 */
const props = withDefaults(
  defineProps<{
    text: string;
    /** Says what the prompt is for, such as "Ask your agent to judge". */
    label?: string;
    /** Names the Tool the agent is expected to call. */
    tool?: string;
    compact?: boolean;
  }>(),
  {},
);
const emit = defineEmits<{ copied: [] }>();
const { state, copy } = useCopy();
async function run() {
  await copy(props.text);
  if (state.value === "copied") emit("copied");
}
</script>
<template>
  <div class="s-prompt" :class="{ 's-prompt--compact': compact, 'is-copied': state === 'copied' }">
    <div class="s-prompt__head">
      <span class="s-prompt__label"
        ><UiIcon name="terminal" :size="12" />{{ label ?? $t("agent.prompt") }}</span
      >
      <span v-if="tool" class="s-prompt__tool">{{ tool }}</span>
    </div>
    <p class="s-prompt__text" tabindex="0">{{ text }}</p>
    <div class="s-prompt__foot">
      <button type="button" class="s-prompt__copy" @click="run">
        <UiIcon :name="state === 'copied' ? 'check' : 'copy'" :size="14" />
        {{ state === "copied" ? $t("common.copied") : $t("agent.copy") }}
      </button>
      <span class="s-prompt__status" role="status">{{
        state === "failed" ? $t("agent.manual") : state === "copied" ? $t("agent.paste") : ""
      }}</span>
    </div>
  </div>
</template>
<style scoped>
.s-prompt {
  display: grid;
  min-width: 0;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-code-bg);
  color: var(--s-code-text);
  overflow: hidden;
}
.s-prompt__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3) 0 var(--s-4);
}
.s-prompt__label,
.s-prompt__tool,
.s-prompt__status {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-prompt__label {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
}
.s-prompt__tool {
  padding: 0.125rem 0.375rem;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-xs);
  text-transform: none;
  letter-spacing: 0;
}
.s-prompt__text {
  padding: var(--s-3) var(--s-4) var(--s-4);
  font: 400 var(--s-text-sm) / 1.6 var(--s-font-mono);
  font-stretch: 87.5%;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.s-prompt__text::before {
  content: "› ";
  color: var(--s-copper);
  font-weight: 600;
}
.s-prompt__foot {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
}
.s-prompt__copy {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-height: var(--s-control-sm);
  padding: 0 var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink);
  font-size: var(--s-text-sm);
  font-weight: 600;
  box-shadow: var(--s-shadow-1);
}
.s-prompt__copy:hover {
  border-color: var(--s-ink);
}
.is-copied .s-prompt__copy {
  border-color: var(--s-verdigris);
  color: var(--s-verdigris);
}
.s-prompt--compact .s-prompt__text {
  padding-bottom: var(--s-3);
  font-size: var(--s-text-xs);
}
</style>
