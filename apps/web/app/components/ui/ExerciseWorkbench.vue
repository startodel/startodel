<script setup lang="ts">
/** The bench of a code Exercise: the editor, the saved attempt and the actions, next to the results. */
const props = defineProps<{
  /** The saved attempt. Left out, the status line is not shown. */
  save?: "saved" | "unsaved" | "saving";
  /** When the attempt was saved, as an ISO date. */
  savedAt?: string;
}>();
const { t, locale } = useI18n();

// The time is local to the learner, so it is written only in the browser.
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const time = computed(() => {
  if (!mounted.value || !props.savedAt) return undefined;
  return new Intl.DateTimeFormat(locale.value, { hour: "2-digit", minute: "2-digit" }).format(
    new Date(props.savedAt),
  );
});
</script>
<template>
  <div class="s-workbench">
    <div class="s-workbench__layout" :class="{ 's-workbench__layout--split': $slots.results }">
      <div class="s-workbench__main">
        <slot name="editor" />
        <p v-if="save" class="s-workbench__save" :class="'is-' + save" role="status">
          <UiPending v-if="save === 'saving'" />
          <UiIcon v-else :name="save === 'saved' ? 'pad-on' : 'pad'" :size="12" />
          <span v-if="save === 'saving'">{{ t("exerciseWorkbench.saving") }}</span>
          <span v-else-if="save === 'unsaved'">{{ t("exerciseWorkbench.unsaved") }}</span>
          <i18n-t v-else-if="time" keypath="exerciseWorkbench.savedAt" tag="span" scope="global">
            <template #time><time :datetime="savedAt">{{ time }}</time></template>
          </i18n-t>
          <span v-else>{{ t("exerciseWorkbench.saved") }}</span>
        </p>
        <div v-if="$slots.actions" class="s-workbench__actions"><slot name="actions" /></div>
      </div>
      <div v-if="$slots.results" class="s-workbench__results"><slot name="results" /></div>
    </div>
  </div>
</template>
<style scoped>
.s-workbench {
  container: s-workbench / inline-size;
  min-width: 0;
}
.s-workbench__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
  align-items: start;
}
.s-workbench__main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-2);
}
.s-workbench__save {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  color: var(--s-ink-3);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-workbench__save.is-saved {
  color: var(--s-verdigris);
}
.s-workbench__save.is-unsaved {
  color: var(--s-brass);
}
.s-workbench__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin-top: var(--s-2);
}
@container s-workbench (min-width: 56rem) {
  .s-workbench__layout--split {
    grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
  }
}
</style>
