<script setup lang="ts">
import { useSampleComments } from "./sample-people";
const indexTag = useIndexTag();
const { thread, inbox, draft, block } = useSampleComments();
const filter = ref<"open" | "resolved" | "all">("open");
// The specimen keeps the author's decisions in memory, so the filter and the counts respond.
const decided = ref(new Map<string, boolean>());
const lessons = computed(() =>
  inbox.value.map((lesson) => ({
    ...lesson,
    comments: lesson.comments.map((comment) => ({
      ...comment,
      resolved: decided.value.get(comment.id) ?? comment.resolved,
    })),
  })),
);
const decide = (id: string, resolved: boolean) =>
  (decided.value = new Map(decided.value).set(id, resolved));
</script>
<template>
  <ShowcaseSpecimen
    id="planned-block-comments"
    label="UiBlockComments · trigger"
    note="Sits with the Block and opens the thread. The count is hidden at zero"
  >
    <p class="s-read" style="flex: 1 1 16rem; max-width: 36rem">{{ block }}</p>
    <UiBlockComments :block="indexTag('block', 5)" :comments="thread" />
    <UiBlockComments :block="indexTag('block', 6)" :comments="[]" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-block-comments-inline"
    label="UiBlockComments · inline"
    note="The same thread in place, for a narrow container and the author's inbox"
    layout="block"
  >
    <div style="max-width: 40rem">
      <UiBlockComments inline :block="indexTag('block', 5)" :comments="thread" />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-block-comments-states"
    label="UiBlockComments · states"
    note="Empty thread, sending, failed, signed out"
    layout="grid"
  >
    <UiBlockComments inline :block="indexTag('block', 2)" :comments="[]" />
    <UiBlockComments
      inline
      :block="indexTag('block', 3)"
      :comments="[]"
      state="sending"
      kind="outdated"
      :text="draft"
    />
    <UiBlockComments
      inline
      :block="indexTag('block', 4)"
      :comments="[]"
      state="failed"
      :text="draft"
    />
    <UiBlockComments
      inline
      :block="indexTag('block', 5)"
      :comments="thread.slice(1, 2)"
      signed-out
    />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-feedback-inbox"
    label="UiFeedbackInbox"
    note="Open comments by Lesson. Reply, resolve, or hand the comment to the agent"
    layout="block"
  >
    <UiFeedbackInbox
      v-model:filter="filter"
      :lessons="lessons"
      @resolve="decide($event, true)"
      @reopen="decide($event, false)"
    />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-feedback-inbox-empty"
    label="UiFeedbackInbox · empty"
    layout="block"
  >
    <UiFeedbackInbox :lessons="[]" />
  </ShowcaseSpecimen>
</template>
