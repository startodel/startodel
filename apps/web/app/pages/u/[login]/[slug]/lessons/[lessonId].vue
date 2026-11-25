<script setup lang="ts">
const route = useRoute();
const login = encodeURIComponent(String(route.params.login));
const slug = encodeURIComponent(String(route.params.slug));
const id = encodeURIComponent(String(route.params.lessonId));
const path = "/u/" + login + "/" + slug;
const { data, error } = await useFetch(`/api/public/${login}/${slug}/lessons/${id}`);
if (!data.value)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: "Public Lesson unavailable",
  });
usePublicHead(
  data.value.title,
  data.value.summary || "A Lesson in " + data.value.trackTitle,
  path + "/lessons/" + id,
  "article",
);
</script>
<template>
  <main v-if="data" class="narrow">
    <NuxtLink :to="path">← {{ data.trackTitle }}</NuxtLink>
    <h1>{{ data.title }}</h1>
    <p v-if="data.summary">{{ data.summary }}</p>
    <article class="panel">
      <LessonContent
        v-for="block in data.blocks"
        :key="block.id"
        :block="block"
        :lesson-id="id"
        read-only
      />
      <p v-if="!data.blocks.length">This Lesson has no Blocks yet.</p>
    </article>
  </main>
</template>
