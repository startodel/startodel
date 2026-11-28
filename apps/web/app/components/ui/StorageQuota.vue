<script setup lang="ts">
import { fileUnit, useFileSize } from "./files";
/** The storage meter of an Owner. Without a total the instance sets no limit and only the use is shown. */
const props = withDefaults(
  defineProps<{
    /** In bytes. */
    used: number;
    /** In bytes. Left out on an instance without a limit. */
    total?: number | null;
    /** The used space by kind, in the order the bar draws it. */
    breakdown?: { label: string; bytes: number }[];
    /** The used share from which the storage reads as almost full. */
    warnAt?: number;
  }>(),
  { warnAt: 0.9 },
);
const { t } = useI18n();
const fileSize = useFileSize();

const state = computed(() => {
  if (!props.total) return "unlimited";
  if (props.used >= props.total) return "full";
  return props.used / props.total >= props.warnAt ? "almost" : "normal";
});
const unit = computed(() => fileUnit(props.total || props.used));
const usage = computed(() =>
  props.total
    ? t("storageQuota.usage", {
        used: fileSize(props.used, unit.value, true),
        total: fileSize(props.total, unit.value),
      })
    : t("storageQuota.used", { used: fileSize(props.used) }),
);
const free = computed(() => fileSize(Math.max((props.total ?? 0) - props.used, 0)));
const word = computed(() => {
  if (state.value === "unlimited") return t("storageQuota.unlimited");
  if (state.value === "full") return t("storageQuota.full");
  if (state.value === "almost") return t("storageQuota.almost");
  return t("storageQuota.normal");
});
// Without a breakdown the bar is one part. Parts are told apart by the gap between them, not by colour.
const parts = computed(() => {
  const total = props.total;
  if (!total) return [];
  const sources = props.breakdown?.length ? props.breakdown : [{ label: "", bytes: props.used }];
  const scale = props.used > total ? total / props.used : 1;
  return sources
    .filter((part) => part.bytes > 0)
    .map((part) => ({ label: part.label, share: ((part.bytes * scale) / total) * 100 }));
});
</script>
<template>
  <section class="s-quota" :class="'is-' + state" :aria-label="t('storageQuota.title')">
    <header class="s-quota__head">
      <h3 class="s-quota__title">{{ t("storageQuota.title") }}</h3>
      <p class="s-quota__state">
        <UiIcon
          :name="
            state === 'full'
              ? 'alert'
              : state === 'almost'
                ? 'gotcha'
                : state === 'unlimited'
                  ? 'pad'
                  : 'pad-on'
          "
          :size="12"
        />
        {{ word }}
      </p>
    </header>
    <p class="s-quota__usage">{{ usage }}</p>
    <div
      v-if="total"
      class="s-quota__bar"
      role="meter"
      aria-valuemin="0"
      :aria-valuemax="total"
      :aria-valuenow="Math.min(used, total)"
      :aria-valuetext="usage"
      :aria-label="t('storageQuota.title')"
    >
      <i v-for="(part, i) in parts" :key="i" :style="{ width: part.share + '%' }" />
    </div>
    <p v-if="state === 'full'" class="s-quota__note">{{ t("storageQuota.fullNote") }}</p>
    <p v-else-if="total" class="s-quota__note">{{ t("storageQuota.free", { size: free }) }}</p>
    <dl v-if="breakdown?.length" class="s-quota__kinds">
      <div v-for="part in breakdown" :key="part.label">
        <dt>{{ part.label }}</dt>
        <dd>{{ fileSize(part.bytes) }}</dd>
      </div>
    </dl>
  </section>
</template>
<style scoped>
.s-quota {
  --_fill: var(--s-ink-2);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-2);
  min-width: 0;
}
.s-quota.is-almost {
  --_fill: var(--s-brass);
}
.s-quota.is-full {
  --_fill: var(--s-oxide);
}
.s-quota__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-1) var(--s-3);
}
.s-quota__title,
.s-quota__state,
.s-quota__kinds {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-quota__state {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  font-weight: 600;
}
.s-quota.is-normal .s-quota__state {
  color: var(--s-verdigris);
}
.s-quota.is-almost .s-quota__state {
  color: var(--s-brass);
}
.s-quota.is-full .s-quota__state {
  color: var(--s-oxide);
}
.s-quota__usage {
  font: 600 var(--s-text-xl) / 1.1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: var(--s-ink);
}
.s-quota__bar {
  display: flex;
  gap: 2px;
  height: 0.5rem;
  border-radius: 1px;
  background: var(--s-line);
  overflow: hidden;
}
.s-quota__bar i {
  flex: none;
  min-width: 2px;
  background: var(--_fill);
}
.s-quota__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-quota__kinds {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1) var(--s-5);
  font-variant-numeric: tabular-nums;
}
.s-quota__kinds div {
  display: flex;
  gap: var(--s-2);
}
.s-quota__kinds dd {
  color: var(--s-ink);
}
</style>
