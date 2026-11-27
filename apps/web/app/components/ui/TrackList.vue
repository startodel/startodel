<script setup lang="ts">
import { studyOrder } from "@startodel/core";
import { topicStates, type BoardEdge, type BoardTopic } from "./board";
/** The Topics of a Track in study order: every prerequisite comes before the Topic it unlocks. */
const props = defineProps<{
  topics: BoardTopic[];
  edges: BoardEdge[];
  label: string;
  readonly?: boolean;
}>();
const selected = defineModel<string | undefined>("selected");
const { topicWord } = useStateWords();
const rows = computed(() => {
  const states = topicStates(props.topics, props.edges);
  const byId = new Map(props.topics.map((t) => [t.id, t]));
  return studyOrder(props.topics, props.edges).map((topic) => ({
    topic,
    state: states.get(topic.id)!,
    after: props.edges
      .filter((e) => e.to === topic.id)
      .map((e) => byId.get(e.from)?.tag)
      .filter(Boolean)
      .join(", "),
  }));
});
</script>
<template>
  <ol class="s-tracklist" :aria-label="label">
    <li v-for="row in rows" :key="row.topic.id">
      <component
        :is="readonly ? 'div' : 'button'"
        :type="readonly ? undefined : 'button'"
        class="s-tracklist__row"
        :class="['is-' + row.state, { 'is-selected': selected === row.topic.id }]"
        :aria-pressed="readonly ? undefined : selected === row.topic.id"
        @click="readonly || (selected = selected === row.topic.id ? undefined : row.topic.id)"
      >
        <span class="s-tracklist__rail" aria-hidden="true"><i /></span>
        <span class="s-tracklist__main">
          <span class="s-tracklist__head">
            <span class="s-tracklist__tag">{{ row.topic.tag }}</span>
            <span v-if="row.after" class="s-tracklist__after">{{
              $t("board.after", { topics: row.after })
            }}</span>
          </span>
          <span class="s-tracklist__title">{{ row.topic.title }}</span>
        </span>
        <span class="s-tracklist__state">
          <UiMastery :level="row.topic.level" />
          <span class="s-tracklist__word"
            ><UiIcon v-if="row.state === 'blocked'" name="lock" :size="11" />{{
              topicWord(row.state)
            }}</span
          >
        </span>
      </component>
    </li>
  </ol>
</template>
<style scoped>
.s-tracklist {
  list-style: none;
}
.s-tracklist__row {
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: center;
  width: 100%;
  padding: var(--s-3) var(--s-4) var(--s-3) var(--s-3);
  border-bottom: 1px solid var(--s-line);
  text-align: left;
  color: var(--s-ink);
}
button.s-tracklist__row:hover {
  background: var(--s-surface);
}
li:last-child > .s-tracklist__row {
  border-bottom: 0;
}
.s-tracklist__row.is-selected {
  background: var(--s-raised);
  box-shadow: inset 3px 0 0 var(--s-ink);
}
.s-tracklist__row.is-blocked,
.is-blocked .s-tracklist__tag {
  color: var(--s-ink-2);
}
.s-tracklist__rail {
  position: relative;
  align-self: stretch;
  display: grid;
  place-items: center;
}
.s-tracklist__rail::before {
  content: "";
  position: absolute;
  inset: calc(var(--s-3) * -1) auto calc(var(--s-3) * -1) 50%;
  border-left: 1.5px dashed var(--s-line-strong);
  translate: -0.75px 0;
}
.is-complete > .s-tracklist__rail::before {
  border-left: 2px solid var(--s-copper-fill);
  translate: -1px 0;
}
.s-tracklist__rail i {
  position: relative;
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: var(--s-bg);
  box-shadow: inset 0 0 0 1.5px var(--s-line-strong);
}
.is-complete > .s-tracklist__rail i {
  background: var(--s-copper-fill);
  box-shadow: 0 0 0 2px var(--s-bg);
}
.is-ready > .s-tracklist__rail i {
  box-shadow:
    inset 0 0 0 2px var(--s-copper-fill),
    0 0 0 2px var(--s-bg);
}
.s-tracklist__main {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}
.s-tracklist__head {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.s-tracklist__tag,
.s-tracklist__after,
.s-tracklist__word {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-tracklist__after {
  text-transform: none;
  letter-spacing: 0.02em;
}
.s-tracklist__title {
  font-size: var(--s-text-md);
  font-weight: 600;
  line-height: 1.25;
}
.s-tracklist__state {
  display: grid;
  justify-items: end;
  gap: 0.375rem;
}
.s-tracklist__word {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.is-ready .s-tracklist__word {
  color: var(--s-copper);
}
</style>
