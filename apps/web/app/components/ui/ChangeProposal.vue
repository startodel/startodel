<script setup lang="ts">
import type { IconName } from "./icons";
import type { LinkTarget } from "./nav";
import type { ProposalAuthor, ProposalStatus, ProposalTarget } from "./proposals";
/**
 * An edit of one Block, made in a Fork and offered back to the source Track.
 * The Owner of the source Track accepts or declines it. The proposer can withdraw it.
 */
const props = withDefaults(
  defineProps<{
    proposer: ProposalAuthor;
    target: ProposalTarget;
    lessonTitle?: string;
    /** An ISO date. */
    createdAt: string;
    status: ProposalStatus;
    /** A few words from the proposer, as plain text. */
    note?: string;
    /** The Block in the source Track and in the Fork. */
    before: string;
    after: string;
    /** The language of a code Block. Left out, the Block is compared as prose. */
    language?: string;
    /** Who reads the card: the Owner of the source Track decides, the proposer can withdraw. */
    viewer?: "author" | "proposer";
    lessonTo?: LinkTarget;
    /** The action in flight. The other actions wait for it. */
    busy?: "accept" | "decline" | "withdraw";
  }>(),
  { language: "text" },
);
defineEmits<{ accept: []; decline: []; withdraw: [] }>();
const { t } = useI18n();
const indexTag = useIndexTag();
const displayDate = useDisplayDate("short");

const who = computed(() => "@" + props.proposer.login);
const designators = computed(() =>
  [
    indexTag("topic", props.target.topic),
    indexTag("lesson", props.target.lesson),
    indexTag("block", props.target.block),
  ].join(" · "),
);
const state = computed<{
  word: string;
  icon: IconName;
  tone: "copper" | "verdigris" | "neutral" | "brass";
}>(() => {
  if (props.status === "accepted")
    return { word: t("changeProposal.accepted"), icon: "check", tone: "verdigris" };
  if (props.status === "declined")
    return { word: t("changeProposal.declined"), icon: "x", tone: "neutral" };
  if (props.status === "outdated")
    return { word: t("changeProposal.outdated"), icon: "clock", tone: "brass" };
  return { word: t("changeProposal.open"), icon: "pad", tone: "copper" };
});
const decides = computed(() => props.viewer === "author" && props.status !== "accepted");
const withdraws = computed(
  () => props.viewer === "proposer" && (props.status === "open" || props.status === "outdated"),
);
</script>
<template>
  <article class="s-proposal" :aria-label="t('changeProposal.label', { who })">
    <header class="s-proposal__head">
      <UiAvatar :name="proposer.name || proposer.login" :src="proposer.avatarUrl" :size="32" />
      <div class="s-proposal__who">
        <p class="s-proposal__author">
          <strong v-if="proposer.name">{{ proposer.name }}</strong>
          <span class="s-proposal__login">{{ who }}</span>
        </p>
        <p class="s-proposal__where">
          <span class="s-proposal__tags">{{ designators }}</span>
          <span v-if="lessonTitle" class="s-proposal__lesson">{{ lessonTitle }}</span>
          <time :datetime="createdAt">{{ displayDate(createdAt) }}</time>
        </p>
      </div>
      <UiBadge class="s-proposal__status" variant="outline" :tone="state.tone" :icon="state.icon">{{
        state.word
      }}</UiBadge>
    </header>
    <div class="s-proposal__body">
      <p v-if="status === 'outdated'" class="s-proposal__stale">
        {{ t("changeProposal.stale") }}
      </p>
      <blockquote v-if="note" class="s-proposal__note">{{ note }}</blockquote>
      <UiLessonDiff
        view="unified"
        :switcher="false"
        :before="before"
        :after="after"
        :language="language"
        :before-title="t('changeProposal.inSource')"
        :after-title="t('changeProposal.inFork')"
      />
    </div>
    <footer v-if="decides || withdraws || lessonTo" class="s-proposal__foot">
      <template v-if="decides && status !== 'declined'">
        <UiButton
          v-if="status === 'open'"
          variant="primary"
          :loading="busy === 'accept'"
          :disabled="!!busy && busy !== 'accept'"
          @click="$emit('accept')"
          >{{ t("changeProposal.accept") }}</UiButton
        >
        <UiButton
          :loading="busy === 'decline'"
          :disabled="!!busy && busy !== 'decline'"
          @click="$emit('decline')"
          >{{ t("changeProposal.decline") }}</UiButton
        >
      </template>
      <UiButton v-if="withdraws" :loading="busy === 'withdraw'" @click="$emit('withdraw')">{{
        t("changeProposal.withdraw")
      }}</UiButton>
      <UiButton
        v-if="lessonTo"
        class="s-proposal__lesson-link"
        variant="ghost"
        icon-right="arrow-right"
        :to="lessonTo"
        >{{ t("changeProposal.openLesson") }}</UiButton
      >
    </footer>
  </article>
</template>
<style>
.s-root .s-proposal {
  container: s-proposal / inline-size;
  min-width: 0;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.s-root .s-proposal__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--s-1) var(--s-3);
  padding: var(--s-4);
}
.s-root .s-proposal__who {
  display: grid;
  gap: 0.125rem;
}
.s-root .s-proposal__author {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-2);
  font-size: var(--s-text-sm);
}
.s-root .s-proposal__author strong {
  font-weight: 600;
  color: var(--s-ink);
}
.s-root .s-proposal__login,
.s-root .s-proposal__where {
  color: var(--s-ink-3);
  font: 500 var(--s-text-xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
}
.s-root .s-proposal__where {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-3);
}
.s-root .s-proposal__tags {
  letter-spacing: 0.04em;
  color: var(--s-copper);
}
.s-root .s-proposal__lesson {
  font: 400 var(--s-text-sm) / 1.4 var(--s-font-ui);
  color: var(--s-ink-2);
}
.s-root .s-proposal__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
  padding: 0 var(--s-4) var(--s-4);
}
.s-root .s-proposal__stale {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-root .s-proposal__note {
  max-width: var(--s-read-measure);
  padding-left: var(--s-3);
  border-left: 2px solid var(--s-line-strong);
  font: 400 var(--s-text-lg) / 1.55 var(--s-font-read);
  white-space: pre-line;
  color: var(--s-ink);
}
.s-root .s-proposal__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--s-line);
}
.s-root .s-proposal__foot .s-proposal__lesson-link {
  margin-left: auto;
}
@container s-proposal (max-width: 30rem) {
  .s-root .s-proposal__head {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .s-root .s-proposal__head .s-proposal__status {
    grid-column: 2;
    justify-self: start;
    margin-top: var(--s-1);
  }
  .s-root .s-proposal__note {
    font-size: var(--s-text-md);
  }
}
</style>
