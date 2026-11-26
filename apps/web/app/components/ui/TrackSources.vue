<script setup lang="ts">
import type { TrackSources } from "@startodel/core";
const props = defineProps<{ sources: TrackSources }>();
const links = computed(() => {
  const { repo, docs = [] } = props.sources;
  const urls = repo ? [repo, ...docs] : docs;
  return urls.flatMap((url) => trackSourceLink(url) ?? []);
});
const limit = 5;
const expanded = ref(false);
const visible = computed(() => (expanded.value ? links.value : links.value.slice(0, limit)));
const id = useId();
</script>
<template>
  <section
    v-if="links.length"
    class="s-stack"
    style="--s-gap: var(--s-3)"
    :aria-label="$t('track.sources')"
  >
    <UiSectionHeading :title="$t('track.sources')" :level="3" />
    <ul :id="id" class="sources">
      <li v-for="(source, i) in visible" :key="i">
        <a class="s-link" :href="source.href" target="_blank" rel="noopener noreferrer">{{
          source.label
        }}</a>
      </li>
    </ul>
    <div v-if="links.length > limit">
      <UiButton
        variant="ghost"
        size="sm"
        :aria-expanded="expanded"
        :aria-controls="id"
        @click="expanded = !expanded"
        >{{ expanded ? $t("ui.showLess") : $t("ui.showAll", { n: $n(links.length) }) }}</UiButton
      >
    </div>
  </section>
</template>
<style scoped>
.sources {
  display: grid;
  gap: var(--s-2);
  list-style: none;
  font-size: var(--s-text-sm);
  overflow-wrap: anywhere;
}
</style>
