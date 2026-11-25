<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import type { IconName } from "./icons";
/**
 * Tabs with their panels. Give each panel as a slot named after its tab id.
 * Arrow keys move between tabs. For a switch with no panels, use UiSegmented.
 */
withDefaults(
  defineProps<{
    tabs: { id: string; label: string; count?: number; icon?: IconName; disabled?: boolean }[];
    label: string;
    /** Keep hidden panels mounted, for example to preserve a draft. */
    keepAlive?: boolean;
  }>(),
  {},
);
const model = defineModel<string>({ required: true });
</script>
<template>
  <TabsRoot v-model="model" class="s-tabs" :unmount-on-hide="!keepAlive">
    <TabsList class="s-tabs__list" :aria-label="label">
      <TabsTrigger
        v-for="t in tabs"
        :key="t.id"
        class="s-tabs__tab"
        :value="t.id"
        :disabled="t.disabled"
      >
        <UiIcon v-if="t.icon" :name="t.icon" :size="14" /><span>{{ t.label }}</span
        ><span v-if="t.count !== undefined" class="s-tabs__count">{{ t.count }}</span>
      </TabsTrigger>
    </TabsList>
    <template v-for="t in tabs" :key="t.id">
      <TabsContent v-if="$slots[t.id]" class="s-tabs__panel" :value="t.id"
        ><slot :name="t.id"
      /></TabsContent>
    </template>
  </TabsRoot>
</template>
<style>
.s-root .s-tabs {
  display: grid;
  gap: var(--s-5);
  min-width: 0;
}
.s-root .s-tabs__list {
  display: flex;
  gap: var(--s-5);
  border-bottom: 1px solid var(--s-line);
  overflow-x: auto;
  scrollbar-width: none;
}
.s-root .s-tabs__tab {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-3) 0;
  color: var(--s-ink-3);
  font-size: var(--s-text-sm);
  font-weight: 600;
  transition: color var(--s-dur-1) var(--s-ease);
}
.s-root .s-tabs__tab:hover {
  color: var(--s-ink);
}
.s-root .s-tabs__tab[data-state="active"] {
  color: var(--s-ink);
}
.s-root .s-tabs__tab[data-state="active"]::after {
  content: "";
  position: absolute;
  inset: auto 0 -1px;
  height: 2px;
  background: var(--s-copper-fill);
}
.s-root .s-tabs__tab[data-disabled] {
  color: var(--s-ink-3);
  opacity: 0.6;
  cursor: not-allowed;
}
.s-root .s-tabs__tab:focus-visible {
  outline-offset: -2px;
}
.s-root .s-tabs__count {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.s-root .s-tabs__tab[data-state="active"] .s-tabs__count {
  color: var(--s-copper);
}
.s-root .s-tabs__panel {
  min-width: 0;
}
.s-root .s-tabs__panel:focus-visible {
  outline-offset: 4px;
}
</style>
