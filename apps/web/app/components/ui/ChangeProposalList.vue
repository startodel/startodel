<script setup lang="ts">
import { NuxtLinkLocale } from "#components";
import type { ProposalStatus, ProposalSummary } from "./proposals";
/** The inbox of change proposals for the Owner of a Track: a count per status and a compact list. */
const props = defineProps<{
  proposals: ProposalSummary[];
  /** The totals per status when the list holds one page of them. Left out, the rows are counted. */
  counts?: Partial<Record<ProposalStatus, number>>;
}>();
defineEmits<{ open: [id: string] }>();
const status = defineModel<ProposalStatus>("status", { default: "open" });
const tab = computed({
  get: () => status.value as string,
  set: (id) => (status.value = id as ProposalStatus),
});
const { t } = useI18n();
const indexTag = useIndexTag();
const displayDate = useDisplayDate("short");

const statuses = ["open", "accepted", "declined", "outdated"] as const;
const total = (id: ProposalStatus) =>
  props.counts?.[id] ?? props.proposals.filter((proposal) => proposal.status === id).length;
const tabs = computed(() => [
  { id: "open", label: t("changeProposalList.open"), count: total("open") },
  { id: "accepted", label: t("changeProposalList.accepted"), count: total("accepted") },
  { id: "declined", label: t("changeProposalList.declined"), count: total("declined") },
  { id: "outdated", label: t("changeProposalList.outdated"), count: total("outdated") },
]);
const empty = computed(() => tabs.value.every((tab) => tab.count === 0));
const rows = (id: ProposalStatus) =>
  props.proposals
    .filter((proposal) => proposal.status === id)
    .map((proposal) => ({
      ...proposal,
      designators: [
        indexTag("topic", proposal.target.topic),
        indexTag("lesson", proposal.target.lesson),
        indexTag("block", proposal.target.block),
      ].join(" · "),
    }));
</script>
<template>
  <UiEmptyState v-if="empty" :title="t('changeProposalList.empty')">{{
    t("changeProposalList.emptyText")
  }}</UiEmptyState>
  <UiTabs
    v-else
    v-model="tab"
    class="s-proposals"
    :tabs="tabs"
    :label="t('changeProposalList.label')"
  >
    <template v-for="id in statuses" :key="id" #[id]>
      <ul v-if="rows(id).length" class="s-proposals__list">
        <li v-for="row in rows(id)" :key="row.id">
          <component
            :is="row.to ? NuxtLinkLocale : 'button'"
            class="s-proposals__row"
            :to="row.to"
            :type="row.to ? undefined : 'button'"
            @click="row.to || $emit('open', row.id)"
          >
            <UiAvatar
              :name="row.proposer.name || row.proposer.login"
              :src="row.proposer.avatarUrl"
              :size="24"
            />
            <span class="s-proposals__login">{{ "@" + row.proposer.login }}</span>
            <span class="s-proposals__where">
              <span class="s-proposals__tags">{{ row.designators }}</span>
              <span class="s-proposals__lesson">{{ row.lessonTitle }}</span>
            </span>
            <time class="s-proposals__time" :datetime="row.createdAt">{{
              displayDate(row.createdAt)
            }}</time>
            <UiIcon class="s-proposals__caret" name="chevron-right" :size="14" />
          </component>
        </li>
      </ul>
      <p v-else class="s-proposals__none">{{ t("changeProposalList.none") }}</p>
    </template>
  </UiTabs>
</template>
<style>
.s-root .s-tabs.s-proposals {
  container: s-proposals / inline-size;
  gap: 0;
}
.s-root .s-proposals__list > li + li {
  border-top: 1px solid var(--s-line);
}
.s-root .s-proposals__row {
  display: grid;
  grid-template-columns: auto minmax(6rem, 10rem) minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--s-1) var(--s-3);
  width: 100%;
  padding: var(--s-3) var(--s-1);
  text-align: left;
  font-size: var(--s-text-sm);
  color: var(--s-ink);
}
.s-root .s-proposals__row:hover {
  background: var(--s-sunken);
}
.s-root .s-proposals__row:focus-visible {
  outline-offset: -2px;
}
.s-root .s-proposals__login,
.s-root .s-proposals__tags,
.s-root .s-proposals__time {
  font: 500 var(--s-text-xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
}
.s-root .s-proposals__login {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--s-ink);
}
.s-root .s-proposals__where {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-3);
  min-width: 0;
}
.s-root .s-proposals__tags {
  letter-spacing: 0.04em;
  color: var(--s-copper);
}
.s-root .s-proposals__lesson {
  color: var(--s-ink-2);
}
.s-root .s-proposals__time,
.s-root .s-proposals__caret {
  color: var(--s-ink-3);
}
.s-root .s-proposals__none {
  padding: var(--s-5) var(--s-1);
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
@container s-proposals (max-width: 34rem) {
  .s-root .s-proposals__row {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
  }
  .s-root .s-proposals__where {
    grid-row: 2;
    grid-column: 2 / -1;
  }
}
</style>
