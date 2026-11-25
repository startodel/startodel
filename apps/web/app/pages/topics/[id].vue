<script setup lang="ts">
const route = useRoute();
useHead({ title: "Topic Lessons" });
</script>
<template>
  <main class="narrow">
    <h1>Topic Lessons</h1>
    <TopicPanel :id="String(route.params.id)" />
  </main>
</template>
