<script setup lang="ts">
import { LEGAL_TERMS_VERSION, type ForkedFrom } from "@startodel/core";
const countArgs = useCountArgs();
const { t } = useI18n();
const displayDate = useDisplayDate();
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
const localePath = useLocalePath();
const url = computed(
  () =>
    origin.value +
    localePath("/u/" + encodeURIComponent(user.value?.login ?? "") + "/" + props.track.slug),
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
    message.value = t("visibility.error");
  } finally {
    busy.value = false;
  }
}
async function copy() {
  try {
    await navigator.clipboard.writeText(url.value);
    message.value = t("common.copied");
  } catch {
    message.value = t("visibility.manual");
  }
}
</script>
<template>
  <section class="panel" :aria-label="$t('visibility.label')">
    <div class="actions">
      <strong>{{ track.public ? $t("visibility.public") : $t("visibility.private") }}</strong>
      <button @click="confirmVisibility">
        {{ track.public ? $t("visibility.unpublish") : $t("visibility.makePublic") }}</button
      ><span>{{ $t("count.forks", countArgs(track.forkCount)) }}</span>
    </div>
    <ForkedFrom v-if="track.forkedFrom" :from="track.forkedFrom" />
    <div v-if="track.public" class="actions">
      <a :href="url">{{ url }}</a><button @click="copy">{{ $t("visibility.copy") }}</button>
    </div>
    <span role="status">{{ message }}</span>
    <dialog ref="dialog" aria-labelledby="visibility-title">
      <form @submit.prevent="save">
        <h2 id="visibility-title">
          {{ track.public ? $t("visibility.closeTitle") : $t("visibility.publishTitle") }}
        </h2>
        <p v-if="track.public">{{ $t("visibility.closeInfo") }}</p>
        <template v-else
          ><p>{{ $t("visibility.publishInfo") }}</p>
          <p v-if="accepted">{{ $t("visibility.accepted", { date: displayDate(accepted) }) }}</p>
          <label v-else
            ><input v-model="agree" type="checkbox" required />
            <i18n-t keypath="visibility.agree" scope="global">
              <template #rules
                ><NuxtLinkLocale to="/rules" target="_blank" rel="noopener">{{
                  $t("visibility.rules")
                }}</NuxtLinkLocale></template
              >
              <template #terms
                ><NuxtLinkLocale to="/terms" target="_blank" rel="noopener">{{
                  $t("visibility.terms")
                }}</NuxtLinkLocale></template
              >
            </i18n-t></label
          ></template
        >
        <div class="actions">
          <button type="button" @click="dialog?.close()">{{ $t("common.cancel") }}</button
          ><button class="primary" :disabled="busy || (!track.public && !accepted && !agree)">
            {{ track.public ? $t("visibility.unpublish") : $t("visibility.publish") }}
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
