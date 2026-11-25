<script setup lang="ts">
const { t } = useI18n();
const { masteryLabel } = useLearningLabels();
const route = useRoute();
const { data, error } = await useFetch(`/api/lessons/${String(route.params.id)}`);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 500,
    message: t("common.error"),
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
    message.value = t("lesson.readError");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main v-if="data" class="narrow">
    <nav :aria-label="$t('nav.breadcrumb')">
      <NuxtLinkLocale to="/">{{ $t("nav.dashboard") }}</NuxtLinkLocale
      ><span aria-hidden="true">/</span
      ><NuxtLinkLocale
        v-if="track"
        :to="{ path: '/tracks/' + track, query: { topic: data.topic.id } }"
        >{{ data.topic.title }}</NuxtLinkLocale
      ><span v-else>{{ data.topic.title }}</span>
    </nav>
    <h1>{{ data.lesson.title }}</h1>
    <p v-if="data.lesson.summary">{{ data.lesson.summary }}</p>
    <p aria-live="polite" class="muted">
      {{ $t("topic.level", { level: $n(data.mastery) }) }} · {{ masteryLabel(data.mastery) }}
    </p>
    <article class="panel">
      <LessonContent
        v-for="block in data.lesson.blocks"
        :key="block.id"
        :block="block"
        :lesson-id="data.lesson.id"
        @assessed="data.mastery = $event"
      />
      <p v-if="!data.lesson.blocks.length">{{ $t("lesson.empty") }}</p>
    </article>
    <div class="actions">
      <button class="primary" @click="read" :disabled="busy || !!data.readAt">
        {{ data.readAt ? $t("lesson.read") : $t("lesson.mark") }}</button
      ><span role="status">{{
        message || (data.readAt ? $t("topic.level", { level: $n(data.mastery) }) : "")
      }}</span>
    </div>
  </main>
</template>
<style scoped>
main > nav {
  margin-bottom: 1rem;
}
</style>
