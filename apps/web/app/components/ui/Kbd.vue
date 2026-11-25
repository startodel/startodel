<template>
  <kbd class="s-kbd"><slot /></kbd>
</template>
<style scoped>
.s-kbd {
  display: inline-grid;
  place-items: center;
  min-width: 1.375rem;
  height: 1.375rem;
  padding: 0 0.3rem;
  border: 1px solid var(--s-line-strong);
  border-bottom-width: 2px;
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink-2);
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
}
</style>
