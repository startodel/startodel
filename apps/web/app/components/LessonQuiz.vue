<script setup lang="ts">
import type { LessonBlock } from "../../shared/types/lesson";
const props = defineProps<{ lessonId: string; quiz: Extract<LessonBlock, { type: "quiz" }> }>();
const emit = defineEmits<{ assessed: [level: number] }>();
const answers = ref<(number | undefined)[]>([]);
const result = ref<{
  correct: number;
  total: number;
  perQuestion: boolean[];
  feedback: { correctIndex: number; explanation?: string }[];
}>();
const busy = ref(false);
const message = ref("");
async function submit() {
  busy.value = true;
  message.value = "";
  try {
    const scored = await $fetch(`/api/lessons/${props.lessonId}/quiz/${props.quiz.id}`, {
      method: "POST",
      body: { answers: answers.value },
    });
    result.value = scored;
    emit("assessed", scored.mastery);
  } catch {
    message.value = "Could not record your answers. Try again.";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <form @submit.prevent="submit">
    <h2>Quiz</h2>
    <fieldset v-for="(q, i) in quiz.questions" :key="i" :disabled="busy">
      <legend>{{ q.prompt }}</legend>
      <label v-for="(option, index) in q.options" :key="index"
        ><input
          type="radio"
          :name="quiz.id + '-' + i"
          required
          v-model="answers[i]"
          :value="index"
          @change="result = undefined"
        />
        {{ option }}</label
      >
      <div v-if="result" class="feedback">
        <strong>{{ result.perQuestion[i] ? "Correct" : "Incorrect" }}</strong
        ><span v-if="!result.perQuestion[i]">
          · Correct answer: {{ q.options[result.feedback[i]!.correctIndex] }}</span
        ><LessonMarkdown
          v-if="result.feedback[i]?.explanation"
          :text="result.feedback[i]!.explanation!"
        />
      </div>
    </fieldset>
    <button :disabled="busy" class="primary">Submit answers</button>
    <p role="status">
      {{ result ? result.correct + " of " + result.total + " correct" : message }}
    </p>
  </form>
</template>
<style scoped>
fieldset {
  margin-bottom: 1rem;
}
label {
  display: block;
  padding: 0.3rem 0;
}
.feedback {
  margin-top: 0.5rem;
  padding: 0.7rem;
  border-left: 3px solid var(--green);
  background: #eff4ee;
}
</style>
