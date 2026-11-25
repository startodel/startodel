<script setup lang="ts">
const { verdictLabel } = useLearningLabels();
const { t } = useI18n();
const displayDate = useDisplayDate();
const id = String(useRoute().params.id);
const { data, error, refresh } = await useFetch(`/api/grills/${id}`);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode,
    message: t("common.error"),
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
    message.value = t("grill.error");
  } finally {
    await refresh();
    busy.value = false;
  }
}
</script>
<template>
  <main v-if="data" class="narrow">
    <NuxtLinkLocale to="/grills">← {{ $t("nav.grills") }}</NuxtLinkLocale>
    <h1>{{ data.title }}</h1>
    <p>
      {{ data.status === "finished" ? $t("grill.finished") : $t("grill.openSession") }} ·
      {{ $t("grill.stats", { answered: $n(answered), judged: $n(judged) }) }} ·
      {{ $t("grill.waitingCount", { waiting: $n(answered - judged) }) }}
    </p>
    <section v-if="isSummary" class="panel">
      <h2>{{ $t("grill.summary") }}</h2>
      <div class="counts">
        <span v-for="v in ['strong', 'partial', 'weak'] as const" :class="v" :key="v"
          >{{ verdictLabel(v) }} · {{ $n(questions.filter((q) => q.verdict === v).length) }}</span
        >
      </div>
      <h3>{{ $t("grill.reinforce") }}</h3>
      <ul v-if="data.reinforce.length">
        <li v-for="t in data.reinforce" :key="t.id">
          <NuxtLinkLocale :to="'/topics/' + t.id">{{
            $t("grill.lessons", { title: t.title })
          }}</NuxtLinkLocale
          ><span v-if="t.dueAt"> · {{ $t("grill.due", { date: displayDate(t.dueAt) }) }}</span>
        </li>
      </ul>
      <p v-else>{{ $t("grill.allStrong") }}</p>
    </section>
    <section v-if="current" class="panel">
      <small>{{
        $t("grill.question", { index: $n(index + 1), total: $n(questions.length) })
      }}</small
      ><progress :aria-label="$t('grill.answered')" :value="answered" :max="questions.length" />
      <h2>{{ current.prompt }}</h2>
      <template v-if="current.answeredAt"
        ><h3>{{ $t("grill.answer") }}</h3>
        <p class="answer">{{ current.answer }}</p>
        <template v-if="current.verdict"
          ><strong :class="current.verdict">{{
            $t("grill.verdict", { verdict: verdictLabel(current.verdict) })
          }}</strong>
          <p class="answer">{{ current.feedback }}</p></template
        >
        <template v-else
          ><h3>{{ $t("grill.waiting") }}</h3>
          <AgentPrompt :text="$t('grill.judgePrompt', { title: data.title, id })" /><button
            @click="refresh()"
          >
            {{ $t("grill.feedback") }}
          </button></template
        ></template
      >
      <form v-else-if="data.status === 'open'" @submit.prevent="answer">
        <label :for="current.id">{{ $t("grill.answer") }}</label>
        <textarea
          :id="current.id"
          v-model="drafts[current.id]"
          rows="5"
          required
          :disabled="busy"
        />
        <button class="primary" :disabled="busy || !drafts[current.id]?.trim()">
          {{ $t("grill.submit") }}
        </button>
      </form>
      <p v-else>{{ $t("grill.unansweredEnd") }}</p>
      <p v-if="message" role="alert">{{ message }}</p>
      <nav class="actions" :aria-label="$t('grill.questions')">
        <button :disabled="!index || busy" @click="index--">{{ $t("grill.previous") }}</button
        ><button :disabled="index + 1 === questions.length || busy" @click="index++">
          {{ $t("grill.next") }}</button
        ><button
          v-if="firstUnanswered >= 0 && data.status === 'open'"
          :disabled="busy || index === firstUnanswered"
          @click="index = firstUnanswered"
        >
          {{ $t("grill.first") }}
        </button>
      </nav>
    </section>
    <section v-else class="panel">
      <h2>{{ $t("grill.empty") }}</h2>
      <template v-if="data.status === 'open'"
        ><p>{{ $t("grill.add") }}</p>
        <AgentPrompt :text="$t('grill.addPrompt', { title: data.title, id })"
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
