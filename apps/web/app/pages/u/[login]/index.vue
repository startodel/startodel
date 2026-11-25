<script setup lang="ts">
const login = encodeURIComponent(String(useRoute().params.login));
const { data, error } = await useFetch(`/api/public/${login}`);
if (!data.value)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: "Public Profile unavailable",
  });
usePublicHead(
  data.value.name || data.value.login,
  "Public Tracks by @" + data.value.login,
  "/u/" + login,
  "profile",
);
</script>
<template>
  <main v-if="data" class="narrow">
    <div class="actions">
      <img v-if="data.avatarUrl" :src="data.avatarUrl" alt="" width="64" height="64" />
      <div>
        <h1>{{ data.name || data.login }}</h1>
        <span>@{{ data.login }}</span>
      </div>
    </div>
    <h2>Public Tracks</h2>
    <p v-if="!data.tracks.length">No Public Tracks yet.</p>
    <article v-for="track in data.tracks" :key="track.slug" class="panel">
      <h3><NuxtLink :to="'/u/' + login + '/' + track.slug">{{ track.title }}</NuxtLink></h3>
      <p v-if="track.description">{{ track.description }}</p>
      <small>{{ track.forkCount }} {{ track.forkCount === 1 ? "fork" : "forks" }}</small>
    </article>
  </main>
</template>
