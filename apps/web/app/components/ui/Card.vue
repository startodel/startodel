<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import { NuxtLink } from "#components";
withDefaults(
  defineProps<{
    variant?: "default" | "raised" | "sunken" | "outline" | "live";
    padding?: "none" | "sm" | "md" | "lg";
    /** A short mono tag in the top edge, such as a designator or a kind. */
    tag?: string;
    to?: RouteLocationRaw;
    as?: string;
  }>(),
  { variant: "default", padding: "md", as: "div" },
);
</script>
<template>
  <component
    :is="to ? NuxtLink : as"
    :to="to"
    class="s-card"
    :class="['s-card--' + variant, 's-card--pad-' + padding, { 's-card--link': to }]"
  >
    <span v-if="tag" class="s-card__tag">{{ tag }}</span>
    <header v-if="$slots.header" class="s-card__header"><slot name="header" /></header>
    <div class="s-card__body"><slot /></div>
    <footer v-if="$slots.footer" class="s-card__footer"><slot name="footer" /></footer>
  </component>
</template>
<style scoped>
.s-card {
  --_pad: var(--s-5);
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
  color: var(--s-ink);
  box-shadow: var(--s-shadow-1);
}
.s-card--pad-none {
  --_pad: 0px;
}
.s-card--pad-sm {
  --_pad: var(--s-3);
}
.s-card--pad-lg {
  --_pad: var(--s-8);
}
.s-card--raised {
  background: var(--s-raised);
  box-shadow: var(--s-shadow-2);
}
.s-card--sunken {
  background: var(--s-sunken);
  box-shadow: none;
}
.s-card--outline {
  background: transparent;
  border-style: dashed;
  border-color: var(--s-line-strong);
  box-shadow: none;
}
.s-card--live {
  border-color: var(--s-copper-line);
  background: var(--s-raised);
  box-shadow: var(--s-shadow-2);
}
.s-card--live::before {
  content: "";
  position: absolute;
  inset: -1px auto -1px -1px;
  width: 3px;
  border-radius: var(--s-radius-md) 0 0 var(--s-radius-md);
  background: var(--s-copper-fill);
}
.s-card--link {
  text-decoration: none;
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    translate var(--s-dur-2) var(--s-ease),
    box-shadow var(--s-dur-2) var(--s-ease);
}
.s-card--link:hover {
  border-color: var(--s-ink);
  translate: 0 -2px;
  box-shadow: var(--s-shadow-2);
}
.s-card--link:focus-visible {
  border-radius: var(--s-radius-md);
}
.s-card__tag {
  position: absolute;
  top: calc(-0.5rem - 1px);
  left: var(--s-4);
  padding: 0 var(--s-2);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-xs);
  background: var(--s-raised);
  font: 500 var(--s-text-2xs) / 1rem var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-card--live .s-card__tag {
  border-color: var(--s-copper-line);
  color: var(--s-copper);
}
.s-card__header,
.s-card__footer {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--_pad);
}
.s-card__header {
  border-bottom: 1px solid var(--s-line);
}
.s-card__footer {
  border-top: 1px solid var(--s-line);
}
.s-card__body {
  flex: 1;
  min-width: 0;
  padding: var(--_pad);
}
</style>
