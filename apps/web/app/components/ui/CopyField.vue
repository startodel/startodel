<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string;
  /** Wrap long text instead of scrolling. Suits prompts. */
  multiline?: boolean;
  /** Mask the value until the learner reveals it. Suits MCP Tokens. */
  secret?: boolean;
  hint?: string;
}>();
const emit = defineEmits<{ copied: [] }>();
const { state, copy } = useCopy();
const revealed = ref(false);
const shown = computed(() =>
  props.secret && !revealed.value ? "•".repeat(Math.min(props.value.length, 40)) : props.value,
);
async function run() {
  await copy(props.value);
  if (state.value === "copied") emit("copied");
}
</script>
<template>
  <div class="s-copy" :class="{ 's-copy--multiline': multiline, 'is-copied': state === 'copied' }">
    <div class="s-copy__head">
      <span class="s-copy__label">{{ label }}</span>
      <span class="s-copy__status" role="status">{{
        state === "copied" ? $t("common.copied") : state === "failed" ? $t("ui.copyManual") : ""
      }}</span>
    </div>
    <div class="s-copy__row">
      <code class="s-copy__value" tabindex="0">{{ shown }}</code>
      <button
        v-if="secret"
        type="button"
        class="s-copy__action"
        :aria-label="revealed ? $t('ui.hide', { label }) : $t('ui.show', { label })"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <UiIcon :name="revealed ? 'eye-off' : 'eye'" />
      </button>
      <button type="button" class="s-copy__action s-copy__action--copy" @click="run">
        <UiIcon :name="state === 'copied' ? 'check' : 'copy'" /><span class="s-copy__word">{{
          $t("ui.copy")
        }}</span
        ><span class="s-sr"> {{ label }}</span>
      </button>
    </div>
    <p v-if="hint" class="s-copy__hint">{{ hint }}</p>
  </div>
</template>
<style scoped>
.s-copy {
  container: s-copy / inline-size;
  display: grid;
  gap: 0.375rem;
  min-width: 0;
}
.s-copy__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-3);
}
.s-copy__label {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-copy__status {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-verdigris);
}
.s-copy__row {
  display: flex;
  align-items: stretch;
  min-width: 0;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-sunken);
  transition: border-color var(--s-dur-1) var(--s-ease);
}
.s-copy.is-copied .s-copy__row {
  border-color: var(--s-verdigris);
}
.s-copy__value {
  flex: 1;
  min-width: 0;
  padding: 0.5625rem var(--s-3);
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  color: var(--s-ink);
  font: 400 var(--s-text-sm) / 1.5 var(--s-font-mono);
  font-stretch: 87.5%;
  font-variant-ligatures: none;
}
.s-copy__value:focus-visible {
  outline-offset: -2px;
}
.s-copy--multiline .s-copy__value {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.s-copy__action {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-width: var(--s-control-md);
  padding: 0 var(--s-3);
  border-left: 1px solid var(--s-line-strong);
  background: var(--s-raised);
  color: var(--s-ink-2);
  font-size: var(--s-text-xs);
  font-weight: 600;
  transition:
    background var(--s-dur-1) var(--s-ease),
    color var(--s-dur-1) var(--s-ease);
}
.s-copy__action:last-child {
  border-radius: 0 3px 3px 0;
}
.s-copy__action:hover {
  background: var(--s-surface);
  color: var(--s-ink);
}
.s-copy--multiline .s-copy__action {
  align-items: flex-start;
  padding-top: 0.625rem;
}
.s-copy.is-copied .s-copy__action--copy {
  color: var(--s-verdigris);
}
/* A narrow field keeps its room for the value: the action shows its glyph and is still named. */
@container s-copy (max-width: 22rem) {
  .s-copy__word {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
.s-copy__hint {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
</style>
