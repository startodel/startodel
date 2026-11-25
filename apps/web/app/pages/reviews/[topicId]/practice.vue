<script setup lang="ts">
const { verdictLabel } = useLearningLabels();
const { t } = useI18n();
const displayDate = useDisplayDate();
const id = String(useRoute().params.topicId);
const url = `/api/reviews/${id}/practice` as const;
const { data, error, refresh } = await useFetch(url);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode,
    message: t("common.error"),
  });
useHead({ title: t("review.practice") });
const answers = ref<number[]>([]);
const busy = ref(false);
const message = ref("");
const stale = ref(false);
async function send(quiz: NonNullable<typeof data.value>) {
  const blocks = new Map<string, { lessonId: string; blockId: string; answers: number[] }>();
  quiz.questions.forEach((q, i) => {
    const key = q.lessonId + "/" + q.blockId;
    const block = blocks.get(key) ?? { lessonId: q.lessonId, blockId: q.blockId, answers: [] };
    block.answers[q.index] = answers.value[i]!;
    blocks.set(key, block);
  });
  return $fetch(url, {
    method: "POST",
    body: { revision: quiz.revision, answers: [...blocks.values()] },
  });
}
const result = ref<Awaited<ReturnType<typeof send>>>();
async function submit() {
  if (!data.value || busy.value || result.value) return;
  busy.value = true;
  message.value = "";
  try {
    result.value = await send(data.value);
  } catch (error) {
    stale.value =
      !!error && typeof error === "object" && "statusCode" in error && error.statusCode === 409;
    message.value = stale.value ? t("review.stale") : t("review.saveError");
  } finally {
    busy.value = false;
  }
}
async function reload() {
  await refresh();
  answers.value = [];
  message.value = "";
  stale.value = false;
}
</script>
<template>
  <main v-if="data" class="narrow">
    <NuxtLinkLocale to="/reviews">← {{ $t("nav.reviews") }}</NuxtLinkLocale>
    <h1>{{ $t("review.practice") }}</h1>
    <h2>{{ data.title }}</h2>
    <section v-if="result" class="panel" aria-live="polite">
      <h2>
        {{ $t("quiz.score", { correct: $n(result.correct), total: $n(result.total) }) }} ·
        {{ verdictLabel(result.verdict) }}
      </h2>
      <p>
        {{
          $t("review.next", {
            box: $n(result.box),
            date: displayDate(result.dueAt),
            level: $n(result.mastery),
          })
        }}
      </p>
      <NuxtLinkLocale to="/reviews">{{ $t("review.return") }}</NuxtLinkLocale>
    </section>
    <form @submit.prevent="submit">
      <fieldset
        class="panel"
        v-for="(q, i) in data.questions"
        :key="q.lessonId + q.blockId + q.index"
        :disabled="!!result || busy || stale"
      >
        <legend>{{ $n(i + 1) }}. {{ q.prompt }}</legend>
        <label v-for="(option, j) in q.options" :key="j"
          ><input type="radio" required :name="'question-' + i" :value="j" v-model="answers[i]" />
          {{ option }}</label
        >
        <strong v-if="result">{{
          result.results.find((b) => b.lessonId === q.lessonId && b.blockId === q.blockId)
            ?.perQuestion[q.index]
            ? $t("quiz.right")
            : $t("quiz.wrong")
        }}</strong>
      </fieldset>
      <button v-if="!result && !stale" class="primary" :disabled="busy">
        {{ $t("review.submit") }}
      </button>
    </form>
    <p role="alert" v-if="message">{{ message }}</p>
    <button v-if="stale" @click="reload">{{ $t("review.reload") }}</button>
  </main>
</template>
<style scoped>
label {
  display: block;
  padding: 0.35rem 0;
}
legend {
  padding: 0 0.5rem;
}
</style>
