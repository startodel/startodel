<script setup lang="ts">
import type { AccessGrant, AccessPending } from "./access";
import { useNarrow } from "./narrow";
import type { TableColumn } from "./Table.vue";
/**
 * The author's side of a gated Track: answer the requests for access, let a learner in by handle,
 * and see who has access. Revoking asks for confirmation first.
 */
const props = defineProps<{
  requests: AccessPending[];
  grants: AccessGrant[];
  /** Why the handle in the field was not granted access. */
  addError?: "unknown" | "exists" | null;
  /** The handle is being looked up. */
  adding?: boolean;
  /** The request or grant whose change is being saved. */
  busy?: string | null;
}>();
const emit = defineEmits<{
  approve: [id: string];
  decline: [id: string];
  add: [handle: string];
  revoke: [id: string];
}>();
const handle = defineModel<string>("handle", { default: "" });
const { t, locale } = useI18n();
const displayDate = useDisplayDate("short");
const id = useId();
const root = useTemplateRef<HTMLElement>("root");
const narrow = useNarrow(root, 560);

const columns = computed<TableColumn<AccessGrant>[]>(() => {
  const sortable = props.grants.length > 1;
  return [
    {
      key: "learner",
      label: t("access.learner"),
      sortable,
      sortValue: (row) => row.learner.handle,
    },
    ...(narrow.value
      ? []
      : [
          { key: "grantedAt", label: t("access.grantedOn"), sortable },
          { key: "lastActiveAt", label: t("access.lastActive"), sortable },
        ]),
    { key: "revoke", label: t("access.manage"), align: "right" as const },
  ];
});
const addErrorText = computed(() =>
  props.addError === "unknown"
    ? t("access.unknownHandle")
    : props.addError === "exists"
      ? t("access.alreadyGranted")
      : undefined,
);
function add() {
  const value = handle.value.trim().replace(/^@/, "");
  if (value && !props.adding) emit("add", value);
}

const revoking = ref<AccessGrant>();
const confirmOpen = computed({
  get: () => !!revoking.value,
  set: (open) => {
    if (!open) revoking.value = undefined;
  },
});
function confirmRevoke() {
  if (revoking.value) emit("revoke", revoking.value.id);
  revoking.value = undefined;
}
</script>
<template>
  <div ref="root" class="s-grants">
    <section class="s-grants__part" :aria-labelledby="id + '-requests'">
      <UiSectionHeading
        :id="id + '-requests'"
        :title="t('access.requests')"
        :count="requests.length || undefined"
        :level="3"
      />
      <UiEmptyState v-if="!requests.length" compact icon="lock-pad" :title="t('access.noRequests')">
        {{ t("access.noRequestsHint") }}
      </UiEmptyState>
      <ul v-else class="s-grants__requests">
        <li v-for="request in requests" :key="request.id" class="s-grants__request">
          <UiAvatar :name="request.learner.handle" :src="request.learner.avatarUrl" :size="28" />
          <div class="s-grants__who">
            <p class="s-grants__meta">
              <bdi class="s-grants__handle">@{{ request.learner.handle }}</bdi>
              <time :datetime="request.requestedAt">{{ displayDate(request.requestedAt) }}</time>
            </p>
            <p v-if="request.message" class="s-grants__message">{{ request.message }}</p>
          </div>
          <div class="s-grants__answer">
            <UiButton
              size="sm"
              icon="check"
              :loading="busy === request.id"
              @click="emit('approve', request.id)"
              >{{ t("access.approve") }}</UiButton
            >
            <UiButton
              size="sm"
              variant="ghost"
              :disabled="busy === request.id"
              @click="emit('decline', request.id)"
              >{{ t("access.decline") }}</UiButton
            >
          </div>
        </li>
      </ul>
    </section>
    <form class="s-grants__add" @submit.prevent="add">
      <UiField
        :label="t('access.grantByHandle')"
        :hint="t('access.handleHint')"
        :error="addErrorText"
      >
        <div class="s-grants__entry">
          <div class="s-grants__field">
            <UiInput v-model="handle" mono icon="user" autocomplete="off" spellcheck="false" />
          </div>
          <UiButton type="submit" icon="plus" :loading="adding" :disabled="!handle.trim()">{{
            t("access.add")
          }}</UiButton>
        </div>
      </UiField>
    </form>
    <section class="s-grants__part" :aria-labelledby="id + '-learners'">
      <UiSectionHeading
        :id="id + '-learners'"
        :title="t('access.learners')"
        :count="grants.length || undefined"
        :level="3"
      />
      <UiTable
        :columns="columns"
        :rows="grants"
        :row-key="(row) => row.id"
        :caption="t('access.learners')"
        :sort-locale="locale"
      >
        <template #cell-learner="{ row }">
          <span class="s-grants__learner">
            <UiAvatar :name="row.learner.handle" :src="row.learner.avatarUrl" :size="24" />
            <span class="s-grants__name">
              <bdi class="s-grants__handle">@{{ row.learner.handle }}</bdi>
              <span v-if="narrow" class="s-grants__since">
                {{ t("access.since", { date: displayDate(row.grantedAt) }) }}
              </span>
            </span>
          </span>
        </template>
        <template #cell-grantedAt="{ row }">
          <time :datetime="row.grantedAt">{{ displayDate(row.grantedAt) }}</time>
        </template>
        <template #cell-lastActiveAt="{ row }">
          <time v-if="row.lastActiveAt" :datetime="row.lastActiveAt">{{
            displayDate(row.lastActiveAt)
          }}</time>
          <span v-else class="s-grants__never">{{ t("access.never") }}</span>
        </template>
        <template #cell-revoke="{ row }">
          <UiButton
            size="sm"
            variant="ghost"
            :loading="busy === row.id"
            :label="
              narrow ? t('access.revokeFor', { handle: '@' + row.learner.handle }) : undefined
            "
            :icon="narrow ? 'x' : undefined"
            @click="revoking = row"
            ><template v-if="!narrow">{{ t("access.revoke") }}</template></UiButton
          >
        </template>
        <template #empty>{{ t("access.noLearners") }}</template>
      </UiTable>
    </section>
    <UiModal
      v-model:open="confirmOpen"
      size="sm"
      :title="t('access.revokeTitle', { handle: '@' + (revoking?.learner.handle ?? '') })"
      :description="t('access.revokeText')"
    >
      <template #footer>
        <UiButton variant="ghost" @click="confirmOpen = false">{{ t("common.cancel") }}</UiButton>
        <UiButton variant="danger" @click="confirmRevoke">{{ t("access.revoke") }}</UiButton>
      </template>
    </UiModal>
  </div>
</template>
<style scoped>
.s-grants {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-6);
  container: s-grants / inline-size;
}
.s-grants__part {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
}
.s-grants__requests {
  list-style: none;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.s-grants__request {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--s-2) var(--s-3);
  padding: var(--s-4);
}
.s-grants__request + .s-grants__request {
  border-top: 1px solid var(--s-line);
}
.s-grants__who {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}
.s-grants__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-2);
  min-height: 1.75rem;
  font-size: var(--s-text-xs);
  line-height: 1.75rem;
  color: var(--s-ink-3);
}
.s-grants__handle {
  font: 600 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink);
}
.s-grants__message {
  font: 400 var(--s-text-md) / 1.55 var(--s-font-read);
  color: var(--s-ink);
  overflow-wrap: anywhere;
}
.s-grants__answer {
  display: flex;
  gap: var(--s-2);
}
.s-grants__add {
  max-width: 30rem;
}
.s-grants__entry {
  display: flex;
  gap: var(--s-2);
}
.s-grants__field {
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
}
.s-grants__learner {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  min-width: 0;
}
.s-grants__name {
  display: grid;
  gap: 0.125rem;
  min-width: 0;
}
.s-grants__since,
.s-grants__never {
  font-size: var(--s-text-xs);
  font-weight: 400;
  color: var(--s-ink-3);
}
@container s-grants (max-width: 35rem) {
  .s-grants__request {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .s-grants__answer {
    grid-column: 2;
  }
}
</style>
