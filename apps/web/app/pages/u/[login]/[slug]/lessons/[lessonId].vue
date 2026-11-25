<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
const login = encodeURIComponent(String(route.params.login));
const slug = encodeURIComponent(String(route.params.slug));
const id = encodeURIComponent(String(route.params.lessonId));
const path = "/u/" + login + "/" + slug;
const { data, error } = await useFetch(`/api/public/${login}/${slug}/lessons/${id}`);
if (!data.value)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    message: t("common.error"),
  });
usePublicHead(
  t("public.lessonTitle", { title: data.value.title }),
  data.value.summary || t("public.lesson", { title: data.value.trackTitle }),
  path + "/lessons/" + id,
  "article",
);
</script>
<template>
  <main v-if="data" class="narrow">
    <NuxtLinkLocale :to="path">← {{ data.trackTitle }}</NuxtLinkLocale>
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
      <p v-if="!data.blocks.length">{{ $t("lesson.empty") }}</p>
    </article>
  </main>
</template>
