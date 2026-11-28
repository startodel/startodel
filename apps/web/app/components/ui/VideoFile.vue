<script setup lang="ts">
import { useFileSize } from "./files";
/**
 * An uploaded video as a Lesson plate. Nothing is requested until the learner presses play,
 * and the address of the file is short-lived, so an expired one offers a reload.
 */
const props = withDefaults(
  defineProps<{
    title: string;
    /** In seconds. */
    duration?: number;
    /** In bytes. */
    size?: number;
    state?: "ready" | "processing" | "expired" | "locked";
    /** The signed address of the file. Without it the plate only emits `play`. */
    src?: string;
  }>(),
  { state: "ready" },
);
const emit = defineEmits<{ play: []; reload: [] }>();
const { t } = useI18n();
const fileSize = useFileSize();
const playing = ref(false);
watch(
  () => [props.state, props.src],
  () => (playing.value = false),
);
function play() {
  playing.value = !!props.src;
  emit("play");
}
const length = computed(() => {
  if (props.duration === undefined) return undefined;
  const seconds = Math.round(props.duration);
  const pad = (value: number) => String(value).padStart(2, "0");
  const rest = pad(Math.floor(seconds / 60) % 60) + ":" + pad(seconds % 60);
  return seconds >= 3600 ? Math.floor(seconds / 3600) + ":" + rest : rest.replace(/^0/, "");
});
const meta = computed(() =>
  [length.value, props.size !== undefined && fileSize(props.size)].filter(Boolean).join(" · "),
);
</script>
<template>
  <figure class="s-video-file" :class="'is-' + state">
    <div class="s-video-file__frame" data-theme="dark">
      <video v-if="playing && state === 'ready'" controls autoplay :src="src" :aria-label="title" />
      <button
        v-else-if="state === 'ready'"
        type="button"
        class="s-video-file__poster s-grid"
        @click="play"
      >
        <span class="s-video-file__pad s-video-file__pad--play"
          ><UiIcon name="play" :size="20"
        /></span>
        <span class="s-sr">{{ t("videoFile.play") }}</span>
        <span class="s-video-file__title">{{ title }}</span>
        <span v-if="meta" class="s-video-file__meta">{{ meta }}</span>
      </button>
      <div v-else class="s-video-file__poster">
        <span class="s-video-file__pad">
          <UiPending v-if="state === 'processing'" />
          <UiIcon v-else :name="state === 'expired' ? 'clock' : 'lock'" :size="20" />
        </span>
        <span class="s-video-file__title">{{ title }}</span>
        <span class="s-video-file__meta s-video-file__meta--state" role="status">
          {{
            state === "processing"
              ? t("videoFile.processing")
              : state === "expired"
                ? t("videoFile.expired")
                : t("videoFile.locked")
          }}
        </span>
        <UiButton v-if="state === 'expired'" size="sm" @click="emit('reload')">{{
          t("videoFile.reload")
        }}</UiButton>
      </div>
    </div>
    <figcaption v-if="playing || state !== 'ready'" class="s-video-file__note">
      <strong v-if="playing">{{ title }}</strong>
      <span v-if="meta">{{ meta }}</span>
    </figcaption>
  </figure>
</template>
<style scoped>
.s-video-file {
  container: s-video-file / inline-size;
  display: grid;
  gap: var(--s-2);
}
/* Clipping without a scroll container lets the frame outgrow 16:9 when a narrow plate needs the room. */
.s-video-file__frame {
  aspect-ratio: 16 / 9;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-bg);
  color: var(--s-ink);
  overflow: clip;
}
.s-video-file__frame video {
  display: block;
  width: 100%;
  height: 100%;
}
.s-video-file__poster {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--s-3);
  width: 100%;
  height: 100%;
  padding: var(--s-6);
  text-align: center;
}
.s-video-file__pad {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  border: 1px dashed var(--s-line-strong);
  border-radius: 50%;
  color: var(--s-ink-2);
}
.s-video-file__pad--play {
  border: 0;
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
  transition: scale var(--s-dur-2) var(--s-ease);
}
.s-video-file__poster:hover .s-video-file__pad--play {
  scale: 1.08;
}
.s-video-file__title {
  max-width: 28rem;
  font: 500 var(--s-text-xl) / 1.25 var(--s-font-read);
  text-wrap: balance;
}
.s-video-file__meta,
.s-video-file__note {
  font: 500 var(--s-text-2xs) / 1.4 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-video-file.is-processing .s-video-file__meta--state {
  color: var(--s-copper);
}
.s-video-file.is-expired .s-video-file__meta--state {
  color: var(--s-brass);
}
.s-video-file__note {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1) var(--s-3);
}
@container s-video-file (max-width: 24rem) {
  .s-video-file__poster {
    gap: var(--s-2);
    padding: var(--s-4);
  }
  .s-video-file__pad {
    width: 2.5rem;
    height: 2.5rem;
  }
  .s-video-file__title {
    font-size: var(--s-text-md);
  }
}
.s-video-file__note strong {
  font: 600 var(--s-text-sm) / 1.4 var(--s-font-ui);
  font-stretch: normal;
  letter-spacing: 0;
  text-transform: none;
  color: var(--s-ink);
}
</style>
