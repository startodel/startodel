<script setup lang="ts">
useHead({ title: "Dashboard" });
const { data, error, refresh } = await useFetch("/api/dashboard");
</script>
<template>
  <main>
    <h1>Dashboard</h1>
    <p v-if="error" role="alert">
      Could not load your Tracks. <button @click="refresh()">Retry</button>
    </p>
    <template v-if="data"
      ><p class="muted">
        {{ data.tracks.length }} {{ data.tracks.length === 1 ? "Track" : "Tracks" }} ·
        {{ data.dueReviewsCount }} reviews due
      </p>
      <section v-if="data.tracks.length">
        <h2>Your Tracks</h2>
        <div class="cards">
          <article v-for="t in data.tracks" :key="t.trackId" class="panel">
            <h3><NuxtLink :to="'/tracks/' + t.trackId">{{ t.title }}</NuxtLink></h3>
            <p>{{ t.completed }} of {{ t.total }} Topics at Mastery 2 or higher</p>
            <progress :aria-label="t.title + ' completion'" :value="t.percent" max="100" /><small
              >{{ t.percent }}% complete
              <strong v-if="t.total && t.completed === t.total"> · Track complete</strong></small
            >
          </article>
        </div>
      </section>
      <section v-else class="panel narrow">
        <h2>Build your first Track</h2>
        <p>
          Connect your external agent, then tell it what you want to learn. Its Track and Lessons
          will appear here.
        </p>
        <NuxtLink to="/onboarding/connect" class="button primary">Connect your agent</NuxtLink
        ><AgentConfig />
      </section>
    </template>
  </main>
</template>
<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));
  gap: 1rem;
}
.cards .panel {
  margin: 0;
}
.cards h3 {
  font-size: 1.35rem;
}
</style>
