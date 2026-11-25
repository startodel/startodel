<script setup lang="ts">
import { displayDate } from "../../../utils/dates";
const id = String(useRoute().params.topicId);
const url = `/api/reviews/${id}/practice` as const;
const { data, error, refresh } = await useFetch(url);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode,
    statusMessage: "Practice Quiz unavailable",
  });
useHead({ title: "Practice quiz" });
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
    message.value = stale.value
      ? "This review has changed. Load the current questions to practice again."
      : "Could not save this Practice Quiz. Try again.";
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
    <NuxtLink to="/reviews">← Reviews</NuxtLink>
    <h1>Practice quiz</h1>
    <h2>{{ data.title }}</h2>
    <section v-if="result" class="panel" aria-live="polite">
      <h2>{{ result.correct }} of {{ result.total }} correct · {{ result.verdict }}</h2>
      <p>
        Box {{ result.box }} · Next review {{ displayDate(result.dueAt) }} · Mastery
        {{ result.mastery }}
      </p>
      <NuxtLink to="/reviews">Return to reviews</NuxtLink>
    </section>
    <form @submit.prevent="submit">
      <fieldset
        class="panel"
        v-for="(q, i) in data.questions"
        :key="q.lessonId + q.blockId + q.index"
        :disabled="!!result || busy || stale"
      >
        <legend>{{ i + 1 }}. {{ q.prompt }}</legend>
        <label v-for="(option, j) in q.options" :key="j"
          ><input type="radio" required :name="'question-' + i" :value="j" v-model="answers[i]" />
          {{ option }}</label
        >
        <strong v-if="result">{{
          result.results.find((b) => b.lessonId === q.lessonId && b.blockId === q.blockId)
            ?.perQuestion[q.index]
            ? "Correct"
            : "Incorrect"
        }}</strong>
      </fieldset>
      <button v-if="!result && !stale" class="primary" :disabled="busy">
        Submit Practice Quiz
      </button>
    </form>
    <p role="alert" v-if="message">{{ message }}</p>
    <button v-if="stale" @click="reload">Load current questions</button>
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
