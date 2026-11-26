<script setup lang="ts">
import { LEGAL_TERMS_VERSION } from "@startodel/core";
import { COMPLETE_LEVEL } from "../../components/ui/board";

definePageMeta({ layout: "app" });
const { t } = useI18n();
const countArgs = useCountArgs();
const displayDate = useDisplayDate();
const route = useRoute();
const url = `/api/tracks/${String(route.params.id)}` as const;
const { data, error, refresh } = await useFetch(`${url}/graph`);
if (error.value?.statusCode === 404)
  throw createError({ statusCode: 404, message: t("common.error") });
useHead({ title: () => data.value?.track.title });
const topics = computed(
  () =>
    data.value?.topics.map(({ id, title, level }, i) => ({
      id,
      title,
      level,
      tag: "T" + String(i + 1).padStart(2, "0"),
    })) ?? [],
);
const edges = computed(
  () => data.value?.edges.map((e) => ({ from: e.fromTopicId, to: e.toTopicId })) ?? [],
);
const selected = ref<string>();
watch(
  () => topics.value.find((row) => row.id === route.query.topic)?.id,
  (id) => {
    selected.value = id;
  },
  { immediate: true },
);
const { data: details, error: topicError, refresh: retryTopic } = await useTopicDetails(selected);
const completed = computed(() => topics.value.filter((t) => t.level >= COMPLETE_LEVEL).length);
const sources = computed(() =>
  [data.value?.track.sources.repo, ...(data.value?.track.sources.docs ?? [])].flatMap((s) =>
    s ? (httpUrl(s) ?? []) : [],
  ),
);

const { user } = useUserSession();
const origin = usePublicOrigin();
const localePath = useLocalePath();
const publicPath = computed(
  () => "/u/" + encodeURIComponent(user.value?.login ?? "") + "/" + data.value?.track.slug,
);
const { state: copyState, copy } = useCopy();
const open = ref(false);
const agree = ref(false);
const saving = ref(false);
const saveError = ref(false);
const accepted = computed(
  () =>
    data.value?.termsAcceptance?.version === LEGAL_TERMS_VERSION && data.value.termsAcceptance.at,
);
const canSave = computed(() => !!(data.value?.track.public || accepted.value || agree.value));
function confirmVisibility() {
  agree.value = false;
  saveError.value = false;
  open.value = true;
}
async function save() {
  if (!data.value || !canSave.value || saving.value) return;
  saving.value = true;
  saveError.value = false;
  try {
    await $fetch(`${url}/visibility`, {
      method: "PATCH",
      body: {
        public: !data.value.track.public,
        ...(agree.value ? { acceptTerms: true } : {}),
      },
    });
    await refresh();
    open.value = false;
  } catch {
    saveError.value = true;
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <div class="s-stack">
    <UiNotice v-if="error" tone="danger" :title="$t('common.error')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <template v-else>
      <UiBreadcrumbs
        :items="[{ label: $t('nav.dashboard'), to: '/' }, { label: data.track.title }]"
      />
      <UiPageHeader :title="data.track.title" :description="data.track.description ?? undefined">
        <template #meta>
          <UiBadge tone="copper" pad>{{
            $t("dashboard.atLevel", { done: $n(completed), total: $n(topics.length) })
          }}</UiBadge>
          <UiBadge v-if="topics.length && completed === topics.length" icon="check">{{
            $t("dashboard.completed")
          }}</UiBadge>
          <UiBadge :icon="data.track.public ? 'globe' : 'lock'">{{
            data.track.public ? $t("visibility.public") : $t("visibility.private")
          }}</UiBadge>
          <UiBadge icon="fork">{{ $t("count.forks", countArgs(data.track.forkCount)) }}</UiBadge>
          <UiForkedFrom
            v-if="data.track.forkedFrom"
            :login="data.track.forkedFrom.login"
            :slug="data.track.forkedFrom.slug"
            :to="
              data.track.forkedFrom.source
                ? '/u/' +
                  encodeURIComponent(data.track.forkedFrom.source.login) +
                  '/' +
                  data.track.forkedFrom.source.slug
                : undefined
            "
          />
        </template>
        <template #actions
          ><UiButton @click="confirmVisibility">{{
            data.track.public ? $t("visibility.unpublish") : $t("visibility.makePublic")
          }}</UiButton></template
        >
      </UiPageHeader>
      <div v-if="data.track.public" class="s-cluster">
        <NuxtLinkLocale :to="publicPath" class="s-link">{{
          origin + localePath(publicPath)
        }}</NuxtLinkLocale>
        <UiButton icon="copy" @click="copy(origin + localePath(publicPath))">{{
          $t("visibility.copy")
        }}</UiButton>
        <span role="status">{{
          copyState === "copied"
            ? $t("common.copied")
            : copyState === "failed"
              ? $t("visibility.manual")
              : ""
        }}</span>
      </div>
      <UiModal
        v-model:open="open"
        :title="data.track.public ? $t('visibility.closeTitle') : $t('visibility.publishTitle')"
        :description="data.track.public ? $t('visibility.closeInfo') : $t('visibility.publishInfo')"
      >
        <template v-if="!data.track.public">
          <p v-if="accepted">{{ $t("visibility.accepted", { date: displayDate(accepted) }) }}</p>
          <UiCheckbox v-else v-model="agree" required>
            <i18n-t keypath="visibility.agree" scope="global">
              <template #rules
                ><NuxtLinkLocale
                  to="/rules"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="s-link"
                  >{{ $t("visibility.rules") }}</NuxtLinkLocale
                ></template
              >
              <template #terms
                ><NuxtLinkLocale
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="s-link"
                  >{{ $t("visibility.terms") }}</NuxtLinkLocale
                ></template
              >
            </i18n-t>
          </UiCheckbox>
        </template>
        <UiNotice v-if="saveError" tone="danger" :title="$t('visibility.error')" />
        <template #footer>
          <UiButton @click="open = false">{{ $t("common.cancel") }}</UiButton>
          <UiButton
            variant="primary"
            :disabled="!canSave || saving"
            :loading="saving"
            @click="save"
            >{{
              data.track.public ? $t("visibility.unpublish") : $t("visibility.publish")
            }}</UiButton
          >
        </template>
      </UiModal>
      <div v-if="topics.length" class="s-split">
        <UiTrackBoard
          v-model:selected="selected"
          :topics="topics"
          :edges="edges"
          :label="$t('track.graph')"
        />
        <aside>
          <UiEmptyState v-if="!selected" :title="$t('track.details')" icon="track" compact>{{
            $t("track.select")
          }}</UiEmptyState>
          <UiNotice v-else-if="topicError" tone="danger" :title="$t('topic.load')"
            ><template #actions
              ><UiButton @click="retryTopic()">{{ $t("common.retry") }}</UiButton></template
            ></UiNotice
          >
          <UiTopicDetails
            v-else-if="details && details.topic.id === selected"
            :details="details"
            :track="data.track.id"
          />
          <UiSkeletonList v-else />
        </aside>
      </div>
      <UiEmptyState v-else :title="$t('track.empty')" icon="track" />
      <section v-if="sources.length">
        <UiCollapsible :title="$t('track.sources')" icon="link">
          <ul>
            <li v-for="(source, i) in sources" :key="i">
              <a class="s-link" :href="source" target="_blank" rel="noopener noreferrer">{{
                source
              }}</a>
            </li>
          </ul>
        </UiCollapsible>
      </section>
    </template>
  </div>
</template>
