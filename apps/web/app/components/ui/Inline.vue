<script setup lang="ts">
/** Short text that may hold `inline code`. Parts are rendered as text, never as markup. */
const props = defineProps<{ text: string }>();
const parts = computed(() =>
  props.text
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((part) =>
      part.length > 2 && part.startsWith("`") && part.endsWith("`")
        ? { code: true, text: part.slice(1, -1) }
        : { code: false, text: part },
    ),
);
</script>
<template>
  <span
    ><template v-for="(part, i) in parts" :key="i"
      ><code v-if="part.code" class="s-inline__code">{{ part.text }}</code
      ><template v-else>{{ part.text }}</template></template
    ></span
  >
</template>
<style scoped>
.s-inline__code {
  padding: 0.0625em 0.3em;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-xs);
  background: var(--s-sunken);
  font: 500 0.84em / 1.3 var(--s-font-mono);
  font-stretch: 87.5%;
  overflow-wrap: anywhere;
}
</style>
