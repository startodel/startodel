<script setup lang="ts">
import { topicStates } from "../../ui/board";
import {
  sampleEdges,
  sampleTopicLessons,
  sampleBoardTopics,
  sampleTrack,
  screenPath,
} from "../sample";
const indexTag = useIndexTag();
const sampleTopics = sampleBoardTopics(indexTag);
const selected = ref<string | undefined>("t04");
const { push: notify } = useToast();
const states = topicStates(sampleTopics, sampleEdges);
const topic = computed(() => sampleTopics.find((t) => t.id === selected.value));
const prerequisites = computed(() =>
  sampleEdges
    .filter((e) => e.to === selected.value)
    .map((e) => sampleTopics.find((t) => t.id === e.from)!),
);
const unlocks = computed(() =>
  sampleEdges
    .filter((e) => e.from === selected.value)
    .map((e) => sampleTopics.find((t) => t.id === e.to)!),
);
const lessons = computed(() =>
  sampleTopicLessons.slice(0, topic.value?.lessons ?? 0).map((l, i) => ({
    id: l.id,
    title: l.title,
    blocks: l.blocks,
    minutes: l.minutes,
    read: i < (topic.value?.read ?? 0),
    to: screenPath("lesson"),
  })),
);
const blockers = computed(() =>
  prerequisites.value
    .filter((t) => t.level < 2)
    .map((t) => t.tag + " " + t.title)
    .join(" and "),
);
const language = ref("en");
const complete = sampleTopics.filter((t) => t.level >= 2).length;
const actions = [
  { id: "grill", label: "Start a Grill", icon: "grill" as const, to: screenPath("grill") },
  {
    id: "publish",
    label: "Publish",
    icon: "globe" as const,
    to: { path: screenPath("public-track"), query: { state: "publish" } },
  },
  { id: "link", label: "Copy link", icon: "link" as const },
  {
    id: "delete",
    label: "Delete Track",
    icon: "trash" as const,
    danger: true,
    separated: true,
  },
];
</script>
<template>
  <ShowcaseApp
    current-track="node"
    :crumbs="[{ label: 'Tracks', to: screenPath('dashboard') }, { label: sampleTrack.title }]"
  >
    <div class="s-stack" style="--s-gap: var(--s-6)">
      <UiPageHeader
        clamp-description
        kicker="Track"
        :title="sampleTrack.title"
        :description="sampleTrack.goal"
      >
        <template #meta>
          <UiTrackLanguageEditor
            :language="language"
            :save="
              (tag) => {
                language = tag;
              }
            "
          />
          <UiBadge tone="copper" pad>{{
            $t("track.mastered", { done: $n(complete), total: $n(sampleTopics.length) })
          }}</UiBadge>
          <UiBadge icon="lock">Private</UiBadge>
          <UiForkedFrom login="mkarpov" slug="node-internals" :to="screenPath('public-track')" />
        </template>
        <template #actions>
          <UiButton variant="primary" icon="lesson" :to="screenPath('lesson')">{{
            $t("track.continue")
          }}</UiButton>
          <UiMenu :items="actions" @select="notify({ title: 'Mock action: ' + $event })">
            <UiButton icon="more" :label="$t('track.actions')" />
          </UiMenu>
        </template>
      </UiPageHeader>

      <UiTrackBoard
        v-model:selected="selected"
        :topics="sampleTopics"
        :edges="sampleEdges"
        :label="$t('track.graph')"
      />

      <div class="s-split" style="--s-aside: 22rem">
        <section v-if="topic" class="s-stack" style="--s-gap: var(--s-5)" aria-live="polite">
          <UiTopicCard
            :title="topic.title"
            :tag="topic.tag"
            :level="topic.level"
            :state="states.get(topic.id)"
            :lessons="{ read: topic.read, total: topic.lessons }"
            :due="topic.due ? 'Review ' + topic.due : null"
            :after="prerequisites.map((t) => t.tag)"
          />
          <UiNotice
            v-if="states.get(topic.id) === 'blocked'"
            tone="warning"
            title="Blocked by a prerequisite"
          >
            Complete {{ blockers }} first. A Topic is complete at Mastery 2.
          </UiNotice>
          <template v-if="lessons.length">
            <UiSectionHeading title="Lessons" :count="lessons.length" :level="3" />
            <UiLessonList :lessons="lessons" />
          </template>
          <UiEmptyState v-else title="No Lessons yet" icon="lesson" compact>
            Your agent writes the Lessons for this Topic.
            <template #actions>
              <UiAgentPrompt
                compact
                :text="`Write the first Lesson for the Topic ${topic.slug} in Startodel.`"
                tool="create_lesson"
              />
            </template>
          </UiEmptyState>
        </section>
        <UiEmptyState v-else title="No Topic selected" icon="track" compact>
          Press a Topic on the board to see its Lessons, its Mastery and what it unlocks.
        </UiEmptyState>

        <aside class="s-stack" style="--s-gap: var(--s-6)">
          <section v-if="topic" class="s-stack" style="--s-gap: var(--s-3)">
            <UiSectionHeading title="Signal path" :level="3" />
            <dl class="path">
              <div>
                <dt>Needs</dt>
                <dd>
                  <button
                    v-for="t in prerequisites"
                    :key="t.id"
                    type="button"
                    class="path__topic"
                    @click="selected = t.id"
                  >
                    <span class="s-label">{{ t.tag }}</span>{{ t.title
                    }}<UiMastery :level="t.level" show="bars" size="sm" />
                  </button>
                  <span v-if="!prerequisites.length" class="s-muted"
                    >Nothing. This is an entry point.</span
                  >
                </dd>
              </div>
              <div>
                <dt>Unlocks</dt>
                <dd>
                  <button
                    v-for="t in unlocks"
                    :key="t.id"
                    type="button"
                    class="path__topic"
                    @click="selected = t.id"
                  >
                    <span class="s-label">{{ t.tag }}</span>{{ t.title
                    }}<UiMastery :level="t.level" show="bars" size="sm" />
                  </button>
                  <span v-if="!unlocks.length" class="s-muted"
                    >Nothing yet. This is the end of a path.</span
                  >
                </dd>
              </div>
            </dl>
          </section>
          <UiTrackSources :sources="sampleTrack.sources" />
        </aside>
      </div>
    </div>
  </ShowcaseApp>
</template>
<style scoped>
.path {
  display: grid;
  gap: var(--s-4);
}
.path dt {
  margin-bottom: var(--s-2);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.path dd {
  display: grid;
  gap: var(--s-1);
  font-size: var(--s-text-sm);
}
.path__topic {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  font-weight: 600;
  text-align: left;
}
.path__topic:hover {
  border-color: var(--s-ink);
}
</style>
