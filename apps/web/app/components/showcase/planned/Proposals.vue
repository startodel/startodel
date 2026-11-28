<script setup lang="ts">
import type { ProposalStatus, ProposalSummary } from "../../ui/proposals";
import { screenPath } from "../sample";
import { usePlannedSample } from "./sample-content";
const sample = usePlannedSample();
const proposals = computed(() => sample.value.proposals);
const target = { topic: 4, lesson: 2, block: 5 };

const decision = ref<ProposalStatus>("open");
const busy = ref<"accept" | "decline">();
let deciding: ReturnType<typeof setTimeout> | undefined;
function decide(action: "accept" | "decline") {
  busy.value = action;
  deciding = setTimeout(() => {
    decision.value = action === "accept" ? "accepted" : "declined";
    busy.value = undefined;
  }, 900);
}
onBeforeUnmount(() => clearTimeout(deciding));

const tab = ref<ProposalStatus>("open");
const inbox = computed<ProposalSummary[]>(() => {
  const { people, lessons } = proposals.value;
  const to = screenPath("lesson");
  return [
    {
      id: "p1",
      proposer: people.lin,
      target,
      lessonTitle: lessons.covering,
      createdAt: "2026-11-26T09:30:00Z",
      status: "open",
      to,
    },
    {
      id: "p2",
      proposer: people.sofia,
      target: { topic: 2, lesson: 1, block: 3 },
      lessonTitle: lessons.plans,
      createdAt: "2026-11-24T16:05:00Z",
      status: "open",
      to,
    },
    {
      id: "p3",
      proposer: people.dana,
      target: { topic: 5, lesson: 3, block: 11 },
      lessonTitle: lessons.joins,
      createdAt: "2026-11-21T11:40:00Z",
      status: "open",
      to,
    },
    {
      id: "p4",
      proposer: people.timur,
      target: { topic: 2, lesson: 1, block: 7 },
      lessonTitle: lessons.plans,
      createdAt: "2026-11-12T08:15:00Z",
      status: "accepted",
      to,
    },
    {
      id: "p5",
      proposer: people.lin,
      target: { topic: 6, lesson: 1, block: 2 },
      lessonTitle: lessons.vacuum,
      createdAt: "2026-10-30T19:20:00Z",
      status: "accepted",
      to,
    },
    {
      id: "p6",
      proposer: people.dana,
      target: { topic: 4, lesson: 2, block: 1 },
      lessonTitle: lessons.covering,
      createdAt: "2026-10-18T13:00:00Z",
      status: "outdated",
      to,
    },
  ];
});
</script>
<template>
  <ShowcaseSpecimen
    id="planned-proposal-author"
    label="Change proposal · for the author of the Track"
    note="Accept or decline it to see the card settle. The difference is the Lesson diff in its unified view"
    layout="stack"
  >
    <UiChangeProposal
      viewer="author"
      language="sql"
      :proposer="proposals.people.lin"
      :target="target"
      :lesson-title="proposals.lesson"
      created-at="2026-11-26T09:30:00Z"
      :status="decision"
      :busy="busy"
      :lesson-to="screenPath('lesson')"
      v-bind="proposals.index"
      @accept="decide('accept')"
      @decline="decide('decline')"
    />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-proposal-proposer"
    label="Change proposal · for the proposer"
    note="A prose Block is compared in the reading voice. The proposer can only withdraw"
    layout="stack"
  >
    <UiChangeProposal
      viewer="proposer"
      :proposer="proposals.people.sofia"
      :target="{ topic: 2, lesson: 1, block: 3 }"
      :lesson-title="proposals.lessons.plans"
      created-at="2026-11-24T16:05:00Z"
      status="open"
      :lesson-to="screenPath('lesson')"
      v-bind="proposals.like"
    />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-proposal-states"
    label="Change proposal · accepted, declined, outdated"
    note="Each status is a glyph and a word. An outdated proposal can no longer be accepted"
  >
    <div style="flex: 1 1 24rem; min-width: 0; align-self: flex-start">
      <UiChangeProposal
        viewer="author"
        language="sql"
        :proposer="proposals.people.timur"
        :target="{ topic: 2, lesson: 1, block: 7 }"
        :lesson-title="proposals.lessons.plans"
        created-at="2026-11-12T08:15:00Z"
        status="accepted"
        :lesson-to="screenPath('lesson')"
        v-bind="proposals.typo"
      />
    </div>
    <div style="flex: 1 1 24rem; min-width: 0; align-self: flex-start">
      <UiChangeProposal
        viewer="proposer"
        language="sql"
        :proposer="proposals.people.dana"
        :target="{ topic: 5, lesson: 3, block: 11 }"
        :lesson-title="proposals.lessons.joins"
        created-at="2026-11-21T11:40:00Z"
        status="declined"
        v-bind="proposals.typo"
      />
    </div>
    <div style="flex: 1 1 24rem; min-width: 0; align-self: flex-start">
      <UiChangeProposal
        viewer="author"
        language="sql"
        :proposer="proposals.people.dana"
        :target="{ topic: 4, lesson: 2, block: 1 }"
        :lesson-title="proposals.lesson"
        created-at="2026-10-18T13:00:00Z"
        status="outdated"
        :lesson-to="screenPath('lesson')"
        v-bind="proposals.typo"
      />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-proposal-list"
    label="Change proposal list"
    note="The inbox of an author: a count per status, then compact rows"
    layout="stack"
  >
    <UiChangeProposalList v-model:status="tab" :proposals="inbox" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-proposal-list-empty"
    label="Change proposal list · empty"
    layout="stack"
  >
    <UiChangeProposalList :proposals="[]" />
  </ShowcaseSpecimen>
</template>
