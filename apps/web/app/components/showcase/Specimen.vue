<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    note?: string;
    layout?: "row" | "stack" | "grid" | "block";
    surface?: "bg" | "surface" | "grid";
    flush?: boolean;
  }>(),
  { layout: "row", surface: "bg" },
);
</script>
<template>
  <figure class="specimen">
    <figcaption class="specimen__caption">
      <span class="specimen__label">{{ label }}</span>
      <span v-if="note" class="specimen__note">{{ note }}</span>
    </figcaption>
    <div
      class="specimen__stage"
      :class="[
        'specimen__stage--' + layout,
        'specimen__stage--on-' + surface,
        { 's-grid': surface === 'grid', 'specimen__stage--flush': flush },
      ]"
    >
      <slot />
    </div>
  </figure>
</template>
<style scoped>
.specimen {
  min-width: 0;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  overflow: hidden;
}
.specimen__caption {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-1) var(--s-3);
  padding: var(--s-2) var(--s-4);
  border-bottom: 1px solid var(--s-line);
  background: var(--s-surface);
}
.specimen__label {
  font: 500 var(--s-text-2xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink);
}
.specimen__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.specimen__stage {
  min-width: 0;
  padding: var(--s-6);
  background-color: var(--s-bg);
}
.specimen__stage--on-surface {
  background-color: var(--s-surface);
}
.specimen__stage--flush {
  padding: 0;
}
.specimen__stage--row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-4);
}
.specimen__stage--stack {
  display: grid;
  gap: var(--s-4);
}
.specimen__stage--stack > :deep(*) {
  min-width: 0;
}
.specimen__stage--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: var(--s-4);
  align-items: start;
}
</style>
