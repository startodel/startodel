<script setup lang="ts">
import { httpUrl } from "../../utils/links";
const { t } = useI18n();
const { masteryLabel } = useLearningLabels();
const route = useRoute();
const { data, error, refresh } = await useFetch(`/api/tracks/${String(route.params.id)}/graph`);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 500,
    message: t("common.error"),
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
    <NuxtLinkLocale to="/">← {{ $t("nav.dashboard") }}</NuxtLinkLocale>
    <h1>{{ data.track.title }}</h1>
    <p v-if="data.track.description">{{ data.track.description }}</p>
    <TrackVisibility :track="data.track" :acceptance="data.termsAcceptance" @changed="refresh()" />
    <p class="muted">
      {{ $t("dashboard.atLevel", { done: $n(completed), total: $n(data.topics.length) }) }}
      <strong v-if="data.topics.length && completed === data.topics.length">
        · {{ $t("dashboard.completed") }}</strong
      >
    </p>
    <details v-if="sources.length">
      <summary>{{ $t("track.sources") }}</summary>
      <ul>
        <li v-for="(url, i) in sources" :key="i">
          <a :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a>
        </li>
      </ul>
    </details>
    <h2>{{ $t("track.graph") }}</h2>
    <template v-if="data.topics.length"
      ><ul :aria-label="$t('track.legend')" class="legend">
        <li v-for="i in [0, 1, 2, 3, 4]" :key="i" :class="'level-' + i">
          <i aria-hidden="true" />{{ $n(i) }} · {{ masteryLabel(i) }}
        </li>
      </ul>
      <div class="workspace">
        <section>
          <button type="button" class="toggle" :aria-pressed="list" @click="list = !list">
            {{ list ? $t("track.showGraph") : $t("track.showList") }}
          </button>
          <div class="graph" v-if="!list">
            <TrackGraph
              :topics="data.topics"
              :edges="data.edges"
              :selected="selected"
              @select="selected = $event"
            />
          </div>
          <ol :class="['topic-list', { alternate: !list }]" :aria-label="$t('track.order')">
            <li v-for="t in data.topics" :key="t.id">
              <button :aria-pressed="selected === t.id" @click="selected = t.id">
                {{ t.title }}
              </button> <small>{{ $t("topic.level", { level: $n(t.level) }) }}</small>
            </li>
          </ol>
        </section>
        <TopicPanel v-if="selected" :key="selected" :id="selected" :track="data.track.id" />
        <aside class="panel" v-else>
          <h2>{{ $t("track.details") }}</h2>
          <p>{{ $t("track.select") }}</p>
        </aside>
      </div>
    </template>
    <p v-else>{{ $t("track.empty") }}</p>
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
