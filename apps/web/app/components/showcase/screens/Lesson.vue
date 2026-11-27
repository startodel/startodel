<script setup lang="ts">
import type { QuizResult } from "../../ui/Quiz.vue";
import { sampleLesson, screenPath, type SampleBlock } from "../sample";
const indexTag = useIndexTag();
const props = defineProps<{ state?: string }>();
const lesson = sampleLesson;
const quiz = lesson.blocks.find((b) => b.type === "quiz") as Extract<SampleBlock, { type: "quiz" }>;
const exercise = lesson.blocks.find((b) => b.type === "exercise") as Extract<
  SampleBlock,
  { type: "exercise" }
>;

const answers = ref<(number | undefined)[]>(
  props.state === "answered" ? [quiz.questions[0]!.correct, 0] : [],
);
const result = ref<QuizResult>();
const busy = ref(false);
function judge() {
  result.value = {
    perQuestion: quiz.questions.map((q, i) => answers.value[i] === q.correct),
    feedback: quiz.questions.map((q) => ({ correctIndex: q.correct, explanation: q.explanation })),
  };
}
if (props.state === "answered") judge();
function submit() {
  busy.value = true;
  setTimeout(() => {
    judge();
    busy.value = false;
  }, 600);
}
const allCorrect = computed(() => result.value?.perQuestion.every(Boolean));

const solution = ref<string>();
const revealing = ref(false);
function reveal() {
  revealing.value = true;
  setTimeout(() => {
    solution.value = exercise.solution;
    revealing.value = false;
  }, 500);
}

const titles: Record<SampleBlock["type"], string> = {
  theory: "Not sooner, maybe later",
  code: "timers.cjs",
  callout: "The 1 ms floor",
  link: "The Node.js event loop guide",
  video: "Talk: the event loop in depth",
  quiz: "Quiz · 2 questions",
  exercise: "Exercise: measure the lag",
};
const index = computed(() =>
  lesson.blocks.map((b) => ({
    id: b.id,
    title: titles[b.type],
    done:
      b.type === "quiz" ? allCorrect.value : b.type === "exercise" ? !!solution.value : undefined,
  })),
);
const current = ref(lesson.blocks[0]!.id);
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const seen = entries.filter((e) => e.isIntersecting).map((e) => e.target.id);
      if (seen[0]) current.value = seen[0];
    },
    { rootMargin: "-20% 0px -65% 0px" },
  );
  for (const b of lesson.blocks) {
    const el = document.getElementById(b.id);
    if (el) observer.observe(el);
  }
  onBeforeUnmount(() => observer.disconnect());
});
</script>
<template>
  <ShowcaseApp
    current-track="node"
    :crumbs="[
      { label: 'Node.js runtime internals', to: screenPath('track') },
      {
        label: indexTag('topic', lesson.topicOrdinal) + ' ' + lesson.topic.title,
        to: screenPath('track'),
      },
      { label: indexTag('lesson', lesson.ordinal) },
    ]"
  >
    <article class="lesson">
      <UiLessonHeader
        :title="lesson.title"
        :tag="indexTag('lesson', lesson.ordinal)"
        :topic-title="lesson.topic.title"
        :topic-tag="indexTag('topic', lesson.topicOrdinal)"
        :minutes="lesson.minutes"
        :block-count="lesson.blocks.length"
      >
        <UiMastery :level="allCorrect ? 2 : lesson.topic.level" show="full" />
      </UiLessonHeader>

      <UiLessonLayout>
        <UiLessonBlock
          v-for="(b, i) in lesson.blocks"
          :key="b.id"
          :index="i + 1"
          :block="b"
          :anchor="b.id"
        >
          <UiProse v-if="b.type === 'theory'" :markdown="b.markdown" />
          <div v-else-if="b.type === 'code'" class="s-stack" style="--s-gap: var(--s-3)">
            <UiCodeBlock :code="b.code" :language="b.language" :title="b.title" />
            <UiProse :markdown="b.explanation" size="sm" />
          </div>
          <UiProse v-else-if="b.type === 'callout'" :markdown="b.markdown" size="sm" />
          <UiResourceLink
            v-else-if="b.type === 'link'"
            :title="b.title"
            :url="b.url"
            :note="b.note"
          />
          <UiVideoEmbed
            v-else-if="b.type === 'video'"
            :title="b.title"
            :url="b.url"
            :note="b.note"
          />
          <UiQuiz
            v-else-if="b.type === 'quiz'"
            v-model="answers"
            :name="b.id"
            :questions="b.questions"
            :result="result"
            :busy="busy"
            @submit="submit"
            @retry="((result = undefined), (answers = []))"
          >
            <template #result>
              <UiBadge v-if="allCorrect" tone="verdigris" icon="check">Mastery raised to 2</UiBadge>
            </template>
          </UiQuiz>
          <UiExercise
            v-else-if="b.type === 'exercise'"
            :lesson-id="lesson.id"
            :block-id="b.id"
            :prompt="b.prompt"
            :hints="b.hints"
            :solution="solution"
            :revealing="revealing"
            @reveal="reveal"
          />
        </UiLessonBlock>

        <template #end>
          <UiNotice tone="success" title="Lesson read">
            Reading every Lesson in a Topic raises its Mastery to 1. A fully correct Quiz raises it
            to 2.
          </UiNotice>
          <div class="s-cluster lesson__nav">
            <UiButton icon="arrow-left" :to="screenPath('lesson')"
              >{{ indexTag("lesson", 1) }} The timers phase</UiButton
            >
            <UiButton variant="primary" icon-right="arrow-right" :to="screenPath('lesson')"
              >{{ indexTag("lesson", 3) }} setImmediate and nextTick</UiButton
            >
          </div>
        </template>
        <template #aside>
          <UiLessonIndex :blocks="index" :current="current" />
        </template>
      </UiLessonLayout>
    </article>
  </ShowcaseApp>
</template>
<style scoped>
.lesson {
  display: grid;
  gap: var(--s-10);
}
</style>
