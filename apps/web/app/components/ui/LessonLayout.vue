<template>
  <div class="lesson__layout">
    <div class="lesson__blocks">
      <slot />
      <footer v-if="$slots.end" class="lesson__end"><slot name="end" /></footer>
    </div>
    <aside v-if="$slots.aside" class="lesson__aside"><slot name="aside" /></aside>
  </div>
</template>
<style scoped>
.lesson__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-10);
}
.lesson__blocks {
  display: grid;
  gap: var(--s-10);
  min-width: 0;
}
.lesson__aside {
  display: none;
}
.lesson__end {
  display: grid;
  gap: var(--s-5);
  max-width: calc(var(--s-block-margin, 6.5rem) + var(--s-6) + var(--s-read-measure));
  padding-top: var(--s-8);
  border-top: 1px solid var(--s-line);
}
@container s-main (min-width: 66rem) {
  .lesson__layout {
    grid-template-columns: minmax(0, 1fr) 15rem;
  }
  .lesson__aside {
    display: block;
    position: sticky;
    top: calc(var(--s-sticky-top, 0px) + 5rem);
    align-self: start;
  }
}
</style>
