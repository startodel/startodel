<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from "reka-ui";
import type { IconName } from "./icons";
/** Content the learner opens on request, such as a hint or a solution. */
defineProps<{ title: string; icon?: IconName; disabled?: boolean; keepMounted?: boolean }>();
const open = defineModel<boolean>("open", { default: false });
</script>
<template>
  <CollapsibleRoot
    v-model:open="open"
    class="s-collapsible"
    :disabled="disabled"
    :unmount-on-hide="!keepMounted"
  >
    <CollapsibleTrigger class="s-collapsible__trigger">
      <UiIcon name="chevron-right" :size="14" class="s-collapsible__caret" />
      <UiIcon v-if="icon" :name="icon" :size="14" />
      <span>{{ title }}</span>
      <span v-if="$slots.meta" class="s-collapsible__meta"><slot name="meta" /></span>
    </CollapsibleTrigger>
    <CollapsibleContent class="s-collapsible__content">
      <div class="s-collapsible__inner"><slot /></div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
<style>
.s-root .s-collapsible {
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-surface);
}
.s-root .s-collapsible__trigger {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  width: 100%;
  min-height: var(--s-control-md);
  padding: 0 var(--s-3);
  font-size: var(--s-text-sm);
  font-weight: 600;
  color: var(--s-ink);
}
.s-root .s-collapsible__trigger:hover {
  background: var(--s-sunken);
}
.s-root .s-collapsible__caret {
  color: var(--s-ink-3);
  transition: rotate var(--s-dur-2) var(--s-ease);
}
.s-root .s-collapsible__trigger[data-state="open"] .s-collapsible__caret {
  rotate: 90deg;
}
.s-root .s-collapsible__meta {
  margin-left: auto;
  font-weight: 400;
  color: var(--s-ink-3);
}
.s-root .s-collapsible__content {
  overflow: hidden;
}
.s-root .s-collapsible__content[data-state="open"] {
  animation: s-collapsible-open var(--s-dur-2) var(--s-ease);
}
.s-root .s-collapsible__content[data-state="closed"] {
  animation: s-collapsible-close var(--s-dur-2) var(--s-ease);
}
@keyframes s-collapsible-open {
  from {
    height: 0;
  }
  to {
    height: var(--reka-collapsible-content-height);
  }
}
@keyframes s-collapsible-close {
  from {
    height: var(--reka-collapsible-content-height);
  }
  to {
    height: 0;
  }
}
.s-root .s-collapsible__inner {
  padding: var(--s-4);
  border-top: 1px solid var(--s-line);
}
</style>
