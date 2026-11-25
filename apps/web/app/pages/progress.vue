<script setup lang="ts">
import { MASTERY_LABELS } from "@startodel/core";
import { displayDate } from "../utils/dates";
useHead({ title: "Progress" });
const { data, error, refresh } = await useFetch("/api/progress");
const sort = ref("title");
const topics = computed(() =>
  [...(data.value?.perTopic ?? [])].sort(
    (a, b) => (sort.value === "mastery" ? a.level - b.level : 0) || a.title.localeCompare(b.title),
  ),
);
</script>
<template>
  <main>
    <h1>Progress</h1>
    <p v-if="error" role="alert">
      Could not load your progress. <button @click="refresh()">Retry</button>
    </p>
    <template v-if="data"
      ><section class="panel">
        <h2>Mastery across Topics</h2>
        <dl class="levels">
          <div v-for="(n, i) in data.masteryDistribution" :key="i">
            <dt>{{ i }} · {{ MASTERY_LABELS[i] }}</dt>
            <dd>{{ n }}</dd>
          </div>
        </dl>
      </section>
      <section class="panel">
        <h2>Track completion</h2>
        <p class="muted">Topics reach completion at Mastery 2.</p>
        <p v-if="!data.perTrack.length">No Tracks yet.</p>
        <div v-for="t in data.perTrack" :key="t.trackId">
          <NuxtLink :to="'/tracks/' + t.trackId">{{ t.title }}</NuxtLink> · {{ t.completed }} of
          {{ t.total }} Topics<progress
            :aria-label="t.title"
            :max="t.total || 1"
            :value="t.completed"
          />
        </div>
      </section>
      <section class="panel">
        <h2>Topics</h2>
        <p v-if="!topics.length">No Topics yet.</p>
        <template v-else
          ><label
            >Sort by
            <select v-model="sort">
              <option value="title">Title</option>
              <option value="mastery">Mastery (lowest first)</option>
            </select></label
          >
          <div class="scroll">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Tracks</th>
                  <th>Mastery</th>
                  <th>Lessons read</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in topics" :key="t.id">
                  <th scope="row"><NuxtLink :to="'/topics/' + t.id">{{ t.title }}</NuxtLink></th>
                  <td>{{ t.tracks.map((track) => track.title).join(", ") || "—" }}</td>
                  <td>{{ t.level }} · {{ MASTERY_LABELS[t.level] }}</td>
                  <td>{{ t.read }} / {{ t.lessons }}</td>
                  <td>{{ t.lastActivity ? displayDate(t.lastActivity) : "—" }}</td>
                </tr>
              </tbody>
            </table>
          </div></template
        >
      </section>
      <section class="panel">
        <h2>Recent activity</h2>
        <p v-if="!data.activity.length">No learning activity yet.</p>
        <ol class="feed">
          <li v-for="a in data.activity" :key="a.kind + a.id">
            <span
              ><strong>{{ a.kind }}</strong> · {{ a.title }}
              <span v-if="a.detail">· {{ a.detail }}</span></span
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
