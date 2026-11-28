<script setup lang="ts">
import type { FileKind } from "../../ui/files";
import { usePlannedSample } from "./sample-content";
const sample = usePlannedSample();
const media = computed(() => sample.value.media);
const MB = 1_000_000;
const GB = 1_000_000_000;

// Nothing is uploaded: the chosen files only become rows that wait at zero.
const chosen = ref<{ name: string; size: number; kind: FileKind }[]>([]);
function choose(files: File[]) {
  chosen.value = files.map((file) => ({
    name: file.name,
    size: file.size,
    kind: file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("image/")
        ? "image"
        : /zip|tar|compressed/.test(file.type)
          ? "archive"
          : "document",
  }));
}

// A file dragged over the zone cannot be staged, so the specimen plays the event the browser would send.
const hovered = useTemplateRef("hovered");
onMounted(() => {
  try {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([], "event-loop-phases.mp4", { type: "video/mp4" }));
    hovered.value?.firstElementChild?.dispatchEvent(new DragEvent("dragenter", { dataTransfer }));
  } catch {
    // Without the constructors the zone stays at rest. Dragging a real file over it still works.
  }
});
</script>
<template>
  <ShowcaseSpecimen
    id="planned-attachment-list"
    label="Attachment · every state"
    note="Rows of one list, separated by hairlines. The state is a glyph and a word"
    layout="stack"
  >
    <ul style="max-width: 44rem">
      <UiAttachment
        kind="video"
        state="uploading"
        :name="media.files.uploading"
        :size="184 * MB"
        :progress="62"
      />
      <UiAttachment
        kind="video"
        state="processing"
        :name="media.files.processing"
        :size="412 * MB"
      />
      <UiAttachment kind="image" :name="media.files.image" :size="348_000" href="#" />
      <UiAttachment :name="media.files.document" :size="2.4 * MB" href="#" />
      <UiAttachment
        kind="archive"
        state="failed"
        :name="media.files.failed"
        :size="18.6 * MB"
        :error="media.failed"
      />
      <UiAttachment
        kind="video"
        state="over-quota"
        :name="media.files.overQuota"
        :size="2.4 * GB"
      />
    </ul>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-upload"
    label="Upload"
    note="The button opens the file dialog. The zone itself is not a tab stop. Chosen files go to the caller"
    layout="stack"
  >
    <UiUpload
      multiple
      accept="video/mp4,image/png,application/pdf,.zip"
      :formats="media.formats"
      :max-size="500 * MB"
      @files="choose"
    />
    <ul v-if="chosen.length" style="max-width: 44rem">
      <UiAttachment
        v-for="file in chosen"
        :key="file.name"
        state="uploading"
        v-bind="file"
        @cancel="chosen = chosen.filter((other) => other !== file)"
      />
    </ul>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-upload-states"
    label="Upload · a file over the zone, and a full storage"
    note="Over the zone the outline turns solid and the title says what a release does"
  >
    <div ref="hovered" style="flex: 1 1 20rem; min-width: 0">
      <UiUpload accept="video/mp4,video/webm" :formats="media.videoFormats" :max-size="2 * GB" />
    </div>
    <div style="flex: 1 1 20rem; min-width: 0">
      <UiUpload
        multiple
        disabled
        :formats="media.formats"
        :max-size="500 * MB"
        :disabled-reason="media.quotaFull"
      />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-quota"
    label="Storage quota"
    note="Normal, almost full, full, and an instance without a limit"
    layout="grid"
  >
    <UiCard>
      <UiStorageQuota
        :used="4.2 * GB"
        :total="10 * GB"
        :breakdown="[
          { label: media.kinds.video, bytes: 3.6 * GB },
          { label: media.kinds.files, bytes: 0.6 * GB },
        ]"
      />
    </UiCard>
    <UiCard>
      <UiStorageQuota
        :used="9.4 * GB"
        :total="10 * GB"
        :breakdown="[
          { label: media.kinds.video, bytes: 8.1 * GB },
          { label: media.kinds.files, bytes: 1.3 * GB },
        ]"
      />
    </UiCard>
    <UiCard>
      <UiStorageQuota :used="10 * GB" :total="10 * GB" />
    </UiCard>
    <UiCard>
      <UiStorageQuota
        :used="38.4 * GB"
        :breakdown="[
          { label: media.kinds.video, bytes: 35.2 * GB },
          { label: media.kinds.files, bytes: 3.2 * GB },
        ]"
      />
    </UiCard>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-video-file"
    label="Video file"
    note="Ready, processing, an expired link and no access. Nothing is requested before play"
  >
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiVideoFile :title="media.video.ready" :duration="768" :size="184 * MB" />
    </div>
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiVideoFile state="processing" :title="media.video.processing" :size="412 * MB" />
    </div>
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiVideoFile state="expired" :title="media.video.expired" :duration="1325" :size="296 * MB" />
    </div>
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiVideoFile state="locked" :title="media.video.locked" :duration="4210" />
    </div>
  </ShowcaseSpecimen>
</template>
