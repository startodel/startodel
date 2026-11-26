<script setup lang="ts">
defineProps<{ sources: { href: string; label: string }[] }>();
</script>
<template>
  <section class="s-stack" style="--s-gap: var(--s-3)">
    <UiSectionHeading :title="$t('track.sources')" :level="3" />
    <ul class="sources">
      <li v-for="source in sources" :key="source.href">
        <a class="s-link" :href="source.href" target="_blank" rel="noopener noreferrer">{{
          source.label
        }}</a>
      </li>
    </ul>
  </section>
</template>
<style scoped>
.sources {
  display: grid;
  gap: var(--s-2);
  list-style: none;
  font-size: var(--s-text-sm);
}
</style>
