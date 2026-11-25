<script setup lang="ts">
const { t, locale } = useI18n();
const { masteryLabel, verdictLabel } = useLearningLabels();
const displayDate = useDisplayDate();
useHead({ title: t("nav.progress") });
const { data, error, refresh } = await useFetch("/api/progress");
const activities = computed(() => ({
  "Lesson read": t("activity.lesson"),
  "Quiz attempt": t("activity.quiz"),
  "Grill answer": t("activity.answer"),
  "Grill verdict": t("activity.verdict"),
  "Review result": t("activity.review"),
  Mastery: t("activity.mastery"),
}));
const sort = ref("title");
const topics = computed(() =>
  [...(data.value?.perTopic ?? [])].sort(
    (a, b) =>
      (sort.value === "mastery" ? a.level - b.level : 0) ||
      a.title.localeCompare(b.title, locale.value),
  ),
);
</script>
<template>
  <main>
    <h1>{{ $t("nav.progress") }}</h1>
    <p v-if="error" role="alert">
      {{ $t("progress.load") }} <button @click="refresh()">{{ $t("common.retry") }}</button>
    </p>
    <template v-if="data"
      ><section class="panel">
        <h2>{{ $t("progress.levels") }}</h2>
        <dl class="levels">
          <div v-for="(n, i) in data.masteryDistribution" :key="i">
            <dt>{{ $n(i) }} · {{ masteryLabel(i) }}</dt>
            <dd>{{ $n(n) }}</dd>
          </div>
        </dl>
      </section>
      <section class="panel">
        <h2>{{ $t("progress.completion") }}</h2>
        <p class="muted">{{ $t("progress.threshold") }}</p>
        <p v-if="!data.perTrack.length">{{ $t("progress.noTracks") }}</p>
        <div v-for="t in data.perTrack" :key="t.trackId">
          <NuxtLinkLocale :to="'/tracks/' + t.trackId">{{ t.title }}</NuxtLinkLocale> ·
          {{ $t("progress.ofTopics", { done: $n(t.completed), total: $n(t.total) })
          }}<progress :aria-label="t.title" :max="t.total || 1" :value="t.completed" />
        </div>
      </section>
      <section class="panel">
        <h2>{{ $t("track.topics") }}</h2>
        <p v-if="!topics.length">{{ $t("progress.noTopics") }}</p>
        <template v-else
          ><label
            >{{ $t("progress.sort") }}
            <select v-model="sort">
              <option value="title">{{ $t("progress.title") }}</option>
              <option value="mastery">{{ $t("progress.lowest") }}</option>
            </select></label
          >
          <div class="scroll">
            <table>
              <thead>
                <tr>
                  <th>{{ $t("progress.topic") }}</th>
                  <th>{{ $t("progress.tracks") }}</th>
                  <th>{{ $t("progress.mastery") }}</th>
                  <th>{{ $t("progress.read") }}</th>
                  <th>{{ $t("progress.last") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in topics" :key="t.id">
                  <th scope="row">
                    <NuxtLinkLocale :to="'/topics/' + t.id">{{ t.title }}</NuxtLinkLocale>
                  </th>
                  <td>{{ t.tracks.map((track) => track.title).join(", ") || "—" }}</td>
                  <td>{{ $n(t.level) }} · {{ masteryLabel(t.level) }}</td>
                  <td>{{ $n(t.read) }} / {{ $n(t.lessons) }}</td>
                  <td>{{ t.lastActivity ? displayDate(t.lastActivity) : "—" }}</td>
                </tr>
              </tbody>
            </table>
          </div></template
        >
      </section>
      <section class="panel">
        <h2>{{ $t("progress.history") }}</h2>
        <p v-if="!data.activity.length">{{ $t("progress.emptyHistory") }}</p>
        <ol class="feed">
          <li v-for="a in data.activity" :key="a.kind + a.id">
            <span
              ><strong>{{ activities[a.kind] }}</strong> · {{ a.title }}
              <span v-if="a.detail"
                >·
                {{
                  ["Grill verdict", "Review result"].includes(a.kind)
                    ? verdictLabel(a.detail)
                    : a.detail
                }}</span
              ></span
            ><time :datetime="a.at">{{ displayDate(a.at) }}</time>
          </li>
        </ol>
      </section>
    </template>
  </main>
</template>
<style scoped>
.levels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.75rem;
}
.levels div {
  padding: 0.75rem;
  border-left: 3px solid var(--line);
}
dt,
time {
  font-size: 0.87rem;
  color: var(--muted);
}
dd {
  font:
    2rem Georgia,
    serif;
  margin: 0;
}
.scroll {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 1rem;
}
th,
td {
  text-align: left;
  padding: 0.65rem;
  border-bottom: 1px solid var(--line);
}
.feed {
  list-style: none;
  padding: 0;
}
.feed li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--line);
}
time {
  white-space: nowrap;
}
</style>
