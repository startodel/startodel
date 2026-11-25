<script setup lang="ts">
import { MASTERY_LABELS } from "@startodel/core";
const props = defineProps<{ id: string; track?: string }>();
const { data, error, refresh } = await useFetch(`/api/topics/${props.id}`);
</script>
<template>
  <aside class="panel" aria-live="polite">
    <p v-if="error" role="alert">
      Could not load this Topic. <button @click="refresh()">Retry</button>
    </p>
    <template v-if="data"
      ><h2>{{ data.topic.title }}</h2>
      <p v-if="data.topic.summary">{{ data.topic.summary }}</p>
      <p class="muted">
        Mastery {{ data.mastery.level }} · {{ MASTERY_LABELS[data.mastery.level] }}
      </p>
      <h3>Lessons</h3>
      <ol v-if="data.lessons.length">
        <li v-for="lesson in data.lessons" :key="lesson.id">
          <NuxtLink :to="{ path: '/lessons/' + lesson.id, query: { track } }">{{
            lesson.title
          }}</NuxtLink
          ><small v-if="lesson.readAt"> · Read</small>
        </li>
      </ol>
      <p v-else>No Lessons yet.</p>
      <template v-if="data.prerequisites.length"
        ><h3>Prerequisites</h3>
        <ul>
          <li v-for="t in data.prerequisites" :key="t.id">{{ t.title }}</li>
        </ul></template
      ><template v-if="data.dependents.length"
        ><h3>Dependents</h3>
        <ul>
          <li v-for="t in data.dependents" :key="t.id">{{ t.title }}</li>
        </ul></template
      ></template
    >
  </aside>
</template>
<style scoped>
.panel {
  margin: 0;
  align-self: start;
}
ol,
ul {
  padding-left: 1.35rem;
}
</style>
