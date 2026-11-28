<script setup lang="ts">
/**
 * The published versions of a Track, newest first. A version fixes the Track as it was when
 * it was published. The Owner publishes the next one with a note about what changed.
 */
export interface TrackVersion {
  number: number;
  /** An ISO date. */
  publishedAt: string;
  /** What changed, in the words of the Owner. */
  note: string;
  /** Left out for the first version, which has nothing to compare with. */
  changes?: { lessonsAdded?: number; lessonsRemoved?: number; blocksChanged?: number };
}
const props = defineProps<{
  versions: TrackVersion[];
  /** The version the viewer's Fork was made from. */
  forkBase?: number;
  /** Offer the action that publishes the next version. */
  canPublish?: boolean;
  publishing?: boolean;
  /** Why publishing failed. Shown in the form. */
  error?: string;
}>();
const emit = defineEmits<{ publish: [note: string] }>();
const open = defineModel<boolean>("open", { default: false });
const { t } = useI18n();
const countArgs = useCountArgs();
const displayDate = useDisplayDate("short");
const formId = useId();

const name = (number: number) => "v" + number;
const rows = computed(() =>
  [...props.versions]
    .sort((a, b) => b.number - a.number)
    .map((version, index) => {
      const { lessonsAdded, lessonsRemoved, blocksChanged } = version.changes ?? {};
      return {
        ...version,
        name: name(version.number),
        current: index === 0,
        changes: [
          lessonsAdded ? t("trackVersions.lessonsAdded", countArgs(lessonsAdded)) : "",
          lessonsRemoved ? t("trackVersions.lessonsRemoved", countArgs(lessonsRemoved)) : "",
          blocksChanged ? t("trackVersions.blocksChanged", countArgs(blocksChanged)) : "",
        ]
          .filter(Boolean)
          .join(" · "),
      };
    }),
);
const next = computed(() => name((rows.value[0]?.number ?? 0) + 1));

const note = ref("");
const missing = ref(false);
function submit() {
  missing.value = !note.value.trim();
  if (!missing.value && !props.publishing) emit("publish", note.value.trim());
}
// A new latest version means the publication went through: the form has done its work.
watch(
  () => rows.value[0]?.number,
  () => {
    open.value = false;
    note.value = "";
  },
);
// The form has one field, so the dialog opens with the caret in it.
const form = useTemplateRef<HTMLFormElement>("form");
watch(open, async (isOpen) => {
  missing.value = false;
  if (!isOpen) return;
  await nextTick();
  form.value?.querySelector("textarea")?.focus();
});
</script>
<template>
  <section class="s-versions" :aria-label="t('trackVersions.label')">
    <UiEmptyState v-if="!rows.length" icon="pin" :title="t('trackVersions.empty')">
      {{ t("trackVersions.emptyText") }}
      <template v-if="canPublish" #actions>
        <UiButton variant="primary" @click="open = true">{{
          t("trackVersions.publishFirst")
        }}</UiButton>
      </template>
    </UiEmptyState>
    <template v-else>
      <div v-if="canPublish" class="s-versions__actions">
        <UiButton icon="plus" @click="open = true">{{
          t("trackVersions.publish", { version: next })
        }}</UiButton>
      </div>
      <ol class="s-versions__list">
        <li
          v-for="row in rows"
          :key="row.number"
          class="s-versions__item"
          :class="{ 'is-current': row.current }"
        >
          <p class="s-versions__head">
            <strong class="s-versions__name">{{ row.name }}</strong>
            <UiBadge v-if="row.current" tone="copper" pad>{{ t("trackVersions.current") }}</UiBadge>
            <time class="s-versions__date" :datetime="row.publishedAt">{{
              displayDate(row.publishedAt)
            }}</time>
          </p>
          <p v-if="row.number === forkBase" class="s-versions__fork">
            <UiIcon name="fork" :size="14" />{{
              t("trackVersions.forkBase", { version: row.name })
            }}
          </p>
          <p class="s-versions__note">{{ row.note }}</p>
          <p v-if="row.changes" class="s-versions__changes">{{ row.changes }}</p>
        </li>
      </ol>
    </template>
    <UiModal
      v-model:open="open"
      size="sm"
      :title="t('trackVersions.formTitle', { version: next })"
      :description="t('trackVersions.formText')"
    >
      <form :id="formId" ref="form" class="s-versions__form" novalidate @submit.prevent="submit">
        <UiField
          :label="t('trackVersions.note')"
          :hint="t('trackVersions.noteHint')"
          :error="missing ? t('trackVersions.noteMissing') : error"
        >
          <UiTextarea v-model="note" :rows="3" required />
        </UiField>
      </form>
      <template #footer>
        <UiButton variant="ghost" @click="open = false">{{ t("common.cancel") }}</UiButton>
        <UiButton variant="primary" type="submit" :form="formId" :loading="publishing">{{
          t("trackVersions.submit")
        }}</UiButton>
      </template>
    </UiModal>
  </section>
</template>
<style>
.s-root .s-versions {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
  min-width: 0;
}
.s-root .s-versions__actions {
  display: flex;
}
.s-root .s-versions__item {
  position: relative;
  display: grid;
  gap: var(--s-1);
  padding: 0 0 var(--s-6) var(--s-6);
}
.s-root .s-versions__item:last-child {
  padding-bottom: 0;
}
/* The rail: a pad per version and a trace down to the one before it. */
.s-root .s-versions__item::before {
  content: "";
  position: absolute;
  top: 0.3125rem;
  left: 0;
  width: 0.6875rem;
  height: 0.6875rem;
  border: 1.5px solid var(--s-line-strong);
  border-radius: 50%;
  background: var(--s-bg);
}
.s-root .s-versions__item.is-current::before {
  border-color: var(--s-copper);
  background: var(--s-copper-fill);
}
.s-root .s-versions__item::after {
  content: "";
  position: absolute;
  top: 1.25rem;
  bottom: 0.0625rem;
  left: 0.3125rem;
  width: 1px;
  background: var(--s-line-strong);
}
.s-root .s-versions__item:last-child::after {
  content: none;
}
.s-root .s-versions__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-3);
}
.s-root .s-versions__name {
  font: 600 var(--s-text-lg) / 1.2 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink);
}
.s-root .s-versions__date,
.s-root .s-versions__changes {
  color: var(--s-ink-3);
  font: 500 var(--s-text-2xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-root .s-versions__date {
  margin-left: auto;
}
.s-root .s-versions__fork {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--s-text-sm);
  font-weight: 500;
  color: var(--s-steel);
}
.s-root .s-versions__note {
  max-width: var(--s-read-measure);
  font: 400 var(--s-text-md) / 1.55 var(--s-font-read);
  color: var(--s-ink);
}
.s-root .s-versions__form {
  display: grid;
}
</style>
