<script setup lang="ts">
const { data, error, refresh } = await useFetch("/api/next-step");
</script>
<template>
  <section class="panel next">
    <h2>Next up</h2>
    <p v-if="error" role="alert">
      Could not load your next step. <button @click="refresh()">Retry</button>
    </p>
    <template v-if="data">
      <p v-if="'title' in data">
        <strong>{{ data.title }}</strong> · {{ data.unanswered }} unanswered ·
        {{ data.waiting }} waiting for your agent
      </p>
      <template v-else-if="'suggestions' in data"
        ><p>These Topics are ready to study.</p>
        <ul>
          <li v-for="t in data.suggestions" :key="t.id">
            <NuxtLink :to="'/topics/' + t.id">{{ t.title }}</NuxtLink>
          </li>
        </ul></template
      >
      <p v-else>{{ data.why }}</p>
      <NuxtLink v-if="'href' in data" :to="data.href" class="button primary">{{
        data.label
      }}</NuxtLink>
      <AgentPrompt v-if="'prompt' in data" :text="data.prompt" />
    </template>
  </section>
</template>
<style scoped>
.next {
  border-left: 4px solid var(--green);
}
</style>
