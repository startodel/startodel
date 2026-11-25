<script setup lang="ts">
import { colorTokens } from "./tokens";
const props = defineProps<{ token: string; role: string }>();
const value = computed(() => colorTokens[props.token]);
</script>
<template>
  <div class="swatch">
    <div class="swatch__chips">
      <span data-theme="light" class="swatch__chip" :style="{ background: `var(--s-${token})` }" />
      <span data-theme="dark" class="swatch__chip" :style="{ background: `var(--s-${token})` }" />
    </div>
    <p class="swatch__name">--s-{{ token }}</p>
    <p class="swatch__role">{{ role }}</p>
    <p v-if="value" class="swatch__value">{{ value.light }} · {{ value.dark }}</p>
  </div>
</template>
<style scoped>
.swatch {
  display: grid;
  gap: 0.125rem;
  min-width: 0;
}
.swatch__chips {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 3.5rem;
  margin-bottom: var(--s-2);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  overflow: hidden;
}
.swatch__name,
.swatch__value {
  font: 500 var(--s-text-2xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  overflow-wrap: anywhere;
}
.swatch__role {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.swatch__value {
  font-weight: 400;
  color: var(--s-ink-3);
  text-transform: uppercase;
}
</style>
