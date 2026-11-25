<script setup lang="ts">
import type { IconName } from "./icons";
const props = withDefaults(
  defineProps<{
    tabs: { id: string; label: string; count?: number; icon?: IconName; disabled?: boolean }[];
    label: string;
    variant?: "line" | "segment";
    /** Prefix for tab and panel ids. A panel uses `${idBase}-panel-${id}`. */
    idBase?: string;
    iconOnly?: boolean;
  }>(),
  { variant: "line", idBase: "tabs" },
);
const model = defineModel<string>({ required: true });
const list = ref<HTMLElement>();
function move(event: KeyboardEvent) {
  const enabled = props.tabs.filter((t) => !t.disabled);
  const at = enabled.findIndex((t) => t.id === model.value);
  const next =
    event.key === "ArrowRight"
      ? enabled[(at + 1) % enabled.length]
      : event.key === "ArrowLeft"
        ? enabled[(at - 1 + enabled.length) % enabled.length]
        : event.key === "Home"
          ? enabled[0]
          : event.key === "End"
            ? enabled.at(-1)
            : undefined;
  if (!next) return;
  event.preventDefault();
  model.value = next.id;
  void nextTick(() =>
    list.value
      ?.querySelector<HTMLElement>(`#${CSS.escape(props.idBase + "-tab-" + next.id)}`)
      ?.focus(),
  );
}
</script>
<template>
  <div
    ref="list"
    class="s-tabs"
    :class="'s-tabs--' + variant"
    role="tablist"
    :aria-label="label"
    @keydown="move"
  >
    <button
      v-for="t in tabs"
      :id="idBase + '-tab-' + t.id"
      :key="t.id"
      class="s-tabs__tab"
      type="button"
      role="tab"
      :aria-selected="model === t.id"
      :aria-controls="idBase + '-panel-' + t.id"
      :aria-label="iconOnly ? t.label : undefined"
      :tabindex="model === t.id ? 0 : -1"
      :disabled="t.disabled"
      @click="model = t.id"
    >
      <UiIcon v-if="t.icon" :name="t.icon" :size="14" /><span v-if="!iconOnly">{{ t.label }}</span
      ><span v-if="t.count !== undefined" class="s-tabs__count">{{ t.count }}</span>
    </button>
  </div>
</template>
<style scoped>
.s-tabs {
  display: flex;
  min-width: 0;
}
.s-tabs__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  flex: none;
  color: var(--s-ink-3);
  font-size: var(--s-text-sm);
  font-weight: 600;
  white-space: nowrap;
  transition:
    color var(--s-dur-1) var(--s-ease),
    background var(--s-dur-1) var(--s-ease);
}
.s-tabs__tab:hover {
  color: var(--s-ink);
}
.s-tabs__tab:disabled {
  color: var(--s-ink-3);
  opacity: 0.55;
  cursor: not-allowed;
}
.s-tabs__count {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-3);
}

.s-tabs--line {
  gap: var(--s-5);
  border-bottom: 1px solid var(--s-line);
  overflow-x: auto;
  scrollbar-width: none;
}
.s-tabs--line .s-tabs__tab {
  padding: var(--s-2) 0 0.625rem;
}
.s-tabs--line .s-tabs__tab::after {
  content: "";
  position: absolute;
  inset: auto 0 -1px;
  height: 2px;
  background: var(--s-copper-fill);
  scale: 0 1;
  transition: scale var(--s-dur-2) var(--s-ease);
}
.s-tabs--line .s-tabs__tab[aria-selected="true"] {
  color: var(--s-ink);
}
.s-tabs--line .s-tabs__tab[aria-selected="true"]::after {
  scale: 1 1;
}
.s-tabs--line .s-tabs__tab[aria-selected="true"] .s-tabs__count {
  color: var(--s-copper);
}

.s-tabs--segment {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-sunken);
}
.s-tabs--segment .s-tabs__tab {
  min-height: 1.625rem;
  padding: 0 0.625rem;
  border-radius: var(--s-radius-xs);
  font-size: var(--s-text-xs);
}
.s-tabs--segment .s-tabs__tab[aria-selected="true"] {
  background: var(--s-raised);
  color: var(--s-ink);
  box-shadow: 0 0 0 1px var(--s-line-strong);
}
</style>
