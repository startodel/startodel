<script setup lang="ts">
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
if (!data.value)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    message: t("common.error"),
  });
usePublicHead(
  t("public.trackTitle", { title: data.value.title }),
  data.value.description || t("public.by", { author: "@" + login }),
  path,
);
const { user } = useUserSession();
const busy = ref(false);
const forkFailed = ref(false);
async function fork() {
  if (busy.value) return;
  busy.value = true;
  forkFailed.value = false;
  try {
    const track = await $fetch("/api/tracks/fork", { method: "POST", body: { login, slug } });
    await navigateTo(localePath("/tracks/" + track.id));
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
  <div v-if="data" class="s-page s-stack">
    <div class="s-stack">
      <div class="s-cluster">
        <UiAvatar :name="data.author.name || login" :src="data.author.avatarUrl" :size="32" />
        <NuxtLinkLocale class="s-link" :to="'/u/' + encodeURIComponent(login)"
          >{{ data.author.name ? data.author.name + " · " : "" }}@{{ login }}</NuxtLinkLocale
        >
        <span class="s-mono s-muted">/ {{ slug }}</span>
      </div>
      <UiPageHeader
        :title="data.title"
        :description="data.description ?? undefined"
        voice="content"
      >
        <template #meta>
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
          <UiBadge icon="fork">{{ $t("count.forks", countArgs(data.forkCount)) }}</UiBadge>
          <span class="s-muted">{{
            $t("public.created", {
              created: displayDate(data.createdAt),
              updated: displayDate(data.updatedAt),
            })
          }}</span>
        </template>
        <template v-if="user?.login !== login" #actions>
          <UiForkButton
            v-if="user"
            :count="data.forkCount"
            :busy="busy"
            :count-to="{ path, hash: '#forks' }"
            @fork="fork"
          />
          <UiButton v-else variant="primary" icon="fork" to="/login">{{
            $t("public.loginFork")
          }}</UiButton>
        </template>
      </UiPageHeader>
      <UiNotice v-if="forkFailed" tone="danger" :title="$t('public.forkError')" />
      <UiCollapsible v-if="sources.length" :title="$t('track.sources')" keep-mounted>
        <UiResourceLink v-for="url in sources" :key="url" :title="url" :url="url" />
      </UiCollapsible>
    </div>
    <section v-if="topics.length" class="s-stack">
      <UiSectionHeading :title="$t('track.graph')" />
      <UiCard variant="sunken" padding="none">
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
      </UiCard>
    </section>
    <div class="s-split">
      <section class="s-stack">
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
