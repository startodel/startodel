<script setup lang="ts">
import {
  sampleEdges,
  sampleForks,
  samplePublicTrack,
  sampleTopicLessons,
  sampleTopics,
  screenPath,
} from "../sample";
const props = defineProps<{ state?: string }>();
const track = samplePublicTrack;
const owner = computed(() => props.state === "owner" || props.state === "publish");
const publishing = ref(props.state === "publish");
const agree = ref(false);
const busy = ref(false);
const forking = ref(false);
const forked = ref(false);
const page = ref(1);
const { push: notify } = useToast();
/** Public pages carry no Mastery: every Topic is drawn at level 0 with nothing blocked. */
const open = ref<string | undefined>("t04");
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
    <div class="s-page public">
      <header class="public__head">
        <p class="public__owner">
          <UiAvatar :name="track.owner.name" :size="24" />
          <NuxtLinkLocale :to="screenPath('public-profile')" class="public__login"
            >@{{ track.owner.login }}</NuxtLinkLocale
          >
          <span aria-hidden="true">/</span>
          <span>{{ track.slug }}</span>
        </p>
        <h1 class="s-title">{{ track.title }}</h1>
        <UiClampedDescription class="public__lead" :text="track.description" />
        <div class="s-cluster" style="--s-gap: var(--s-2) var(--s-4)">
          <UiForkedFrom
            :login="track.forkedFrom.login"
            :slug="track.forkedFrom.slug"
            :to="screenPath('public-track')"
          />
          <UiBadge icon="track">{{ track.topics }} Topics</UiBadge>
          <UiBadge icon="lesson">{{ track.lessons }} Lessons</UiBadge>
          <span class="s-muted public__updated">{{ track.updated }}</span>
        </div>
        <div class="s-cluster public__actions">
          <template v-if="owner">
            <UiBadge tone="verdigris" icon="globe">Public</UiBadge>
            <UiButton icon="link" @click="notify({ title: 'Link copied' })">Copy link</UiButton>
            <UiButton icon="lock" @click="publishing = true">Change visibility</UiButton>
            <UiButton variant="ghost" :to="screenPath('track')" icon-right="arrow-right"
              >Open in your workspace</UiButton
            >
          </template>
          <template v-else>
            <UiForkButton
              :count="track.forkCount + (forked ? 1 : 0)"
              :busy="forking"
              :forked="forked ? screenPath('track') : undefined"
              :count-to="{ path: screenPath('public-track'), hash: '#forks' }"
              @fork="fork"
            />
            <p class="s-muted public__hint">
              A Fork is your own private copy. You can fork a Track once.
            </p>
          </template>
        </div>
      </header>

      <figure class="public__board">
        <UiTrackMap
          v-model:selected="open"
          class="s-grid"
          :topics="sampleTopics"
          outline
          :edges="sampleEdges"
          :label="track.title + ' Track Graph'"
          :flow="false"
          interactive
        />
        <figcaption class="public__caption">
          <span class="s-label">Track Graph · press a Topic to read its Lessons</span>
        </figcaption>
      </figure>

      <div class="s-split" style="--s-aside: 22rem">
        <section class="s-stack" style="--s-gap: var(--s-4)">
          <UiSectionHeading title="Topics and Lessons" :count="track.topics" />
          <div class="s-stack" style="--s-gap: var(--s-2)">
            <UiCollapsible
              v-for="t in sampleTopics.slice(0, 6)"
              :key="t.id"
              :title="t.tag + ' · ' + t.title"
              :open="open === t.id"
              @update:open="open = $event ? t.id : undefined"
            >
              <template #meta
                >{{ t.lessons || "No" }} {{ t.lessons === 1 ? "Lesson" : "Lessons" }}</template
              >
              <UiLessonList
                v-if="t.lessons"
                :lessons="
                  sampleTopicLessons.slice(0, t.lessons).map((l) => ({
                    id: l.tag,
                    title: l.title,
                    blocks: l.blocks,
                    minutes: l.minutes,
                    to: screenPath('lesson'),
                  }))
                "
              />
              <p v-else class="s-muted">This Topic has no Lessons yet.</p>
            </UiCollapsible>
          </div>
          <UiTrackSources :sources="track.sources" />
        </section>

        <aside id="forks" class="s-stack" style="--s-gap: var(--s-4)">
          <UiSectionHeading title="Public Forks" :count="track.forkCount" :level="3" />
          <div class="s-stack" style="--s-gap: var(--s-3)">
            <UiTrackCard
              v-for="f in sampleForks"
              :key="f.login"
              :title="f.title"
              :to="screenPath('public-track')"
              :owner="{ login: f.login, name: f.name }"
              :forks="f.forks"
              :updated="f.updated"
            />
          </div>
          <UiPagination
            v-model:page="page"
            :total="track.forkCount"
            :per-page="4"
            label="Fork pages"
          />
        </aside>
      </div>
    </div>

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
.public {
  display: grid;
  gap: var(--s-10);
  padding-block: var(--s-10) var(--s-16);
}
.public__head {
  display: grid;
  gap: var(--s-4);
}
.public__owner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  font: 500 var(--s-text-sm) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.public__login {
  color: var(--s-ink);
  text-decoration: none;
}
.public__login:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.public__lead {
  max-width: 44rem;
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.public__updated,
.public__hint {
  font-size: var(--s-text-sm);
}
.public__actions {
  margin-top: var(--s-2);
  padding-top: var(--s-5);
  border-top: 1px solid var(--s-line);
}
.public__board {
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-sunken);
  overflow: hidden;
}
.public__caption {
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
}
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
