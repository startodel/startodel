<script setup lang="ts">
import { screenPath } from "../sample";
import { useSampleAccess } from "./sample-people";
const { title, visitor, learner, requests, grants, message, daysAgo } = useSampleAccess();
// The specimen answers requests in memory, so both lists and their counts respond.
const answered = ref(new Set<string>());
const revoked = ref(new Set<string>());
const approved = ref<string[]>([]);
const pending = computed(() => requests.value.filter((request) => !answered.value.has(request.id)));
const granted = computed(() => [
  ...requests.value
    .filter((request) => approved.value.includes(request.id))
    .map((request) => ({
      id: "from-" + request.id,
      learner: request.learner,
      grantedAt: daysAgo(0),
      lastActiveAt: null,
    })),
  ...grants.value.filter((grant) => !revoked.value.has(grant.id)),
]);
function answer(id: string, approve: boolean) {
  answered.value = new Set(answered.value).add(id);
  if (approve) approved.value = [...approved.value, id];
}
const handle = ref("");
const addError = ref<"unknown" | "exists" | null>(null);
function add(value: string) {
  addError.value = grants.value.some((grant) => grant.learner.handle === value)
    ? "exists"
    : "unknown";
}
watch(handle, () => (addError.value = null));
const draft = ref("");
</script>
<template>
  <ShowcaseSpecimen
    id="planned-track-access"
    label="UiTrackAccess"
    note="How a Track is shared: a shape and a word"
  >
    <UiTrackAccess access="private" />
    <UiTrackAccess access="public" />
    <UiTrackAccess access="gated" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-track-syllabus"
    label="UiTrackSyllabus · visitor"
    note="A locked Lesson stays unlinked. A preview Lesson is a link"
    layout="block"
  >
    <div class="s-stack" style="max-width: 44rem">
      <p class="s-cluster"><strong>{{ title }}</strong><UiTrackAccess access="gated" /></p>
      <UiTrackSyllabus :topics="visitor" />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-track-syllabus-granted"
    label="UiTrackSyllabus · with access"
    note="Every Lesson is a link and carries its read mark"
    layout="block"
  >
    <div style="max-width: 44rem"><UiTrackSyllabus :topics="learner.slice(0, 3)" /></div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-access-request"
    label="UiAccessRequest"
    note="Signed out, can request, pending, granted, declined"
    layout="grid"
  >
    <UiAccessRequest state="signed-out" :sign-in-to="screenPath('signin')" />
    <UiAccessRequest v-model:message="draft" state="available" />
    <UiAccessRequest state="pending" :requested-at="daysAgo(2)" />
    <UiAccessRequest state="granted" :start-to="screenPath('lesson')" />
    <UiAccessRequest state="declined" />
    <UiAccessRequest state="available" :message="message" busy />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-access-grants"
    label="UiAccessGrants"
    note="Requests first, then a grant by handle and the learners with access. Try a handle"
    layout="block"
  >
    <div class="s-stack">
      <p class="s-cluster"><strong>{{ title }}</strong><UiTrackAccess access="gated" /></p>
      <UiAccessGrants
        v-model:handle="handle"
        :requests="pending"
        :grants="granted"
        :add-error="addError"
        @approve="answer($event, true)"
        @decline="answer($event, false)"
        @add="add"
        @revoke="revoked = new Set(revoked).add($event)"
      />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-access-grants-empty"
    label="UiAccessGrants · empty"
    note="No requests, nobody let in yet, and a handle that does not exist"
    layout="block"
  >
    <UiAccessGrants :requests="[]" :grants="[]" handle="postgres-fan" add-error="unknown" />
  </ShowcaseSpecimen>
</template>
