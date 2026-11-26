<script setup lang="ts">
import { publicBlock } from "@startodel/core";
definePageMeta({ layout: "site" });
const { t } = useI18n();
const route = useRoute();
const login = encodeURIComponent(String(route.params.login));
const slug = encodeURIComponent(String(route.params.slug));
const id = encodeURIComponent(String(route.params.lessonId));
const path = "/u/" + login + "/" + slug;
const { data, error } = await useFetch(`/api/public/${login}/${slug}/lessons/${id}`, {
  transform: (lesson) => ({ ...lesson, blocks: lesson.blocks.map(publicBlock) }),
});
const lesson = data.value;
if (!lesson)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    message: t("common.error"),
  });
usePublicHead(
  t("public.lessonTitle", { title: lesson.title }),
  lesson.summary || t("public.lesson", { title: lesson.trackTitle }),
  path + "/lessons/" + id,
  "article",
  (pageUrl) => ({
    "@type": "LearningResource",
    name: lesson.title,
    isPartOf: { "@type": "Course", name: lesson.trackTitle, url: pageUrl(path) },
  }),
);
const index = computed(
  () =>
    data.value?.blocks.map((b) => ({
      id: "lesson-block-" + b.id,
      kind: b.type,
      title: "title" in b ? b.title : t(`block.${b.type}`),
    })) ?? [],
);
</script>
<template>
  <article v-if="data" class="s-page s-stack">
    <UiBreadcrumbs
      :items="[
        { label: '@' + route.params.login, to: '/u/' + login },
        { label: data.trackTitle, to: path },
        { label: data.title },
      ]"
    />
    <UiPageHeader :title="data.title" :description="data.summary ?? undefined" voice="content" />
    <div v-if="data.blocks.length" class="s-split">
      <div class="s-stack">
        <UiLessonBlock
          v-for="(b, i) in data.blocks"
          :key="b.id"
          :index="i + 1"
          :kind="b.type"
          :anchor="'lesson-block-' + b.id"
        >
          <UiProse v-if="b.type === 'theory'" :markdown="b.markdown" />
          <template v-else-if="b.type === 'code'">
            <UiCodeBlock :code="b.code" :language="b.language" />
            <UiProse v-if="b.explanation" :markdown="b.explanation" size="sm" />
          </template>
          <UiCallout v-else-if="b.type === 'callout'" :kind="b.variant"
            ><UiProse :markdown="b.markdown" size="sm"
          /></UiCallout>
          <template v-else-if="b.type === 'link' || b.type === 'video'">
            <UiResourceLink v-if="b.type === 'link'" :title="b.title" :url="b.url" />
            <UiVideoEmbed v-else :title="b.title" :url="b.url" />
            <UiProse v-if="b.note" :markdown="b.note" size="sm" />
          </template>
          <UiQuiz v-else-if="b.type === 'quiz'" :name="b.id" :questions="b.questions" read-only />
          <UiExercise
            v-else-if="b.type === 'exercise'"
            :prompt="b.prompt"
            :hints="b.hints"
            read-only
          />
        </UiLessonBlock>
      </div>
      <UiLessonIndex :blocks="index" />
    </div>
    <UiEmptyState v-else :title="$t('lesson.empty')" icon="lesson" />
  </article>
  <UiSkeletonList v-else />
</template>
