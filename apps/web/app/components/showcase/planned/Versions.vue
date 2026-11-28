<script setup lang="ts">
import type { TrackVersion } from "../../ui/TrackVersions.vue";
import { usePlannedSample } from "./sample-content";
const sample = usePlannedSample();
const versions = computed(() => sample.value.versions);
const contents = { topics: 6, lessons: 18, quizzes: 7, exercises: 5, mediaLinks: 9 };
const timers: ReturnType<typeof setTimeout>[] = [];
const later = (run: () => void, ms = 1100) => timers.push(setTimeout(run, ms));
onBeforeUnmount(() => timers.forEach(clearTimeout));

const added = ref<TrackVersion[]>([]);
const history = computed(() => [...versions.value.list, ...added.value]);
const publishing = ref(false);
function publish(note: string) {
  publishing.value = true;
  later(() => {
    added.value.push({
      number: history.value.length + 1,
      publishedAt: new Date().toISOString(),
      note,
      changes: { blocksChanged: 1 },
    });
    publishing.value = false;
  });
}

const format = ref<"file" | "folder">("file");
const exporting = ref<"idle" | "busy" | "done">("idle");
function exportTrack() {
  exporting.value = "busy";
  later(() => (exporting.value = "done"));
}
const folder = ref<"file" | "folder">("folder");

// A JSON file passes the check, anything else fails it, so both results can be reached.
const importing = ref<"empty" | "checking" | "valid" | "invalid">("empty");
const fileName = ref("");
const creating = ref(false);
function check(file: File) {
  fileName.value = file.name;
  importing.value = "checking";
  later(() => (importing.value = file.name.endsWith(".json") ? "valid" : "invalid"));
}
function create() {
  creating.value = true;
  later(() => {
    creating.value = false;
    importing.value = "empty";
  });
}
</script>
<template>
  <ShowcaseSpecimen
    id="planned-versions"
    label="Track versions · many"
    note="Newest first. Publish a version to see it join the timeline"
    layout="stack"
  >
    <UiTrackVersions
      can-publish
      :versions="history"
      :fork-base="2"
      :publishing="publishing"
      @publish="publish"
    />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-versions-few"
    label="Track versions · none and one"
    note="Without versions the Owner is offered the first one. A reader sees the timeline alone"
  >
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiTrackVersions can-publish :versions="[]" />
    </div>
    <div style="flex: 1 1 22rem; min-width: 0; align-self: flex-start">
      <UiTrackVersions :versions="versions.list.slice(2)" :fork-base="1" />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-export"
    label="Track export"
    note="Export it to see the busy and the done states"
    layout="stack"
  >
    <UiTrackExport
      v-model:format="format"
      spec-version="1.0"
      :contents="contents"
      :state="exporting"
      :file-name="format === 'file' ? versions.fileName : versions.folderName"
      @export="exportTrack"
    />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-export-states"
    label="Track export · busy and done"
    note="While the file is built the choice is locked"
  >
    <div style="flex: 1 1 24rem; min-width: 0; align-self: flex-start">
      <UiTrackExport spec-version="1.0" state="busy" :contents="contents" />
    </div>
    <div style="flex: 1 1 24rem; min-width: 0; align-self: flex-start">
      <UiTrackExport
        v-model:format="folder"
        spec-version="1.0"
        state="done"
        :contents="{ topics: 6, lessons: 18, quizzes: 7, exercises: 5 }"
        :file-name="versions.folderName"
      />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-import"
    label="Track import"
    note="Choose a .json file to see a valid result, any other file to see the report"
    layout="stack"
  >
    <UiTrackImport
      :state="importing"
      :file-name="fileName"
      :title="versions.title"
      :contents="contents"
      :errors="versions.errors"
      :creating="creating"
      :max-size="20_000_000"
      @file="check"
      @create="create"
      @reset="importing = 'empty'"
    />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-import-states"
    label="Track import · checking, valid, invalid"
    note="A valid file says what it will create. An invalid one lists each error with its path"
  >
    <div style="flex: 1 1 24rem; min-width: 0; align-self: flex-start">
      <UiTrackImport state="checking" :file-name="versions.fileName" />
    </div>
    <div style="flex: 1 1 24rem; min-width: 0; align-self: flex-start">
      <UiTrackImport
        state="valid"
        :file-name="versions.fileName"
        :title="versions.title"
        :contents="contents"
      />
    </div>
    <div style="flex: 1 1 24rem; min-width: 0; align-self: flex-start">
      <UiTrackImport state="invalid" :file-name="versions.brokenName" :errors="versions.errors" />
    </div>
  </ShowcaseSpecimen>
</template>
