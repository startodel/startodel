<script setup lang="ts">
import { type FileKind, useFileSize } from "./files";
import type { IconName } from "./icons";
/** One uploaded file as a row of a list. Rows that follow each other are separated by a hairline. */
const props = withDefaults(
  defineProps<{
    name: string;
    /** In bytes. */
    size: number;
    kind?: FileKind;
    state?: "uploading" | "processing" | "ready" | "failed" | "over-quota";
    /** The uploaded share from 0 to 100, while uploading. */
    progress?: number;
    /** Where the ready file is downloaded from. Without it the row emits `download`. */
    href?: string;
    /** Why the upload failed, in the words of the caller. */
    error?: string;
  }>(),
  { kind: "document", state: "ready", progress: 0 },
);
defineEmits<{ cancel: []; remove: []; retry: []; download: [] }>();
const { t } = useI18n();
const fileSize = useFileSize();
const glyphs: Record<FileKind, IconName> = {
  video: "video",
  image: "image",
  document: "file",
  archive: "archive",
};
const word = computed(() => {
  if (props.state === "uploading") return t("attachment.uploading");
  if (props.state === "processing") return t("attachment.processing");
  if (props.state === "failed") return t("attachment.failed");
  if (props.state === "over-quota") return t("attachment.overQuota");
  return t("attachment.ready");
});
</script>
<template>
  <li class="s-attachment" :class="'is-' + state">
    <UiIcon class="s-attachment__glyph" :name="glyphs[kind]" />
    <div class="s-attachment__body">
      <p class="s-attachment__name" :title="name">{{ name }}</p>
      <p class="s-attachment__meta">
        <span>{{ fileSize(size) }}</span>
        <span class="s-attachment__state">
          <UiPending v-if="state === 'processing'" />
          <UiIcon
            v-else
            :name="
              state === 'ready'
                ? 'check'
                : state === 'uploading'
                  ? 'upload'
                  : state === 'failed'
                    ? 'alert'
                    : 'gotcha'
            "
            :size="12"
          />
          {{ word }}
        </span>
      </p>
      <p v-if="state === 'failed' && error" class="s-attachment__error">{{ error }}</p>
      <UiProgress
        v-if="state === 'uploading'"
        class="s-attachment__progress"
        size="sm"
        show-value
        :value="progress"
        :label="t('attachment.progress', { name })"
      />
    </div>
    <div class="s-attachment__actions">
      <UiButton v-if="state === 'uploading'" size="sm" variant="ghost" @click="$emit('cancel')">{{
        t("common.cancel")
      }}</UiButton>
      <UiButton v-if="state === 'failed'" size="sm" @click="$emit('retry')">{{
        t("attachment.retry")
      }}</UiButton>
      <template v-if="state === 'ready'">
        <UiButton
          v-if="href"
          size="sm"
          variant="ghost"
          icon="download"
          target="_self"
          :href="href"
          :label="t('attachment.download', { name })"
        />
        <UiButton
          v-else
          size="sm"
          variant="ghost"
          icon="download"
          :label="t('attachment.download', { name })"
          @click="$emit('download')"
        />
      </template>
      <UiButton
        v-if="state !== 'uploading'"
        size="sm"
        variant="ghost"
        icon="trash"
        :label="t('attachment.remove', { name })"
        @click="$emit('remove')"
      />
    </div>
  </li>
</template>
<style>
.s-root .s-attachment {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) 0;
}
.s-root .s-attachment + .s-attachment {
  border-top: 1px solid var(--s-line);
}
.s-root .s-attachment__glyph {
  align-self: start;
  margin-top: 0.1875rem;
  color: var(--s-ink-3);
}
.s-root .s-attachment__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.125rem;
}
.s-root .s-attachment__name {
  overflow: hidden;
  font-size: var(--s-text-sm);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--s-ink);
}
.s-root .s-attachment__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 var(--s-3);
  color: var(--s-ink-3);
  font: 500 var(--s-text-2xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-root .s-attachment__state {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.s-root .s-attachment.is-ready .s-attachment__state {
  color: var(--s-verdigris);
}
.s-root .s-attachment.is-uploading .s-attachment__state {
  color: var(--s-copper);
}
.s-root .s-attachment.is-failed .s-attachment__state {
  color: var(--s-oxide);
}
.s-root .s-attachment.is-over-quota .s-attachment__state {
  color: var(--s-brass);
}
.s-root .s-attachment__error {
  font-size: var(--s-text-xs);
  color: var(--s-ink-2);
}
.s-root .s-attachment__body .s-attachment__progress {
  margin-top: var(--s-1);
}
.s-root .s-attachment__actions {
  display: flex;
  align-items: center;
  gap: var(--s-1);
}
</style>
