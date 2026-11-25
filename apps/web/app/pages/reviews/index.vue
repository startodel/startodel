<script setup lang="ts">
const { t } = useI18n();
const { masteryLabel, verdictLabel } = useLearningLabels();
const displayDate = useDisplayDate();
useHead({ title: t("nav.reviews") });
const { data, error, refresh } = await useFetch("/api/reviews");
</script>
<template>
  <main>
    <h1>{{ $t("nav.reviews") }}</h1>
    <p v-if="error" role="alert">
      {{ $t("review.load") }} <button @click="refresh()">{{ $t("common.retry") }}</button>
    </p>
    <template v-if="data"
      ><section v-for="group in ['due', 'upcoming'] as const" :key="group">
        <h2>
          {{ group === "due" ? $t("review.due") : $t("review.upcoming") }}
          <small>({{ $n(data[group].length) }})</small>
        </h2>
        <p v-if="!data[group].length" class="muted">
          {{ group === "due" ? $t("review.done") : $t("review.none") }}
        </p>
        <article v-for="item in data[group]" :key="item.topicId" class="panel">
          <small>{{
            $t("review.schedule", { date: displayDate(item.dueAt), box: $n(item.box) })
          }}</small>
          <h3>{{ item.title }}</h3>
          <p>
            {{ $t("topic.level", { level: $n(item.level) }) }} · {{ masteryLabel(item.level)
            }}<span v-if="item.lastResult">
              · {{ $t("review.last", { result: verdictLabel(item.lastResult) }) }}</span
            >
          </p>
          <p v-if="item.reason">{{ item.reason }}</p>
          <div class="actions">
            <NuxtLinkLocale
              v-if="item.hasQuiz"
              class="button primary"
              :to="'/reviews/' + item.topicId + '/practice'"
              >{{ $t("review.practice") }}</NuxtLinkLocale
            ><NuxtLinkLocale :to="'/topics/' + item.topicId">{{
              $t("topic.lessons")
            }}</NuxtLinkLocale>
          </div>
          <template v-if="!item.hasQuiz"
            ><h4>{{ $t("review.ask") }}</h4>
            <AgentPrompt :text="$t('review.prompt', { title: item.title, id: item.topicId })"
          /></template>
        </article></section
    ></template>
  </main>
</template>
