<script setup lang="ts">
const theme = useTheme();
const tabs = [
  { id: "auto", label: "System theme", icon: "auto" },
  { id: "light", label: "Light theme", icon: "sun" },
  { id: "dark", label: "Dark theme", icon: "moon" },
] as const;
</script>
<template>
  <div class="s-theme" role="radiogroup" aria-label="Theme">
    <button
      v-for="t in tabs"
      :key="t.id"
      type="button"
      class="s-theme__option"
      role="radio"
      :aria-checked="theme === t.id"
      :aria-label="t.label"
      :title="t.label"
      @click="theme = t.id"
    >
      <UiIcon :name="t.icon" :size="14" />
    </button>
  </div>
</template>
<style scoped>
.s-theme {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-sunken);
}
.s-theme__option {
  display: grid;
  place-items: center;
  width: 1.625rem;
  height: 1.5rem;
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
}
.s-theme__option:hover {
  color: var(--s-ink);
}
.s-theme__option[aria-checked="true"] {
  background: var(--s-raised);
  color: var(--s-copper);
  box-shadow: 0 0 0 1px var(--s-line-strong);
}
</style>
