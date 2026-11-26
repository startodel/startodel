<script setup lang="ts">
/**
 * The answer box of a Grill Question. The learner writes in the reading voice and submits once.
 * Ctrl or Command with Enter submits.
 */
const props = withDefaults(
  defineProps<{ id: string; busy?: boolean; error?: string; rows?: number; maxLength?: number }>(),
  { rows: 7 },
);
const draft = defineModel<string>({ default: "" });
const emit = defineEmits<{ submit: [] }>();
const words = computed(() => draft.value.trim().split(/\s+/).filter(Boolean).length);
const ready = computed(() => !!draft.value.trim() && !props.busy);
const submit = () => ready.value && emit("submit");
const countArgs = useCountArgs();
</script>
<template>
  <form class="s-answer" @submit.prevent="submit">
    <label class="s-answer__label" :for="id">{{ $t("grill.answer") }}</label>
    <UiTextarea
      :id="id"
      v-model="draft"
      :rows="rows"
      :maxlength="maxLength"
      :disabled="busy"
      :invalid="!!error"
      :aria-describedby="id + '-note'"
      :placeholder="$t('grill.placeholder')"
      @keydown.ctrl.enter.prevent="submit"
      @keydown.meta.enter.prevent="submit"
    />
    <div class="s-answer__foot">
      <UiButton type="submit" variant="primary" :loading="busy" :disabled="!ready">{{
        $t("grill.submit")
      }}</UiButton>
      <p
        :id="id + '-note'"
        class="s-answer__note"
        :class="{ 'is-error': error }"
        :role="error ? 'alert' : undefined"
      >
        <template v-if="error">{{ error }}</template>
        <template v-else>
          <span class="s-answer__count">{{ $t("count.words", countArgs(words)) }}</span>
          <i18n-t keypath="grill.submitKeys" tag="span" class="s-answer__keys" scope="global">
            <template #keys
              ><UiKbd v-for="key in ['Ctrl', 'Enter']" :key="key">{{ key }}</UiKbd></template
            >
          </i18n-t>
        </template>
      </p>
    </div>
    <p class="s-answer__rule">{{ $t("grill.once") }}</p>
  </form>
</template>
<style scoped>
.s-answer {
  display: grid;
  gap: var(--s-3);
}
.s-answer__label {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-answer__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3) var(--s-4);
}
.s-answer__note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-4);
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.s-answer__note.is-error {
  color: var(--s-oxide);
}
.s-answer__count {
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
}
.s-answer__keys {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
}
.s-answer__rule {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
@media (hover: none) {
  .s-answer__keys {
    display: none;
  }
}
</style>
