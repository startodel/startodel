<script setup lang="ts">
import { MASTERY_LABELS } from "@startodel/core";
const route = useRoute();
const { data, error } = await useFetch(`/api/lessons/${String(route.params.id)}`);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: "Lesson unavailable",
  });
useHead({ title: () => data.value?.lesson.title });
const track = computed(() =>
  typeof route.query.track === "string" && /^[a-f0-9-]{36}$/i.test(route.query.track)
    ? route.query.track
    : undefined,
);
const busy = ref(false);
const message = ref("");
async function read() {
  if (!data.value) return;
  busy.value = true;
  message.value = "";
  try {
    const progress = await $fetch(`/api/lessons/${data.value.lesson.id}/read`, { method: "POST" });
    data.value.readAt = progress.readAt;
    data.value.mastery = progress.mastery;
  } catch {
    message.value = "Could not save your read state. Try again.";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main v-if="data" class="narrow">
    <nav aria-label="Breadcrumb">
      <NuxtLink to="/">Dashboard</NuxtLink><span aria-hidden="true">/</span
      ><NuxtLink v-if="track" :to="{ path: '/tracks/' + track, query: { topic: data.topic.id } }">{{
        data.topic.title
      }}</NuxtLink
      ><span v-else>{{ data.topic.title }}</span>
    </nav>
    <h1>{{ data.lesson.title }}</h1>
    <p v-if="data.lesson.summary">{{ data.lesson.summary }}</p>
    <p aria-live="polite" class="muted">
      Topic Mastery {{ data.mastery }} · {{ MASTERY_LABELS[data.mastery] }}
    </p>
    <article class="panel">
      <LessonContent
        v-for="block in data.lesson.blocks"
        :key="block.id"
        :block="block"
        :lesson-id="data.lesson.id"
        @assessed="data.mastery = $event"
      />
      <p v-if="!data.lesson.blocks.length">This Lesson has no Blocks yet.</p>
    </article>
    <div class="actions">
      <button class="primary" @click="read" :disabled="busy || !!data.readAt">
        {{ data.readAt ? "Marked as read" : "Mark as read" }}</button
      ><span role="status">{{
        message || (data.readAt ? "Topic Mastery " + data.mastery : "")
      }}</span>
    </div>
  </main>
</template>
<style scoped>
main > nav {
  margin-bottom: 1rem;
}
</style>
