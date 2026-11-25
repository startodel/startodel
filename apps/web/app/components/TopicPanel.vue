<script setup lang="ts">
const countArgs = useCountArgs();
const { masteryLabel } = useLearningLabels();
const props = defineProps<{ id: string; track?: string }>();
const { data, error, refresh } = await useFetch(`/api/topics/${props.id}`);
</script>
<template>
  <aside class="panel" aria-live="polite">
    <p v-if="error" role="alert">
      {{ $t("topic.load") }} <button @click="refresh()">{{ $t("common.retry") }}</button>
    </p>
    <template v-if="data"
      ><h2>{{ data.topic.title }}</h2>
      <p v-if="data.topic.summary">{{ data.topic.summary }}</p>
      <p class="muted">
        {{ $t("topic.level", { level: $n(data.mastery.level) }) }} ·
        {{ masteryLabel(data.mastery.level) }}
      </p>
      <h3>{{ $t("count.lessons", countArgs(data.lessons.length)) }}</h3>
      <ol v-if="data.lessons.length">
        <li v-for="lesson in data.lessons" :key="lesson.id">
          <NuxtLinkLocale :to="{ path: '/lessons/' + lesson.id, query: { track } }">{{
            lesson.title
          }}</NuxtLinkLocale
          ><small v-if="lesson.readAt"> · {{ $t("topic.read") }}</small>
        </li>
      </ol>
      <p v-else>{{ $t("topic.empty") }}</p>
      <template v-if="data.prerequisites.length"
        ><h3>{{ $t("topic.prerequisites") }}</h3>
        <ul>
          <li v-for="t in data.prerequisites" :key="t.id">{{ t.title }}</li>
        </ul></template
      ><template v-if="data.dependents.length"
        ><h3>{{ $t("topic.dependents") }}</h3>
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
