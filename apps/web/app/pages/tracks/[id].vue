<script setup lang="ts">
import { MASTERY_LABELS } from "@startodel/core";
import { httpUrl } from "../../utils/links";
const route = useRoute();
const { data, error } = await useFetch(`/api/tracks/${String(route.params.id)}/graph`);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: "Track unavailable",
  });
useHead({ title: () => data.value?.track.title });
const selected = ref(data.value?.topics.find((t) => t.id === route.query.topic)?.id);
const list = ref(false);
const completed = computed(() => data.value?.topics.filter((t) => t.level >= 2).length || 0);
const sources = computed(() =>
  [data.value?.track.sources.repo, ...(data.value?.track.sources.docs ?? [])].filter(
    (s): s is string => !!s && !!httpUrl(s),
  ),
);
</script>
<template>
  <main v-if="data">
    <NuxtLink to="/">← Dashboard</NuxtLink>
    <h1>{{ data.track.title }}</h1>
    <p v-if="data.track.description">{{ data.track.description }}</p>
    <p class="muted">
      {{ completed }} of {{ data.topics.length }} Topics at Mastery 2 or higher
      <strong v-if="data.topics.length && completed === data.topics.length">
        · Track complete</strong
      >
    </p>
    <details v-if="sources.length">
      <summary>Track Sources</summary>
      <ul>
        <li v-for="(url, i) in sources" :key="i">
          <a :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
        </li>
      </ul>
    </details>
    <h2>Track Graph</h2>
    <template v-if="data.topics.length"
      ><ul aria-label="Mastery legend" class="legend">
        <li v-for="(label, i) in MASTERY_LABELS" :key="i" :class="'level-' + i">
          <i aria-hidden="true" />{{ i }} · {{ label }}
        </li>
      </ul>
      <div class="workspace">
        <section>
          <button type="button" class="toggle" :aria-pressed="list" @click="list = !list">
            {{ list ? "Show graph" : "Show ordered list" }}
          </button>
          <div class="graph" v-if="!list">
            <TrackGraph
              :topics="data.topics"
              :edges="data.edges"
              :selected="selected"
              @select="selected = $event"
            />
          </div>
          <ol :class="['topic-list', { alternate: !list }]" aria-label="Topics in Track order">
            <li v-for="t in data.topics" :key="t.id">
              <button :aria-pressed="selected === t.id" @click="selected = t.id">
                {{ t.title }}
              </button> <small>Mastery {{ t.level }}</small>
            </li>
          </ol>
        </section>
        <TopicPanel v-if="selected" :key="selected" :id="selected" :track="data.track.id" />
        <aside class="panel" v-else>
          <h2>Topic details</h2>
          <p>Select a Topic to see its Lessons and prerequisites.</p>
        </aside>
      </div>
    </template>
    <p v-else>This Track has no Topics yet.</p>
  </main>
</template>
<style>
.level-0 {
  --level-color: #e5e8e4;
}
.level-1 {
  --level-color: #d9ebf6;
}
.level-2 {
  --level-color: #c7e8d5;
}
.level-3 {
  --level-color: #e6def3;
}
.level-4 {
  --level-color: #f5deae;
}
</style>
<style scoped>
h1 {
  margin-top: 0.7rem;
}
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr);
  gap: 1.2rem;
}
.workspace aside {
  margin: 0;
  align-self: start;
}
.legend {
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--muted);
  font-size: 0.85rem;
}
.legend i {
  background: var(--level-color);
  width: 0.9rem;
  height: 0.9rem;
  display: inline-block;
  border: 1px solid #7d8a7e;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 0.3rem;
}
.toggle {
  margin-bottom: 0.6rem;
}
.topic-list {
  padding-left: 2rem;
}
.topic-list li {
  padding: 0.25rem;
}
.topic-list.alternate:not(:focus-within) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
}
@media (max-width: 720px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  .graph,
  .toggle {
    display: none;
  }
  .topic-list.alternate:not(:focus-within) {
    position: static;
    width: auto;
    height: auto;
    clip-path: none;
    padding-left: 2rem;
  }
}
</style>
