<script setup lang="ts">
withDefaults(defineProps<{ variant?: "full" | "mark" | "tile"; size?: number }>(), {
  variant: "full",
  size: 24,
});
</script>
<template>
  <span class="s-logo" :class="'s-logo--' + variant" :style="{ '--s-logo-size': size + 'px' }">
    <svg
      class="s-logo__mark"
      viewBox="0 0 32 32"
      :width="size"
      :height="size"
      :role="variant === 'full' ? undefined : 'img'"
      :aria-label="variant === 'full' ? undefined : 'Startodel'"
      :aria-hidden="variant === 'full' ? true : undefined"
    >
      <rect v-if="variant === 'tile'" class="s-logo__tile" width="32" height="32" rx="7" />
      <path
        class="s-logo__trace"
        d="M22.5 9.5h-10l-3 3v.5l3 3h7l3 3v.5l-3 3h-5.4"
        fill="none"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle class="s-logo__pad" cx="22.5" cy="9.5" r="3.4" />
      <circle class="s-logo__via" cx="9.5" cy="22.5" r="2.6" stroke-width="2" />
    </svg>
    <span v-if="variant === 'full'" class="s-logo__word">startodel</span>
  </span>
</template>
<style scoped>
.s-logo {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--s-logo-size) * 0.3);
  color: var(--s-ink);
  line-height: 1;
}
.s-logo__mark {
  flex: none;
}
.s-logo__tile {
  fill: #141b19;
}
.s-logo__trace {
  stroke: var(--s-copper-fill);
}
.s-logo__pad {
  fill: var(--s-copper-fill);
}
.s-logo__via {
  fill: none;
  stroke: var(--s-copper-fill);
}
.s-logo--tile :is(.s-logo__trace, .s-logo__via) {
  stroke: #e8834a;
}
.s-logo--tile .s-logo__pad {
  fill: #e8834a;
}
.s-logo__word {
  font-family: var(--s-font-mono);
  font-stretch: 75%;
  font-weight: 650;
  font-size: calc(var(--s-logo-size) * 0.78);
  letter-spacing: -0.045em;
}
</style>
