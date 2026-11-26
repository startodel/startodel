<script setup lang="ts">
import { privateTrackPath } from "../../../../../shared/locale";
import { publicTrackTopics } from "../../../../utils/public-track";
definePageMeta({ layout: "site" });
const localePath = useLocalePath();
const { t } = useI18n();
const displayDate = useDisplayDate();
const route = useRoute();
const login = String(route.params.login);
const slug = String(route.params.slug);
const path = "/u/" + encodeURIComponent(login) + "/" + encodeURIComponent(slug);
const { data, error } = await useFetch(
  `/api/public/${encodeURIComponent(login)}/${encodeURIComponent(slug)}`,
);
const track = data.value;
if (!track)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    message: t("common.error"),
  });
const profilePath = "/u/" + encodeURIComponent(track.author.login);
const description = splitTrackDescription(track.description);
const topics = publicTrackTopics(
  track.topics,
  track.edges,
  (id) => path + "/lessons/" + encodeURIComponent(id),
);
usePublicHead(
  t("public.trackTitle", { title: track.title }),
  description.lead || t("public.by", { author: "@" + login }),
  path,
  "website",
  (pageUrl) => ({
    "@type": "Course",
    name: track.title,
    description: description.lead || undefined,
    author: {
      "@type": "Person",
      name: track.author.name || track.author.login,
      url: pageUrl(profilePath),
    },
    syllabusSections: topics.map((topic) => ({
      "@type": "Syllabus",
      name: topic.title,
      description: topic.summary || undefined,
      hasPart: topic.lessons.map((lesson) => ({
        "@type": "LearningResource",
        name: lesson.title,
        url: pageUrl(lesson.to),
      })),
    })),
  }),
);
const { user } = useUserSession();
const isOwner = computed(() => user.value?.login === login);
const publicUrl = usePublicOrigin().value + localePath(path);
const busy = ref(false);
const forkFailed = ref(false);
async function fork() {
  if (busy.value) return;
  busy.value = true;
  forkFailed.value = false;
  try {
    const track = await $fetch("/api/tracks/fork", { method: "POST", body: { login, slug } });
    await navigateTo(localePath(privateTrackPath(track.slug)));
  } catch {
    forkFailed.value = true;
  } finally {
    busy.value = false;
  }
}
const perPage = 4;
const page = ref(1);
const forks = computed(() => track.forks.slice((page.value - 1) * perPage, page.value * perPage));
</script>
<template>
  <UiPublicTrack
    :title="track.title"
    :slug="slug"
    :description="description"
    :author="track.author"
    :profile-to="profilePath"
    :public-url="publicUrl"
    :topics="topics"
    :edges="track.edges"
    :sources="track.sources"
    :fork-count="track.forkCount"
    :dates="
      $t('public.created', {
        created: displayDate(track.createdAt),
        updated: displayDate(track.updatedAt),
      })
    "
  >
    <template #forked-from>
      <UiForkedFrom
        v-if="track.forkedFrom"
        :login="track.forkedFrom.login"
        :slug="track.forkedFrom.slug"
        :to="
          track.forkedFrom.source
            ? '/u/' +
              encodeURIComponent(track.forkedFrom.source.login) +
              '/' +
              encodeURIComponent(track.forkedFrom.source.slug)
            : undefined
        "
      />
    </template>
    <template #actions>
      <UiButton
        v-if="isOwner"
        variant="primary"
        icon-right="arrow-right"
        :to="privateTrackPath(slug)"
        >{{ $t("public.workspace") }}</UiButton
      >
      <UiForkButton
        v-else-if="user"
        :count="track.forkCount"
        :busy="busy"
        :count-to="{ path, hash: '#forks' }"
        @fork="fork"
      />
      <UiButton v-else variant="primary" icon="fork" to="/">{{ $t("public.loginFork") }}</UiButton>
    </template>
    <template #action-detail>
      <template v-if="isOwner">
        <UiButton
          icon="lock"
          :to="{ path: privateTrackPath(slug), query: { visibility: 'edit' } }"
          >{{ $t("public.visibility") }}</UiButton
        >
        <UiBadge tone="verdigris" icon="globe">{{ $t("visibility.public") }}</UiBadge>
      </template>
      <p v-else class="s-muted">{{ $t("public.forkHint") }}</p>
    </template>
    <template #notice>
      <UiNotice v-if="forkFailed" tone="danger" :title="$t('public.forkError')" />
    </template>
    <template #forks>
      <UiSectionHeading :title="$t('public.forks')" :count="$n(track.forks.length)" />
      <UiTrackCard
        v-for="f in forks"
        :key="f.login + '/' + f.slug"
        :title="f.title"
        :to="'/u/' + encodeURIComponent(f.login) + '/' + encodeURIComponent(f.slug)"
        :owner="{ login: f.login, to: '/u/' + encodeURIComponent(f.login) }"
        :updated="displayDate(f.createdAt)"
      />
      <UiEmptyState v-if="!track.forks.length" :title="$t('public.noForks')" icon="fork" compact />
      <UiPagination
        v-if="track.forks.length > perPage"
        v-model:page="page"
        :total="track.forks.length"
        :per-page="perPage"
        :label="$t('public.forks')"
      />
    </template>
  </UiPublicTrack>
</template>
