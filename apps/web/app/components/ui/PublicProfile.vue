<script setup lang="ts">
import type { PublicProfile } from "@startodel/core";
type ProfileView = Omit<PublicProfile, "tracks"> & {
  tracks: (Omit<PublicProfile["tracks"][number], "updatedAt" | "createdAt"> & {
    updatedAt: string;
  })[];
};
const props = defineProps<{ data: ProfileView; trackPath: (slug: string) => string }>();
const displayDate = useDisplayDate();
const forkTotal = computed(() =>
  props.data.tracks.reduce((sum, track) => sum + track.forkCount, 0),
);
const { language, options, filtered } = useTrackLanguageFilter(() => props.data.tracks);
const hostName = (url: string) => new URL(url).hostname;
</script>
<template>
  <div class="s-page profile">
    <header class="profile__head">
      <UiAvatar :name="data.name || data.login" :src="data.avatarUrl" :size="72" />
      <div class="profile__who">
        <h1 class="s-title">{{ data.name || data.login }}</h1>
        <p class="profile__login">@{{ data.login }}</p>
        <p v-if="data.headline" class="profile__headline">{{ data.headline }}</p>
      </div>
      <dl class="profile__stats">
        <UiStat :label="$t('public.tracks')" :value="$n(data.tracks.length)" />
        <UiStat :label="$t('public.totalForks')" :value="$n(forkTotal)" />
      </dl>
      <div v-if="data.bio || data.links.length" class="profile__intro">
        <p v-if="data.bio" class="profile__bio">{{ data.bio }}</p>
        <div v-if="data.links.length" class="s-cluster">
          <a
            v-for="(link, i) in data.links"
            :key="i"
            class="s-link profile__link"
            :href="link.url"
            rel="ugc me noopener noreferrer"
            ><UiIcon name="link" :size="14" />{{ link.label || hostName(link.url) }}</a
          >
        </div>
      </div>
    </header>
    <UiActivityHeatmap v-if="data.heatmap" :activity="data.heatmap" />
    <section class="s-stack">
      <UiTrackFilterHeading
        v-model="language"
        show-single
        :title="$t('public.tracks')"
        :count="filtered.length"
        :options="options"
      />
      <div v-if="data.tracks.length" class="s-columns" style="--s-col: 20rem">
        <UiTrackCard
          v-for="track in filtered"
          :key="track.slug"
          :to="trackPath(track.slug)"
          :title="track.title"
          :description="splitTrackDescription(track.description).lead"
          :topics="track.topicCount"
          :pinned="track.pinOrder !== null"
          :forks="track.forkCount"
          :updated="$t('ui.updated', { date: displayDate(track.updatedAt) })"
        />
      </div>
      <UiEmptyState v-else icon="globe" :title="$t('public.noTracks')" compact />
    </section>
    <section v-if="data.learningProgress" class="s-stack">
      <UiSectionHeading :title="$t('publicProfile.progress')" />
      <article v-for="track in data.learningProgress" :key="track.slug" class="profile__progress">
        <h3>
          <NuxtLinkLocale class="s-link" :to="trackPath(track.slug)">{{
            track.title
          }}</NuxtLinkLocale>
        </h3>
        <UiMasteryHistogram :counts="track.counts" />
      </article>
      <UiEmptyState
        v-if="!data.learningProgress.length"
        icon="progress"
        compact
        :title="$t('publicProfile.noProgress')"
      />
    </section>
  </div>
</template>
<style scoped>
.profile {
  grid-template-columns: minmax(0, 1fr);
  overflow-wrap: anywhere;
  display: grid;
  gap: var(--s-10);
  padding-block: var(--s-10) var(--s-16);
}
.profile__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-5) var(--s-6);
  padding-bottom: var(--s-8);
  border-bottom: 1px solid var(--s-line-strong);
}
.profile__who {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}
.profile__login {
  font: 500 var(--s-text-md) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.profile__stats {
  display: flex;
  gap: var(--s-8);
  margin-left: auto;
}
.profile__intro {
  flex-basis: 100%;
  display: grid;
  gap: var(--s-3);
}
.profile__headline {
  font-weight: 600;
  color: var(--s-ink-2);
}
.profile__bio {
  max-width: 65ch;
  font-family: var(--s-font-read);
  white-space: pre-line;
}
.profile__link {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--s-text-sm);
}
.profile__progress {
  display: grid;
  gap: var(--s-4);
  background: var(--s-surface);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  padding: var(--s-5);
}
</style>
