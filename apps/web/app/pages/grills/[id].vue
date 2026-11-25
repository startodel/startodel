<script setup lang="ts">
import { displayDate } from "../../utils/dates";
const id = String(useRoute().params.id);
const { data, error, refresh } = await useFetch(`/api/grills/${id}`);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode,
    statusMessage: "Grill session unavailable",
  });
useHead({ title: () => data.value?.title });
const questions = computed(() => data.value?.questions ?? []);
const firstUnanswered = computed(() => questions.value.findIndex((q) => !q.answeredAt));
const answered = computed(() => questions.value.filter((q) => q.answeredAt).length);
const judged = computed(() => questions.value.filter((q) => q.judgedAt).length);
const index = ref(Math.max(firstUnanswered.value, 0));
const current = computed(() => questions.value[index.value]);
const drafts = reactive<Record<string, string>>({});
const message = ref("");
const busy = ref(false);
const isSummary = computed(
  () =>
    data.value?.status === "finished" ||
    (questions.value.length > 0 && judged.value === questions.value.length),
);
async function answer() {
  const question = current.value;
  if (!question || busy.value) return;
  busy.value = true;
  message.value = "";
  try {
    await $fetch(`/api/grills/${id}/questions/${question.id}/answer`, {
      method: "POST",
      body: { answer: drafts[question.id] },
    });
    delete drafts[question.id];
  } catch {
    message.value = "Could not save your answer. Check the current question and try again.";
  } finally {
    await refresh();
    busy.value = false;
  }
}
</script>
<template>
  <main v-if="data" class="narrow">
    <NuxtLink to="/grills">← Grills</NuxtLink>
    <h1>{{ data.title }}</h1>
    <p>
      {{ data.status === "finished" ? "Finished" : "Open session" }} · {{ answered }} answered ·
      {{ judged }} judged · {{ answered - judged }} waiting for your agent
    </p>
    <section v-if="isSummary" class="panel">
      <h2>Session summary</h2>
      <div class="counts">
        <span v-for="v in ['strong', 'partial', 'weak'] as const" :class="v" :key="v"
          >{{ questions.filter((q) => q.verdict === v).length }} {{ v }}</span
        >
      </div>
      <h3>What to reinforce</h3>
      <ul v-if="data.reinforce.length">
        <li v-for="t in data.reinforce" :key="t.id">
          <NuxtLink :to="'/topics/' + t.id">{{ t.title }} Lessons</NuxtLink
          ><span v-if="t.dueAt"> · Review due {{ displayDate(t.dueAt) }}</span>
        </li>
      </ul>
      <p v-else>No Topics with weak or partial Verdicts.</p>
    </section>
    <section v-if="current" class="panel">
      <small>Question {{ index + 1 }} of {{ questions.length }}</small
      ><progress aria-label="Questions answered" :value="answered" :max="questions.length" />
      <h2>{{ current.prompt }}</h2>
      <template v-if="current.answeredAt"
        ><h3>Your answer</h3>
        <p class="answer">{{ current.answer }}</p>
        <template v-if="current.verdict"
          ><strong :class="current.verdict">Verdict · {{ current.verdict }}</strong>
          <p class="answer">{{ current.feedback }}</p></template
        >
        <template v-else
          ><h3>Waiting for your agent</h3>
          <AgentPrompt
            :text="`Judge my answers in grill ${data.title} (${id}) with judge_grill_answer.`"
          /><button @click="refresh()">Refresh feedback</button></template
        ></template
      >
      <form v-else-if="data.status === 'open'" @submit.prevent="answer">
        <label :for="current.id">Your answer</label>
        <textarea
          :id="current.id"
          v-model="drafts[current.id]"
          rows="5"
          required
          :disabled="busy"
        />
        <button class="primary" :disabled="busy || !drafts[current.id]?.trim()">
          Submit answer
        </button>
      </form>
      <p v-else>This question was unanswered when the session finished.</p>
      <p v-if="message" role="alert">{{ message }}</p>
      <nav class="actions" aria-label="Questions">
        <button :disabled="!index || busy" @click="index--">Previous</button
        ><button :disabled="index + 1 === questions.length || busy" @click="index++">Next</button
        ><button
          v-if="firstUnanswered >= 0 && data.status === 'open'"
          :disabled="busy || index === firstUnanswered"
          @click="index = firstUnanswered"
        >
          First unanswered
        </button>
      </nav>
    </section>
    <section v-else class="panel">
      <h2>No questions yet</h2>
      <template v-if="data.status === 'open'"
        ><p>Your agent adds the questions for this session.</p>
        <AgentPrompt :text="`Use add_grill_questions to add questions to ${data.title} (${id}).`"
      /></template>
    </section>
  </main>
</template>
<style scoped>
textarea {
  width: 100%;
  display: block;
  font: inherit;
  padding: 0.7rem;
  margin: 0.4rem 0 1rem;
  border: 1px solid var(--line);
  border-radius: 6px;
}
.answer {
  white-space: pre-wrap;
}
.counts {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}
.strong,
.partial,
.weak {
  display: inline-block;
  border-radius: 4px;
  padding: 0.2rem 0.65rem;
}
.strong {
  color: #185236;
  background: #e4f3e8;
}
.partial {
  color: #694713;
  background: #fff2cf;
}
.weak {
  color: #813722;
  background: #fbe7df;
}
</style>
