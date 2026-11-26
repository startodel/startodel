<script setup lang="ts">
import { privateTrackPath } from "../../../../../shared/locale";
definePageMeta({ layout: "site" });
const countArgs = useCountArgs();
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
usePublicHead(
  t("public.trackTitle", { title: track.title }),
  track.description || t("public.by", { author: "@" + login }),
  path,
  "website",
  (pageUrl) => ({
    "@type": "Course",
    name: track.title,
    author: {
      "@type": "Person",
      name: track.author.name || track.author.login,
      url: pageUrl("/u/" + encodeURIComponent(track.author.login)),
    },
  }),
);
const { user } = useUserSession();
const { state: copyState, copy } = useCopy();
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
const topics = computed(
  () =>
    data.value?.topics.map((topic, i) => ({
      id: topic.slug,
      tag: "T" + String(i + 1).padStart(2, "0"),
      title: topic.title,
      level: 0,
      summary: topic.summary,
      lessons: topic.lessons.map(({ id, title }) => ({ id, title, to: path + "/lessons/" + id })),
    })) ?? [],
);
const selected = ref<string | undefined>(topics.value[0]?.id);
const sources = computed(() =>
  [data.value?.sources.repo, ...(data.value?.sources.docs ?? [])].filter(
    (url): url is string => !!url,
  ),
);
const perPage = 4;
const page = ref(1);
const forks = computed(() =>
  data.value?.forks.slice((page.value - 1) * perPage, page.value * perPage),
);
</script>
<template>
  <div v-if="data" class="s-page public">
    <header class="public__head">
      <p class="public__owner">
        <UiAvatar :name="data.author.name || login" :src="data.author.avatarUrl" :size="24" />
        <NuxtLinkLocale class="public__login" :to="'/u/' + encodeURIComponent(login)"
          >{{ data.author.name ? data.author.name + " · " : "" }}@{{ login }}</NuxtLinkLocale
        >
        <span>/ {{ slug }}</span>
      </p>
      <h1 class="s-title">{{ data.title }}</h1>
      <p v-if="data.description" class="public__lead">{{ data.description }}</p>
      <div class="s-cluster" style="--s-gap: var(--s-2) var(--s-4)">
        <UiForkedFrom
          v-if="data.forkedFrom"
          :login="data.forkedFrom.login"
          :slug="data.forkedFrom.slug"
          :to="
            data.forkedFrom.source
              ? '/u/' +
                encodeURIComponent(data.forkedFrom.source.login) +
                '/' +
                encodeURIComponent(data.forkedFrom.source.slug)
              : undefined
          "
        />
        <UiBadge icon="track">{{ $t("count.topics", countArgs(topics.length)) }}</UiBadge>
        <UiBadge icon="lesson">{{
          $t("count.lessons", countArgs(topics.reduce((n, topic) => n + topic.lessons.length, 0)))
        }}</UiBadge>
        <UiBadge icon="fork">{{ $t("count.forks", countArgs(data.forkCount)) }}</UiBadge>
        <span class="s-muted public__updated">{{
          $t("public.created", {
            created: displayDate(data.createdAt),
            updated: displayDate(data.updatedAt),
          })
        }}</span>
      </div>
      <div class="s-cluster public__actions" v-if="user?.login !== login">
        <UiForkButton
          v-if="user"
          :count="data.forkCount"
          :busy="busy"
          :count-to="{ path, hash: '#forks' }"
          @fork="fork"
        />
        <UiButton v-else variant="primary" icon="fork" to="/">{{
          $t("public.loginFork")
        }}</UiButton>
        <p class="s-muted public__hint">{{ $t("public.forkHint") }}</p>
      </div>
      <div v-else class="s-cluster public__actions">
        <UiBadge tone="verdigris" icon="globe">{{ $t("visibility.public") }}</UiBadge>
        <UiButton icon="link" @click="copy(publicUrl)">{{ $t("visibility.copy") }}</UiButton>
        <UiButton
          icon="lock"
          :to="{ path: privateTrackPath(slug), query: { visibility: 'edit' } }"
          >{{ $t("public.visibility") }}</UiButton
        >
        <UiButton variant="ghost" icon-right="arrow-right" :to="privateTrackPath(slug)">{{
          $t("public.workspace")
        }}</UiButton>
        <span role="status">{{
          copyState === "copied" ? $t("common.copied") : copyState === "failed" ? publicUrl : ""
        }}</span>
      </div>
      <UiNotice v-if="forkFailed" tone="danger" :title="$t('public.forkError')" />
    </header>
    <figure v-if="topics.length" class="public__board">
      <UiTrackMap
        v-model:selected="selected"
        class="s-grid"
        :topics="topics"
        :edges="data.edges"
        :label="$t('track.graph')"
        :flow="false"
        outline
        interactive
      />
      <figcaption class="public__caption">
        <span class="s-label">{{ $t("track.graph") }} · {{ $t("public.inspect") }}</span>
      </figcaption>
    </figure>
    <div class="s-split" style="--s-aside: 22rem">
      <section class="s-stack" style="--s-gap: var(--s-4)">
        <UiSectionHeading :title="$t('track.topics')" :count="$n(topics.length)" />
        <UiCollapsible
          v-for="topic in topics"
          :key="topic.id"
          :title="topic.tag + ' · ' + topic.title"
          :open="selected === topic.id"
          keep-mounted
          @update:open="selected = $event ? topic.id : undefined"
        >
          <template #meta>{{ $t("count.lessons", countArgs(topic.lessons.length)) }}</template>
          <p v-if="topic.summary">{{ topic.summary }}</p>
          <UiLessonList v-if="topic.lessons.length" :lessons="topic.lessons" />
          <UiEmptyState v-else :title="$t('topic.empty')" icon="lesson" compact />
        </UiCollapsible>
        <UiEmptyState v-if="!topics.length" :title="$t('track.empty')" icon="track" compact />
        <UiCollapsible v-if="sources.length" :title="$t('track.sources')" keep-mounted>
          <UiResourceLink v-for="url in sources" :key="url" :title="url" :url="url" />
        </UiCollapsible>
      </section>
      <aside id="forks" class="s-stack">
        <UiSectionHeading :title="$t('public.forks')" :count="$n(data.forks.length)" />
        <UiTrackCard
          v-for="f in forks"
          :key="f.login + '/' + f.slug"
          :title="f.title"
          :to="'/u/' + encodeURIComponent(f.login) + '/' + encodeURIComponent(f.slug)"
          :owner="{ login: f.login, to: '/u/' + encodeURIComponent(f.login) }"
          :updated="displayDate(f.createdAt)"
        />
        <UiEmptyState v-if="!data.forks.length" :title="$t('public.noForks')" icon="fork" compact />
        <UiPagination
          v-if="data.forks.length > perPage"
          v-model:page="page"
          :total="data.forks.length"
          :per-page="perPage"
          :label="$t('public.forks')"
        />
      </aside>
    </div>
  </div>
  <UiSkeletonList v-else />
</template>
<style scoped>
.public {
  display: grid;
  gap: var(--s-10);
  padding-block: var(--s-10) var(--s-16);
}
.public__head {
  display: grid;
  gap: var(--s-4);
}
.public__owner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  font: 500 var(--s-text-sm) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.public__login {
  color: var(--s-ink);
  text-decoration: none;
}
.public__login:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.public__lead {
  max-width: 44rem;
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.public__updated,
.public__hint {
  font-size: var(--s-text-sm);
}
.public__actions {
  margin-top: var(--s-2);
  padding-top: var(--s-5);
  border-top: 1px solid var(--s-line);
}
.public__board {
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-sunken);
  overflow: hidden;
}
.public__caption {
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
}
</style>
