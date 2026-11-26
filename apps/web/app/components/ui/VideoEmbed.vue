<script setup lang="ts">
/**
 * A Video Block. Nothing is requested from YouTube until the learner presses play.
 * Only a validated video ID on youtube-nocookie.com is ever embedded.
 */
const props = defineProps<{ title: string; url: string; note?: string }>();
const embed = computed(() => youtubeEmbed(props.url));
const playing = ref(false);
</script>
<template>
  <figure class="s-video">
    <div class="s-video__frame" data-theme="dark">
      <iframe
        v-if="playing && embed"
        :src="embed + '?autoplay=1'"
        :title="title"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      />
      <button
        v-else-if="embed"
        type="button"
        class="s-video__poster s-grid"
        @click="playing = true"
      >
        <span class="s-video__play"><UiIcon name="play" :size="20" /></span>
        <span class="s-video__title">{{ title }}</span>
        <span class="s-video__source">{{ $t("lesson.videoLazy") }}</span>
      </button>
      <p v-else class="s-video__poster s-video__poster--off">
        <UiIcon name="video" :size="20" />
        <span class="s-video__source">{{ $t("lesson.videoOff") }}</span>
      </p>
    </div>
    <figcaption v-if="playing || !embed || note" class="s-video__note">
      <strong v-if="playing || !embed">{{ title }}</strong>
      <p v-if="note">{{ note }}</p>
    </figcaption>
  </figure>
</template>
<style scoped>
.s-video {
  display: grid;
  gap: var(--s-2);
}
.s-video__frame {
  aspect-ratio: 16 / 9;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-bg);
  color: var(--s-ink);
  overflow: hidden;
}
.s-video__frame iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
.s-video__poster {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--s-3);
  width: 100%;
  height: 100%;
  padding: var(--s-6);
  text-align: center;
}
.s-video__play {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
  transition: scale var(--s-dur-2) var(--s-ease);
}
.s-video__poster:hover .s-video__play {
  scale: 1.08;
}
.s-video__title {
  max-width: 28rem;
  font: 500 var(--s-text-xl) / 1.25 var(--s-font-read);
  text-wrap: balance;
}
.s-video__source {
  font: 500 var(--s-text-2xs) / 1.4 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-video__poster--off {
  color: var(--s-ink-3);
}
.s-video__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
</style>
