<script setup lang="ts">
import { sampleEdges, sampleForks, samplePublicTrack, sampleSyllabus, screenPath } from "../sample";
import { publicTrackTopics } from "../../../utils/public-track";
const indexTag = useIndexTag();
const props = defineProps<{ state?: string }>();
const track = samplePublicTrack;
const { language, options, filtered } = useTrackLanguageFilter(() => sampleForks);
const owner = computed(() => props.state === "owner" || props.state === "publish");
const publishing = ref(props.state === "publish");
const agree = ref(false);
const busy = ref(false);
const forking = ref(false);
const forked = ref(false);
const topics = publicTrackTopics(indexTag, sampleSyllabus, sampleEdges, () => screenPath("lesson"));
const description = splitTrackDescription(track.description);
const displayDate = useDisplayDate();
const publicUrl = useRequestURL().origin + useLocalePath()(screenPath("public-track"));
const { push: notify } = useToast();
function fork() {
  forking.value = true;
  setTimeout(() => {
    forking.value = false;
    forked.value = true;
    notify({ tone: "success", title: "Fork created", text: "It is private until you publish it." });
  }, 700);
}
function publish() {
  busy.value = true;
  setTimeout(() => {
    busy.value = false;
    publishing.value = false;
    notify({
      tone: "success",
      title: "Track published",
      text: "Anyone with the link can read it.",
    });
  }, 700);
}
</script>
<template>
  <ShowcaseSite :signed-in="owner">
    <UiPublicTrack
      :title="track.title"
      :slug="track.slug"
      :description="description"
      :author="{ ...track.owner, avatarUrl: null }"
      :profile-to="screenPath('public-profile')"
      :public-url="publicUrl"
      :topics="topics"
      :edges="sampleEdges"
      :sources="track.sources"
      :dates="
        $t('public.created', {
          created: displayDate(track.createdAt),
          updated: displayDate(track.updatedAt),
        })
      "
      :fork-count="track.forkCount + Number(forked)"
    >
      <template #forked-from>
        <UiForkedFrom
          :login="track.forkedFrom.login"
          :slug="track.forkedFrom.slug"
          :to="screenPath('public-track')"
        />
      </template>
      <template #actions>
        <UiButton
          v-if="owner"
          variant="primary"
          :to="screenPath('track')"
          icon-right="arrow-right"
          >{{ $t("public.workspace") }}</UiButton
        >
        <UiForkButton
          v-else
          :count="track.forkCount + Number(forked)"
          :busy="forking"
          :forked="forked ? screenPath('track') : undefined"
          :count-to="{ path: screenPath('public-track'), hash: '#forks' }"
          @fork="fork"
        />
      </template>
      <template #action-detail>
        <template v-if="owner">
          <UiButton icon="lock" @click="publishing = true">{{ $t("public.visibility") }}</UiButton>
          <UiBadge tone="verdigris" icon="globe">{{ $t("visibility.public") }}</UiBadge>
        </template>
        <p v-else class="s-muted">{{ $t("public.forkHint") }}</p>
      </template>
      <template #forks>
        <UiTrackFilterHeading
          v-model="language"
          :title="$t('public.forks')"
          :count="filtered.length"
          :options="options"
        />
        <UiTrackCard
          v-for="f in filtered"
          :key="f.login"
          :title="f.title"
          :to="screenPath('public-track')"
          :owner="{ login: f.login, name: f.name, to: screenPath('public-profile') }"
          :updated="f.updated"
        />
      </template>
    </UiPublicTrack>

    <UiModal
      v-model:open="publishing"
      title="Publish this Track?"
      description="Anyone with the link will be able to read it, including the Lessons of every Topic in it."
    >
      <ul class="publish__facts">
        <li>
          <UiIcon name="eye" :size="14" />Public: the title, the Track Graph, Track Sources and all
          Lessons.
        </li>
        <li>
          <UiIcon name="lock" :size="14" />Private: your Mastery, reviews, GrillSessions and
          answers.
        </li>
        <li>
          <UiIcon name="fork" :size="14" />Signed-in learners can create a Fork. A Fork stays after
          you unpublish.
        </li>
      </ul>
      <UiCopyField
        label="Public link"
        value="https://startodel.ru/u/alice/node-runtime-internals"
      />
      <UiCheckbox v-model="agree" required>
        I accept the
        <NuxtLinkLocale :to="screenPath('legal')" class="s-link">Publishing rules</NuxtLinkLocale>
        and the
        <NuxtLinkLocale :to="screenPath('legal')" class="s-link">Terms of Use</NuxtLinkLocale>,
        version 2026-11-01.
      </UiCheckbox>
      <template #footer>
        <UiButton variant="ghost" @click="publishing = false">Keep it private</UiButton>
        <UiButton variant="primary" icon="globe" :disabled="!agree" :loading="busy" @click="publish"
          >Publish Track</UiButton
        >
      </template>
    </UiModal>
  </ShowcaseSite>
</template>
<style scoped>
.publish__facts {
  display: grid;
  gap: var(--s-2);
  list-style: none;
  font-size: var(--s-text-sm);
}
.publish__facts li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-3);
  align-items: start;
}
.publish__facts svg {
  margin-top: 0.1875rem;
  color: var(--s-ink-3);
}
</style>
