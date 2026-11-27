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
const { language, options, filtered } = useTrackLanguageFilter(() => data.value?.tracks);
</script>
<template>
  <div v-if="data" class="s-page profile">
    <header class="profile__head">
      <UiAvatar :name="data.name || data.login" :src="data.avatarUrl" :size="72" />
      <div class="profile__who">
        <h1 class="s-title">{{ data.name || data.login }}</h1>
        <p class="profile__login">@{{ data.login }}</p>
      </div>
      <dl class="profile__stats">
        <UiStat :label="$t('public.tracks')" :value="$n(data.tracks.length)" />
        <UiStat :label="$t('public.totalForks')" :value="$n(forkTotal)" />
      </dl>
    </header>
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
          :language="track.language"
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
