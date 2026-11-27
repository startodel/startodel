<script setup lang="ts">
import { TrackLanguage } from "@startodel/core";
const props = defineProps<{
  language: TrackLanguage;
  save: (tag: TrackLanguage) => Promise<void> | void;
}>();
const { t } = useI18n();
const open = ref(false);
const choice = ref("");
const custom = ref("");
const saving = ref(false);
const failed = ref(false);
const options = computed(() => [
  { value: "en", label: t("trackLanguage.english") },
  { value: "ru", label: t("trackLanguage.russian") },
  { value: "*", label: t("trackLanguage.other") },
]);
const tag = computed(() => (choice.value === "*" ? custom.value : choice.value));
const valid = computed(() => TrackLanguage.safeParse(tag.value).success);
watch(open, (shown) => {
  if (!shown) return;
  choice.value = ["en", "ru"].includes(props.language) ? props.language : "*";
  custom.value = choice.value === "*" ? props.language : "";
  failed.value = false;
});
async function submit() {
  if (saving.value || !valid.value) return;
  saving.value = true;
  failed.value = false;
  try {
    await props.save(tag.value);
    open.value = false;
  } catch {
    failed.value = true;
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <UiPopover v-model:open="open" align="start">
    <template #trigger>
      <button
        class="s-language-edit"
        type="button"
        :aria-label="$t('trackLanguage.edit', { tag: language })"
      >
        <UiTrackLanguageBadge :language="language" /><UiIcon name="chevron-down" :size="12" />
      </button>
    </template>
    <form class="s-stack" style="--s-gap: var(--s-3)" @submit.prevent="submit">
      <UiField :label="$t('trackLanguage.label')">
        <UiSelect v-model="choice" size="sm" :options="options" :disabled="saving" />
      </UiField>
      <UiField
        v-if="choice === '*'"
        :label="$t('trackLanguage.tag')"
        :hint="$t('trackLanguage.format')"
        :error="custom && !valid ? $t('trackLanguage.format') : undefined"
      >
        <UiInput
          v-model="custom"
          size="sm"
          mono
          autocapitalize="none"
          :spellcheck="false"
          :disabled="saving"
        />
      </UiField>
      <UiNotice v-if="failed" tone="danger" :title="$t('trackLanguage.saveError')" />
      <UiButton type="submit" size="sm" :loading="saving" :disabled="!valid">{{
        $t("trackLanguage.save")
      }}</UiButton>
    </form>
  </UiPopover>
</template>
<style scoped>
.s-language-edit {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  color: var(--s-ink-2);
}
.s-language-edit:hover {
  color: var(--s-copper);
}
</style>
