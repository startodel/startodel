<script setup lang="ts">
import { displayDate } from "../../../../utils/dates";
const route = useRoute();
const login = String(route.params.login);
const slug = String(route.params.slug);
const path = "/u/" + encodeURIComponent(login) + "/" + encodeURIComponent(slug);
const { data, error } = await useFetch(
  `/api/public/${encodeURIComponent(login)}/${encodeURIComponent(slug)}`,
);
if (!data.value)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: "Public Track unavailable",
  });
usePublicHead(data.value.title, data.value.description || "Public Track by @" + login, path);
const { user } = useUserSession();
const busy = ref(false);
const message = ref("");
async function fork() {
  busy.value = true;
  try {
    const track = await $fetch("/api/tracks/fork", { method: "POST", body: { login, slug } });
    await navigateTo("/tracks/" + track.id);
  } catch {
    message.value = "Could not fork this Track. Reload and try again.";
  } finally {
    busy.value = false;
  }
}
const graphTopics = computed(
  () => data.value?.topics.map((t) => ({ id: t.slug, title: t.title })) ?? [],
);
const graphEdges = computed(
  () =>
    data.value?.edges.map((e) => ({
      id: e.from + ":" + e.to,
      fromTopicId: e.from,
      toTopicId: e.to,
    })) ?? [],
);
</script>
<template>
  <main v-if="data">
    <div class="actions">
      <img
        v-if="data.author.avatarUrl"
        :src="data.author.avatarUrl"
        width="36"
        height="36"
        alt=""
      />
      <NuxtLink :to="'/u/' + encodeURIComponent(login)"
        >{{ data.author.name ? data.author.name + " · " : "" }}@{{ login }}</NuxtLink
      >
    </div>
    <h1>{{ data.title }}</h1>
    <p v-if="data.description">{{ data.description }}</p>
    <p class="muted">
      Created {{ displayDate(data.createdAt) }} · Updated {{ displayDate(data.updatedAt) }} ·
      {{ data.forkCount }} {{ data.forkCount === 1 ? "fork" : "forks" }}
    </p>
    <ForkedFrom v-if="data.forkedFrom" :from="data.forkedFrom" />
    <div class="actions">
      <button v-if="user && user.login !== login" class="primary" :disabled="busy" @click="fork">
        Fork</button
      ><NuxtLink v-else-if="!user" class="button" to="/login">Sign in to fork</NuxtLink
      ><span role="status">{{ message }}</span>
    </div>
    <details v-if="data.sources.repo || data.sources.docs?.length">
      <summary>Track Sources</summary>
      <ul>
        <li
          v-for="url in [data.sources.repo, ...(data.sources.docs ?? [])].filter(Boolean)"
          :key="url"
        >
          <a :href="url" rel="noopener noreferrer">{{ url }}</a>
        </li>
      </ul>
    </details>
    <template v-if="data.topics.length"
      ><h2>Track Graph</h2>
      <TrackGraph read-only :topics="graphTopics" :edges="graphEdges"
    /></template>
    <h2>Topics</h2>
    <p v-if="!data.topics.length">This Track has no Topics yet.</p>
    <ol>
      <li v-for="topic in data.topics" :key="topic.slug">
        <h3>{{ topic.title }}</h3>
        <p v-if="topic.summary">{{ topic.summary }}</p>
        <ul>
          <li v-for="lesson in topic.lessons" :key="lesson.id">
            <NuxtLink :to="path + '/lessons/' + lesson.id">{{ lesson.title }}</NuxtLink>
          </li>
        </ul>
      </li>
    </ol>
    <section v-if="data.forks.length">
      <h2>Public Forks</h2>
      <ul>
        <li v-for="f in data.forks" :key="f.login + '/' + f.slug">
          <NuxtLink :to="'/u/' + encodeURIComponent(f.login)">@{{ f.login }}</NuxtLink> /
          <NuxtLink :to="'/u/' + encodeURIComponent(f.login) + '/' + f.slug">{{
            f.title
          }}</NuxtLink>
          · {{ displayDate(f.createdAt) }}
        </li>
      </ul>
    </section>
  </main>
</template>
