<script setup lang="ts">
import type { LessonBlock } from "../../shared/types/lesson";
import { httpUrl, youtubeEmbed } from "../utils/links";
const props = defineProps<{ block: LessonBlock; lessonId: string }>();
const solution = ref("");
const message = ref("");
async function reveal(event: Event) {
  if (!(event.target as HTMLDetailsElement).open || solution.value) return;
  message.value = "Loading solution…";
  try {
    const result = await $fetch(
      `/api/lessons/${props.lessonId}/exercise/${props.block.id}/solution`,
    );
    solution.value = result.solution;
    message.value = "";
  } catch {
    message.value = "Could not load the solution. Close and reopen to retry.";
  }
}
const loadVideo = ref(false);
defineEmits<{ assessed: [level: number] }>();
</script>
<template>
  <div class="block">
    <LessonMarkdown v-if="block.type === 'theory'" :text="block.markdown" />
    <template v-else-if="block.type === 'code'"
      ><LessonCode :code="block.code" :language="block.language" /><LessonMarkdown
        v-if="block.explanation"
        :text="block.explanation"
    /></template>
    <aside v-else-if="block.type === 'callout'" :class="['callout', block.variant]">
      <strong>{{ block.variant }}</strong><LessonMarkdown :text="block.markdown" />
    </aside>
    <div v-else-if="block.type === 'link'" class="resource">
      <a
        v-if="httpUrl(block.url)"
        :href="httpUrl(block.url)"
        target="_blank"
        rel="noopener noreferrer"
        >{{ block.title }} ↗</a
      ><span v-else>{{ block.title }}</span><LessonMarkdown v-if="block.note" :text="block.note" />
    </div>
    <figure v-else-if="block.type === 'video'">
      <button
        v-if="youtubeEmbed(block.url) && !loadVideo"
        class="video-preview"
        type="button"
        @click="loadVideo = true"
        :aria-label="'Load video: ' + block.title"
      >
        <span aria-hidden="true">▶</span> Load video
      </button>
      <iframe
        v-else-if="youtubeEmbed(block.url)"
        :src="youtubeEmbed(block.url)"
        :title="block.title"
        loading="lazy"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      />
      <figcaption>{{ block.title }}</figcaption>
      <LessonMarkdown v-if="block.note" :text="block.note" />
    </figure>
    <LessonQuiz
      v-else-if="block.type === 'quiz'"
      :quiz="block"
      :lesson-id="lessonId"
      @assessed="$emit('assessed', $event)"
    />
    <section v-else>
      <h2>Exercise</h2>
      <LessonMarkdown :text="block.prompt" />
      <details v-for="(hint, i) in block.hints" :key="i">
        <summary>Hint {{ i + 1 }}</summary>
        <LessonMarkdown :text="hint" />
      </details>
      <details @toggle="reveal">
        <summary>Show solution</summary>
        <LessonMarkdown v-if="solution" :text="solution" /><span role="status">{{ message }}</span>
      </details>
    </section>
  </div>
</template>
<style scoped>
.block + .block {
  margin-top: 1.8rem;
}
.callout,
.resource {
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 6px;
}
.callout strong {
  text-transform: capitalize;
}
.gotcha {
  background: #fff1e0;
  border-left: 4px solid #b15d22;
}
.production {
  background: #eaf1f9;
  border-left: 4px solid #42709b;
}
.tip {
  background: #eaf4ec;
  border-left: 4px solid #387355;
}
.block figure {
  margin: 0;
}
iframe {
  border: 0;
  width: 100%;
  aspect-ratio: 16/9;
  background: #eff2ee;
  border-radius: 6px;
}
.video-preview {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 2.3rem 1rem;
  background: #244b40;
  color: white;
  margin-bottom: 0.5rem;
}
figcaption {
  font-weight: 600;
}
.block details {
  margin-top: 0.7rem;
}
.block :deep(.prose) {
  margin-top: 0.5rem;
}
</style>
