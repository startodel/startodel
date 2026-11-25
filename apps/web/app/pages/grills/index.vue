<script setup lang="ts">
import { displayDate } from "../../utils/dates";
useHead({ title: "Grills" });
const { data, error, refresh } = await useFetch("/api/grills");
</script>
<template>
  <main>
    <h1>Grills</h1>
    <p>Answer in your own words. Your agent reads each answer and gives feedback.</p>
    <p v-if="error" role="alert">
      Could not load GrillSessions. <button @click="refresh()">Retry</button>
    </p>
    <section v-for="g in data" :key="g.id" class="panel">
      <small
        >{{ g.status === "open" ? "Open" : "Finished" }} · {{ displayDate(g.createdAt) }} ·
        {{ g.track || "Across Tracks" }}</small
      >
      <h2><NuxtLink :to="'/grills/' + g.id">{{ g.title }}</NuxtLink></h2>
      <p>{{ g.answered }} answered · {{ g.judged }} judged · {{ g.total }} questions</p>
    </section>
    <p v-if="data && !data.length">You have no GrillSessions yet.</p>
    <section class="panel narrow">
      <h2>Start a GrillSession</h2>
      <AgentPrompt
        text="Call start_grill for my next round, then use add_grill_questions to add questions for me."
      />
    </section>
  </main>
</template>
