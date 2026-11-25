<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "reka-ui";
import type { RouteLocationRaw } from "vue-router";
import type { IconName } from "./icons";
export interface MenuItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Navigate instead of emitting select. */
  to?: RouteLocationRaw;
  danger?: boolean;
  disabled?: boolean;
  /** Draw a rule above this item. */
  separated?: boolean;
  hint?: string;
}
/**
 * A menu of actions that opens from a trigger. Put the trigger in the default slot: it must be
 * one focusable element, usually a UiButton.
 */
withDefaults(
  defineProps<{
    items: MenuItem[];
    /** A small heading at the top of the menu. */
    label?: string;
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
  }>(),
  { align: "end", side: "bottom" },
);
defineEmits<{ select: [id: string] }>();
const layer = useLayer();
</script>
<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child><slot /></DropdownMenuTrigger>
    <DropdownMenuPortal :to="layer">
      <DropdownMenuContent
        class="s-popup s-menu"
        :align="align"
        :side="side"
        :side-offset="6"
        :collision-padding="8"
      >
        <DropdownMenuLabel v-if="label" class="s-popup__label">{{ label }}</DropdownMenuLabel>
        <template v-for="item in items" :key="item.id">
          <DropdownMenuSeparator v-if="item.separated" class="s-popup__separator" />
          <DropdownMenuItem
            class="s-option s-menu__item"
            :class="{ 's-option--danger': item.danger }"
            :disabled="item.disabled"
            :as-child="!!item.to"
            @select="$emit('select', item.id)"
          >
            <NuxtLink v-if="item.to" :to="item.to" class="s-option s-menu__item">
              <UiIcon v-if="item.icon" :name="item.icon" :size="14" class="s-option__icon" />
              <span>{{ item.label }}</span>
              <span v-if="item.hint" class="s-menu__hint">{{ item.hint }}</span>
            </NuxtLink>
            <template v-else>
              <UiIcon v-if="item.icon" :name="item.icon" :size="14" class="s-option__icon" />
              <span>{{ item.label }}</span>
              <span v-if="item.hint" class="s-menu__hint">{{ item.hint }}</span>
            </template>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
<style>
.s-root .s-menu {
  min-width: 11rem;
  max-width: min(18rem, calc(100vw - var(--s-4)));
}
.s-root .s-menu__item {
  padding-right: var(--s-3);
  text-decoration: none;
}
.s-root .s-menu__hint {
  margin-left: auto;
  padding-left: var(--s-4);
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.s-root .s-option[data-highlighted] .s-menu__hint {
  color: inherit;
  opacity: 0.7;
}
</style>
