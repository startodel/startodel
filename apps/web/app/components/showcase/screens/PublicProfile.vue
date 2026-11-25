<script setup lang="ts">
import { samplePublicTracks, sampleProfile, screenPath } from "../sample";
const forks = samplePublicTracks.reduce((sum, t) => sum + t.forks, 0);
</script>
<template>
  <ShowcaseSite>
    <div class="s-page profile">
      <header class="profile__head">
        <UiAvatar :name="sampleProfile.name" :size="72" />
        <div class="profile__who">
          <h1 class="s-title">{{ sampleProfile.name }}</h1>
          <p class="profile__login">@{{ sampleProfile.login }}</p>
        </div>
        <dl class="profile__stats">
          <UiStat label="Public Tracks" :value="samplePublicTracks.length" />
          <UiStat label="Forks of them" :value="forks" />
        </dl>
      </header>

      <section class="s-stack" style="--s-gap: var(--s-4)">
        <UiSectionHeading title="Public Tracks" :count="samplePublicTracks.length" />
        <div class="s-columns" style="--s-col: 20rem">
          <UiTrackCard
            v-for="t in samplePublicTracks"
            :key="t.slug"
            :title="t.title"
            :to="screenPath('public-track')"
            :description="t.description"
            :topics="t.topics"
            :lessons="t.lessons"
            :forks="t.forks"
            :updated="t.updated"
          />
        </div>
      </section>

      <section class="s-stack" style="--s-gap: var(--s-4)">
        <UiSectionHeading title="When there is nothing to show" :level="3" />
        <UiEmptyState title="No Public Tracks yet" icon="globe" compact>
          @{{ sampleProfile.login }} has not published a Track.
        </UiEmptyState>
      </section>
    </div>
  </ShowcaseSite>
</template>
<style scoped>
.profile {
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
</style>
