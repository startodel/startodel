<script setup lang="ts">
import { type TrackContents, useTrackContents } from "./track-contents";
/** Export of a Track as a portable file. The caller builds the file. This only asks how. */
const props = withDefaults(
  defineProps<{
    contents: TrackContents;
    /** The version of the file format, such as "1.0". */
    specVersion: string;
    state?: "idle" | "busy" | "done";
    /** The name of the file that was built. Shown when done. */
    fileName?: string;
  }>(),
  { state: "idle" },
);
defineEmits<{ export: [format: "file" | "folder"] }>();
const format = defineModel<"file" | "folder">("format", { default: "file" });
const { t } = useI18n();
const trackContents = useTrackContents();
const formats = computed(() => [
  { value: "file" as const, label: t("trackExport.file"), hint: t("trackExport.fileHint") },
  { value: "folder" as const, label: t("trackExport.folder"), hint: t("trackExport.folderHint") },
]);
const included = computed(() => trackContents(props.contents).join(" · "));
</script>
<template>
  <section class="s-export" :aria-label="t('trackExport.label')">
    <UiRadioGroup
      v-model="format"
      variant="cards"
      :options="formats"
      :label="t('trackExport.format')"
      :disabled="state === 'busy'"
    />
    <dl class="s-export__facts">
      <div>
        <dt>{{ t("trackExport.included") }}</dt>
        <dd>{{ included }}</dd>
      </div>
      <div>
        <dt>{{ t("trackExport.spec") }}</dt>
        <dd class="s-export__spec">{{ specVersion }}</dd>
      </div>
    </dl>
    <div class="s-export__foot">
      <UiButton
        variant="primary"
        icon="download"
        :loading="state === 'busy'"
        @click="$emit('export', format)"
        >{{ state === "done" ? t("trackExport.again") : t("trackExport.submit") }}</UiButton
      >
      <p v-if="state !== 'idle'" class="s-export__status" :class="'is-' + state" role="status">
        <template v-if="state === 'busy'">{{ t("trackExport.busy") }}</template>
        <template v-else>
          <UiIcon name="check" :size="14" />
          <span>{{ t("trackExport.done") }}</span>
          <span v-if="fileName" class="s-export__file">{{ fileName }}</span>
        </template>
      </p>
    </div>
  </section>
</template>
<style scoped>
.s-export {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
  min-width: 0;
}
.s-export__facts {
  display: grid;
  gap: var(--s-2);
  font-size: var(--s-text-sm);
}
.s-export__facts div {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-3);
}
.s-export__facts dt {
  flex: none;
  min-width: 8.5rem;
  color: var(--s-ink-3);
}
.s-export__facts dd {
  flex: 1 1 14rem;
  min-width: 0;
  color: var(--s-ink);
}
.s-export__spec,
.s-export__file {
  font-family: var(--s-font-mono);
  font-stretch: 87.5%;
  font-variant-numeric: tabular-nums;
}
.s-export__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-4);
}
.s-export__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-2);
  min-width: 0;
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-export__status.is-done {
  color: var(--s-verdigris);
}
.s-export__file {
  overflow-wrap: anywhere;
  color: var(--s-ink);
}
</style>
