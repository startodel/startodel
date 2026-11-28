<script setup lang="ts">
import { useFileSize } from "./files";
/** A drop zone for files. It hands the chosen files to the caller and uploads nothing itself. */
const props = defineProps<{
  /** Passed to the file dialog, such as "video/mp4,.pdf". A drop is not filtered by it. */
  accept?: string;
  /** The accepted types as the learner reads them, such as "MP4, PDF, ZIP". */
  formats?: string;
  /** The largest accepted file, in bytes. Shown as a hint only. */
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  /** Why files cannot be added, such as a full storage. Shown in place of the invitation. */
  disabledReason?: string;
}>();
const emit = defineEmits<{ files: [files: File[]] }>();
const { t } = useI18n();
const fileSize = useFileSize();
const input = useTemplateRef("input");

const hint = computed(() =>
  [props.formats, props.maxSize && t("upload.limit", { size: fileSize(props.maxSize) })]
    .filter(Boolean)
    .join(" · "),
);

// Entering a child fires a leave on the zone, so the drag is counted in and out.
const depth = ref(0);
const over = computed(() => depth.value > 0 && !props.disabled);
const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
function enter(event: DragEvent) {
  if (carriesFiles(event)) depth.value++;
}
function leave(event: DragEvent) {
  if (carriesFiles(event)) depth.value = Math.max(depth.value - 1, 0);
}
function hand(files: FileList | null | undefined) {
  if (props.disabled || !files?.length) return;
  emit("files", props.multiple ? [...files] : [files[0]!]);
}
function drop(event: DragEvent) {
  depth.value = 0;
  hand(event.dataTransfer?.files);
}
function choose() {
  hand(input.value?.files);
  // The same file can be chosen again after the caller rejects or removes it.
  if (input.value) input.value.value = "";
}
</script>
<template>
  <div
    class="s-upload s-grid"
    :class="{ 'is-over': over, 'is-disabled': disabled }"
    @dragenter.prevent="enter"
    @dragover.prevent
    @dragleave="leave"
    @drop.prevent="drop"
  >
    <UiIcon class="s-upload__glyph" :name="disabled ? 'lock' : 'upload'" :size="20" />
    <p v-if="disabled && disabledReason" class="s-upload__reason">{{ disabledReason }}</p>
    <p v-else class="s-upload__title">
      {{ over ? t("upload.release") : multiple ? t("upload.dropMany") : t("upload.dropOne") }}
    </p>
    <UiButton :disabled="disabled" @click="input?.click()">{{
      multiple ? t("upload.chooseMany") : t("upload.chooseOne")
    }}</UiButton>
    <p v-if="hint" class="s-upload__hint">{{ hint }}</p>
    <input
      ref="input"
      type="file"
      hidden
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="choose"
    />
  </div>
</template>
<style scoped>
.s-upload {
  display: grid;
  justify-items: center;
  gap: var(--s-3);
  padding: var(--s-8) var(--s-4);
  border: 1px dashed var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background-color: var(--s-bg);
  text-align: center;
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    background-color var(--s-dur-1) var(--s-ease);
}
.s-upload__glyph {
  color: var(--s-ink-3);
}
.s-upload__title {
  font-size: var(--s-text-md);
  font-weight: 600;
  color: var(--s-ink);
}
.s-upload__hint {
  font: 500 var(--s-text-2xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-upload__reason {
  max-width: 28rem;
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-upload.is-over {
  border-style: solid;
  border-color: var(--s-copper);
  background-color: var(--s-copper-soft);
}
.s-upload.is-over .s-upload__glyph,
.s-upload.is-over .s-upload__title {
  color: var(--s-copper);
}
.s-upload.is-disabled {
  background-image: none;
  background-color: var(--s-sunken);
}
.s-upload.is-disabled .s-upload__title {
  color: var(--s-ink-3);
}
</style>
