<script setup lang="ts">
/** A Link Block. It says where it leads before the learner follows it. */
const props = defineProps<{ title: string; url: string; note?: string }>();
const href = computed(() => httpUrl(props.url));
const host = computed(() => (href.value ? new URL(href.value).hostname.replace(/^www\./, "") : ""));
</script>
<template>
  <component
    :is="href ? 'a' : 'div'"
    class="s-resource"
    :href="href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
  >
    <span class="s-resource__pad" aria-hidden="true"><UiIcon name="link" /></span>
    <span class="s-resource__main">
      <span class="s-resource__title">{{ title }}</span>
      <span v-if="note" class="s-resource__note">{{ note }}</span>
      <span class="s-resource__host">{{ host || $t("ui.linkUnavailable") }}</span>
    </span>
    <UiIcon v-if="href" name="external" class="s-resource__out" />
  </component>
</template>
<style scoped>
.s-resource {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--s-4);
  align-items: start;
  padding: var(--s-4);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
  color: var(--s-ink);
  box-shadow: var(--s-shadow-1);
  transition: border-color var(--s-dur-1) var(--s-ease);
}
a.s-resource:hover {
  border-color: var(--s-ink);
}
.s-resource__pad {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--s-line-strong);
  border-radius: 50%;
  color: var(--s-ink-2);
}
.s-resource__main {
  display: grid;
  gap: 0.25rem;
}
.s-resource__title {
  font-weight: 600;
  line-height: 1.3;
}
a.s-resource:hover .s-resource__title {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-underline-offset: 0.2em;
}
.s-resource__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-resource__host {
  font: 500 var(--s-text-2xs) / 1.4 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.04em;
  color: var(--s-ink-3);
}
.s-resource__out {
  color: var(--s-ink-3);
}
</style>
