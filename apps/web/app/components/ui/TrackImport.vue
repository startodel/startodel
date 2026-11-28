<script setup lang="ts">
import { type TrackContents, useTrackContents } from "./track-contents";
/**
 * Import of a Track from a portable file. The caller checks the file and reports back:
 * either what will be created, or where the file breaks the format.
 */
const props = withDefaults(
  defineProps<{
    state?: "empty" | "checking" | "valid" | "invalid";
    fileName?: string;
    /** The title of the Track in a valid file. */
    title?: string;
    /** What a valid file will create. */
    contents?: TrackContents;
    /** Where an invalid file breaks the format: a path into the file and a plain message. */
    errors?: { path: string; message: string }[];
    creating?: boolean;
    /** The largest accepted file, in bytes. */
    maxSize?: number;
  }>(),
  { state: "empty", errors: () => [] },
);
const emit = defineEmits<{ file: [file: File]; create: []; reset: [] }>();
const { t } = useI18n();
const countArgs = useCountArgs();
const trackContents = useTrackContents();
const created = computed(() => (props.contents ? trackContents(props.contents).join(" · ") : ""));
</script>
<template>
  <section class="s-import" :aria-label="t('trackImport.label')">
    <UiUpload
      v-if="state === 'empty'"
      accept=".json,.zip,application/json,application/zip"
      formats="JSON, ZIP"
      :max-size="maxSize"
      @files="emit('file', $event[0]!)"
    />
    <div v-else class="s-import__plate" :class="'is-' + state">
      <header class="s-import__head">
        <UiIcon class="s-import__glyph" :name="fileName?.endsWith('.zip') ? 'archive' : 'file'" />
        <span class="s-import__file">{{ fileName }}</span>
        <p class="s-import__state" role="status">
          <UiPending v-if="state === 'checking'" />
          <UiIcon v-else :name="state === 'valid' ? 'check' : 'alert'" :size="14" />
          <span v-if="state === 'checking'">{{ t("trackImport.checking") }}</span>
          <span v-else-if="state === 'valid'">{{ t("trackImport.valid") }}</span>
          <span v-else>{{ t("trackImport.invalid", countArgs(errors.length)) }}</span>
        </p>
      </header>
      <div v-if="state === 'valid'" class="s-import__body">
        <p v-if="title" class="s-import__title">{{ title }}</p>
        <p v-if="created" class="s-import__created">
          <span>{{ t("trackImport.created") }}</span> {{ created }}
        </p>
      </div>
      <ol v-else-if="state === 'invalid'" class="s-import__errors">
        <li v-for="(error, i) in errors" :key="i">
          <code class="s-import__path">{{ error.path }}</code>
          <span>{{ error.message }}</span>
        </li>
      </ol>
      <footer v-if="state !== 'checking'" class="s-import__foot">
        <UiButton
          v-if="state === 'valid'"
          variant="primary"
          :loading="creating"
          @click="emit('create')"
          >{{ t("trackImport.create") }}</UiButton
        >
        <UiButton
          :variant="state === 'valid' ? 'ghost' : 'secondary'"
          :disabled="creating"
          @click="emit('reset')"
          >{{ t("trackImport.another") }}</UiButton
        >
      </footer>
    </div>
  </section>
</template>
<style>
.s-root .s-import {
  min-width: 0;
}
.s-root .s-import__plate {
  overflow: hidden;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.s-root .s-import__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-3);
  padding: var(--s-3) var(--s-4);
}
.s-root .s-import__glyph {
  flex: none;
  color: var(--s-ink-3);
}
.s-root .s-import__file {
  flex: 1 1 10rem;
  min-width: 0;
  overflow-wrap: anywhere;
  font: 500 var(--s-text-sm) / 1.4 var(--s-font-mono);
  font-stretch: 87.5%;
  color: var(--s-ink);
}
.s-root .s-import__state {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--s-copper);
  font: 600 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-root .s-import__plate.is-valid .s-import__state {
  color: var(--s-verdigris);
}
.s-root .s-import__plate.is-invalid .s-import__state {
  color: var(--s-oxide);
}
.s-root .s-import__body {
  display: grid;
  gap: var(--s-1);
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--s-line);
}
.s-root .s-import__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  color: var(--s-ink);
}
.s-root .s-import__created {
  font-size: var(--s-text-sm);
  color: var(--s-ink);
}
.s-root .s-import__created span {
  color: var(--s-ink-3);
}
.s-root .s-import__errors {
  border-top: 1px solid var(--s-line);
}
.s-root .s-import__errors li {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.125rem;
  padding: var(--s-2) var(--s-4);
  box-shadow: inset 2px 0 0 var(--s-oxide);
  font-size: var(--s-text-sm);
  color: var(--s-ink);
}
.s-root .s-import__errors li + li {
  border-top: 1px solid var(--s-line);
}
.s-root .s-import__errors .s-import__path {
  overflow-wrap: anywhere;
  font: 500 var(--s-text-xs) / 1.5 var(--s-font-mono);
  font-stretch: 87.5%;
  color: var(--s-oxide);
}
.s-root .s-import__foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--s-line);
}
</style>
