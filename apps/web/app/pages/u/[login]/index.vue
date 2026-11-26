<script setup lang="ts">
definePageMeta({ layout: "site" });
const displayDate = useDisplayDate();
const { t } = useI18n();
const login = encodeURIComponent(String(useRoute().params.login));
const { data, error } = await useFetch(`/api/public/${login}`);
const profile = data.value;
if (!profile)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    message: t("common.error"),
  });
usePublicHead(
  t("public.profileTitle", { name: profile.name || profile.login }),
  t("public.profile", { author: "@" + profile.login }),
  "/u/" + login,
  "profile",
  () => ({
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.name || profile.login,
      alternateName: "@" + profile.login,
    },
  }),
);
const forkTotal = computed(() => data.value?.tracks.reduce((sum, t) => sum + t.forkCount, 0) ?? 0);
</script>
<template>
  <div v-if="data" class="s-page s-stack">
    <header class="s-cluster">
      <UiAvatar :name="data.name || data.login" :src="data.avatarUrl" :size="72" />
      <div>
        <h1 class="s-title">{{ data.name || data.login }}</h1>
        <p class="s-mono s-muted">@{{ data.login }}</p>
      </div>
      <dl class="s-cluster profile-stats">
        <UiStat :label="$t('public.tracks')" :value="$n(data.tracks.length)" />
        <UiStat :label="$t('public.totalForks')" :value="$n(forkTotal)" />
      </dl>
    </header>
    <section class="s-stack">
      <UiSectionHeading :title="$t('public.tracks')" :count="$n(data.tracks.length)" />
      <div v-if="data.tracks.length" class="s-columns">
        <UiTrackCard
          v-for="track in data.tracks"
          :key="track.slug"
          :to="'/u/' + login + '/' + encodeURIComponent(track.slug)"
          :title="track.title"
          :description="track.description"
          :forks="track.forkCount"
          :updated="$t('ui.updated', { date: displayDate(track.updatedAt) })"
        />
      </div>
      <UiEmptyState v-else icon="globe" :title="$t('public.noTracks')" compact />
    </section>
  </div>
  <UiSkeletonList v-else />
</template>
<style scoped>
.profile-stats {
  margin-inline-start: auto;
  gap: var(--s-8);
}
</style>
