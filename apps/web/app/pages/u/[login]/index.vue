<script setup lang="ts">
const countArgs = useCountArgs();
const { t } = useI18n();
const login = encodeURIComponent(String(useRoute().params.login));
const { data, error } = await useFetch(`/api/public/${login}`);
if (!data.value)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    message: t("common.error"),
  });
usePublicHead(
  t("public.profileTitle", { name: data.value.name || data.value.login }),
  t("public.profile", { author: "@" + data.value.login }),
  "/u/" + login,
  "profile",
);
</script>
<template>
  <main v-if="data" class="narrow">
    <div class="actions">
      <img v-if="data.avatarUrl" :src="data.avatarUrl" alt="" width="64" height="64" />
      <div>
        <h1>{{ data.name || data.login }}</h1>
        <span>@{{ data.login }}</span>
      </div>
    </div>
    <h2>{{ $t("public.tracks") }}</h2>
    <p v-if="!data.tracks.length">{{ $t("public.noTracks") }}</p>
    <article v-for="track in data.tracks" :key="track.slug" class="panel">
      <h3>
        <NuxtLinkLocale :to="'/u/' + login + '/' + track.slug">{{ track.title }}</NuxtLinkLocale>
      </h3>
      <p v-if="track.description">{{ track.description }}</p>
      <small>{{ $t("count.forks", countArgs(track.forkCount)) }}</small>
    </article>
  </main>
</template>
