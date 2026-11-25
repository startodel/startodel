<script setup lang="ts">
import { LEGAL_TERMS_VERSION, type ForkedFrom } from "@startodel/core";
import { displayDate } from "../utils/dates";
const props = defineProps<{
  track: {
    id: string;
    slug: string;
    public: boolean;
    forkCount: number;
    forkedFrom: ForkedFrom | null;
  };
  acceptance: { version: string | null; at: string | null } | undefined;
}>();
const emit = defineEmits<{ changed: [] }>();
const { user } = useUserSession();
const origin = usePublicOrigin();
const url = computed(
  () => origin.value + "/u/" + encodeURIComponent(user.value?.login ?? "") + "/" + props.track.slug,
);
const accepted = computed(
  () => props.acceptance?.version === LEGAL_TERMS_VERSION && props.acceptance.at,
);
const dialog = ref<HTMLDialogElement>();
const agree = ref(false);
const busy = ref(false);
const message = ref("");
function confirmVisibility() {
  agree.value = false;
  message.value = "";
  dialog.value?.showModal();
}
async function save() {
  busy.value = true;
  try {
    await $fetch(`/api/tracks/${props.track.id}/visibility`, {
      method: "PATCH",
      body: { public: !props.track.public, ...(agree.value ? { acceptTerms: true } : {}) },
    });
    emit("changed");
    dialog.value?.close();
  } catch {
    message.value = "Could not change visibility. Reload the Track and try again.";
  } finally {
    busy.value = false;
  }
}
async function copy() {
  try {
    await navigator.clipboard.writeText(url.value);
    message.value = "Copied";
  } catch {
    message.value = "Select and copy the public URL.";
  }
}
</script>
<template>
  <section class="panel" aria-label="Track visibility">
    <div class="actions">
      <strong>Visibility · {{ track.public ? "Public" : "Private" }}</strong>
      <button @click="confirmVisibility">{{ track.public ? "Make private" : "Make public" }}</button
      ><span>{{ track.forkCount }} {{ track.forkCount === 1 ? "fork" : "forks" }}</span>
    </div>
    <ForkedFrom v-if="track.forkedFrom" :from="track.forkedFrom" />
    <div v-if="track.public" class="actions">
      <a :href="url">{{ url }}</a><button @click="copy">Copy public URL</button>
    </div>
    <span role="status">{{ message }}</span>
    <dialog ref="dialog" aria-labelledby="visibility-title">
      <form @submit.prevent="save">
        <h2 id="visibility-title">
          {{ track.public ? "Make this Track private?" : "Publish this Track?" }}
        </h2>
        <p v-if="track.public">
          The public page will close immediately. Existing forks and copies remain available to
          their owners.
        </p>
        <template v-else
          ><p>
            Anyone can read your Track, sources, Topic graph and Lessons under your login. A
            signed-in learner can fork the content, including Quiz answers and Exercise solutions.
            Your learning activity stays private.
          </p>
          <p v-if="accepted">You accepted the terms on {{ displayDate(accepted) }}.</p>
          <label v-else
            ><input v-model="agree" type="checkbox" required /> I agree to the
            <a href="/rules" target="_blank" rel="noopener">Publishing rules</a> and
            <a href="/terms" target="_blank" rel="noopener">Terms of Use</a></label
          ></template
        >
        <div class="actions">
          <button type="button" @click="dialog?.close()">Cancel</button
          ><button class="primary" :disabled="busy || (!track.public && !accepted && !agree)">
            {{ track.public ? "Make private" : "Publish" }}
          </button>
        </div>
        <span role="status">{{ message }}</span>
      </form>
    </dialog>
  </section>
</template>
<style scoped>
dialog {
  max-width: min(32rem, 90vw);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1.5rem;
  color: var(--ink);
}
dialog::backdrop {
  background: #142b2390;
}
dialog h2 {
  margin-top: 0;
}
</style>
