<script setup lang="ts">
import { PublicProfilePatch, type ProfileLink } from "@startodel/core";
export interface ProfileSettings {
  handle: string;
  headline: string | null;
  bio: string | null;
  links: ProfileLink[];
  publicProfileEnabled: boolean;
  showActivityHeatmap: boolean;
  includePrivateActivity: boolean;
  showLearningProgress: boolean;
  tracks: { id: string; title: string; pinOrder: number | null }[];
}
const props = defineProps<{
  settings: ProfileSettings;
  save: (patch: PublicProfilePatch) => Promise<void>;
  profileTo?: string;
}>();
const localePath = useLocalePath();
const { t } = useI18n();
const values = (s: ProfileSettings) => ({
  handle: s.handle,
  headline: s.headline ?? "",
  bio: s.bio ?? "",
  links: s.links.map((link) => ({ ...link })),
  publicProfileEnabled: s.publicProfileEnabled,
  showActivityHeatmap: s.showActivityHeatmap,
  includePrivateActivity: s.includePrivateActivity,
  showLearningProgress: s.showLearningProgress,
  pinnedTrackIds: s.tracks
    .filter((x) => x.pinOrder !== null)
    .sort((a, b) => a.pinOrder! - b.pinOrder!)
    .map((x) => x.id),
});
const form = ref(values(props.settings));
const busy = ref(false),
  message = ref(""),
  saved = ref(false);
watch(
  () => props.settings,
  (settings) => {
    form.value = values(settings);
  },
);
const switches = computed(
  () =>
    [
      {
        key: "publicProfileEnabled",
        label: t("publicProfile.enabled"),
        hint: t("publicProfile.enabledHint"),
      },
      {
        key: "showActivityHeatmap",
        label: t("publicProfile.heatmap"),
        hint: t("publicProfile.heatmapHint"),
      },
      {
        key: "includePrivateActivity",
        label: t("publicProfile.privateActivity"),
        hint: t("publicProfile.privateHint"),
      },
      {
        key: "showLearningProgress",
        label: t("publicProfile.progress"),
        hint: t("publicProfile.progressHint"),
      },
    ] as const,
);
const ordered = computed(() => {
  const pins = form.value.pinnedTrackIds;
  return [...props.settings.tracks].sort(
    (a, b) =>
      (pins.includes(a.id) ? pins.indexOf(a.id) : 6) -
      (pins.includes(b.id) ? pins.indexOf(b.id) : 6),
  );
});
function pin(id: string, checked: boolean) {
  form.value.pinnedTrackIds = checked
    ? [...form.value.pinnedTrackIds, id]
    : form.value.pinnedTrackIds.filter((x) => x !== id);
}
function earlier(id: string) {
  const pins = form.value.pinnedTrackIds,
    i = pins.indexOf(id);
  if (i > 0) pins.splice(i - 1, 2, id, pins[i - 1]!);
}
const patch = computed(() => {
  const initial = values(props.settings);
  const changed: Record<string, unknown> = Object.fromEntries(
    Object.entries(form.value).filter(
      ([key, value]) =>
        JSON.stringify(value) !== JSON.stringify(initial[key as keyof typeof initial]),
    ),
  );
  if ("links" in changed)
    changed.links = form.value.links.map((link) => ({
      ...link,
      label: link.label?.trim() || undefined,
    }));
  for (const key of ["bio", "headline"] as const)
    if (key in changed) changed[key] = form.value[key].trim() || null;
  return changed;
});
watch(
  form,
  () => {
    saved.value = false;
    message.value = "";
  },
  { deep: true },
);
async function submit() {
  const input = PublicProfilePatch.safeParse(patch.value);
  if (!input.success) {
    message.value = input.error.issues.some((i) => i.path[0] === "handle")
      ? t("publicProfile.invalidHandle")
      : t("publicProfile.invalidLinks");
    return;
  }
  busy.value = true;
  message.value = "";
  try {
    await props.save(input.data);
    saved.value = true;
  } catch (error) {
    const status =
      error && typeof error === "object" && "statusCode" in error ? error.statusCode : null;
    message.value =
      status === 409
        ? t("publicProfile.taken")
        : status === 404
          ? t("publicProfile.pinMissing")
          : t("common.error");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <form class="s-profile-form" @submit.prevent="submit">
    <p>
      <NuxtLinkLocale
        v-if="settings.publicProfileEnabled"
        class="s-link"
        :to="profileTo || '/u/' + settings.handle"
        >{{ localePath("/u/" + settings.handle) }}</NuxtLinkLocale
      >
      <span v-else class="s-muted">{{ localePath("/u/" + settings.handle) }}</span>
    </p>
    <fieldset :disabled="busy" class="s-profile-form__fields">
      <UiField :label="$t('publicProfile.handle')" :hint="$t('publicProfile.handleHint')"
        ><UiInput
          v-model="form.handle"
          required
          maxlength="40"
          autocapitalize="none"
          :spellcheck="false"
          mono
      /></UiField>
      <UiField :label="$t('publicProfile.headline')"
        ><UiInput v-model="form.headline" maxlength="100"
      /></UiField>
      <UiField :label="$t('publicProfile.bio')"
        ><UiTextarea v-model="form.bio" :rows="3" maxlength="360"
      /></UiField>
      <fieldset class="s-profile-form__block">
        <legend>{{ $t("publicProfile.links") }}</legend>
        <div v-for="(link, i) in form.links" :key="i" class="s-profile-form__link">
          <UiField :label="$t('publicProfile.url')"
            ><UiInput v-model="link.url" type="url" maxlength="2048" required
          /></UiField>
          <UiField :label="$t('publicProfile.linkLabel')"
            ><UiInput v-model="link.label" maxlength="60"
          /></UiField>
          <UiButton
            size="sm"
            icon="x"
            :label="$t('publicProfile.removeLink', { n: i + 1 })"
            @click="form.links.splice(i, 1)"
          />
        </div>
        <div>
          <UiButton
            size="sm"
            icon="plus"
            :disabled="form.links.length >= 6"
            @click="form.links.push({ url: '' })"
            >{{ $t("publicProfile.addLink") }}</UiButton
          >
        </div>
      </fieldset>
      <fieldset class="s-profile-form__block">
        <legend>{{ $t("publicProfile.visibility") }}</legend>
        <div v-for="toggle in switches" :key="toggle.key" class="s-profile-form__option">
          <UiSwitch v-model="form[toggle.key]">{{ toggle.label }}</UiSwitch>
          <p>{{ toggle.hint }}</p>
        </div>
      </fieldset>
      <fieldset class="s-profile-form__block">
        <legend>{{ $t("publicProfile.pins") }}</legend>
        <p class="s-muted">{{ $t("publicProfile.pinHint") }}</p>
        <p v-if="!ordered.length" class="s-muted">{{ $t("public.noTracks") }}</p>
        <div v-for="track in ordered" :key="track.id" class="s-profile-form__pin">
          <UiCheckbox
            :model-value="form.pinnedTrackIds.includes(track.id)"
            :disabled="form.pinnedTrackIds.length === 6 && !form.pinnedTrackIds.includes(track.id)"
            @update:model-value="pin(track.id, $event)"
            >{{ track.title }}</UiCheckbox
          >
          <UiButton
            v-if="form.pinnedTrackIds.indexOf(track.id) > 0"
            variant="ghost"
            size="sm"
            icon="chevron-up"
            :label="$t('publicProfile.earlier', { title: track.title })"
            @click="earlier(track.id)"
          />
        </div>
      </fieldset>
    </fieldset>
    <div class="s-cluster">
      <UiButton type="submit" variant="primary" :disabled="busy || !Object.keys(patch).length">{{
        $t("publicProfile.save")
      }}</UiButton>
      <span v-if="saved" role="status">{{ $t("publicProfile.saved") }}</span>
    </div>
    <UiNotice v-if="message" tone="danger" :title="message" />
  </form>
</template>
<style scoped>
.s-profile-form,
.s-profile-form__fields,
.s-profile-form__block {
  display: grid;
  min-width: 0;
  gap: var(--s-5);
}
.s-profile-form__fields,
.s-profile-form__block {
  border: 0;
  padding: 0;
  margin: 0;
}
.s-profile-form__block {
  gap: var(--s-3);
}
.s-profile-form__block legend {
  font-weight: 600;
  padding: var(--s-2) 0 var(--s-3);
}
.s-profile-form__link,
.s-profile-form__pin {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s-2);
}
.s-profile-form__link > :first-child {
  flex: 2 1 15rem;
}
.s-profile-form__link > :nth-child(2) {
  flex: 1 1 9rem;
}
.s-profile-form__pin {
  align-items: center;
  justify-content: space-between;
  overflow-wrap: anywhere;
}
.s-profile-form__option {
  display: grid;
  justify-items: start;
  gap: var(--s-1);
  padding-bottom: var(--s-3);
  border-bottom: 1px solid var(--s-line);
}
.s-profile-form__option p {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
</style>
