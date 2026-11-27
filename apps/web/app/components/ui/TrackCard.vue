<script setup lang="ts">
import type { LinkTarget } from "./nav";
/** A Public Track in a list: on a Public Profile or among the Forks of a Track. */
defineProps<{
  title: string;
  to: LinkTarget;
  description?: string | null;
  /** Shown when the list mixes Owners, such as a list of Forks. */
  owner?: { login: string; name?: string | null; avatarUrl?: string | null; to?: LinkTarget };
  topics?: number;
  pinned?: boolean;
  lessons?: number;
  forks?: number;
  updated?: string;
}>();
const countArgs = useCountArgs();
</script>
<template>
  <article class="s-trackcard">
    <p v-if="owner" class="s-trackcard__owner">
      <UiAvatar :name="owner.name || owner.login" :src="owner.avatarUrl" :size="20" />
      <NuxtLinkLocale v-if="owner.to" :to="owner.to" class="s-link s-trackcard__profile"
        >@{{ owner.login }}</NuxtLinkLocale
      >
      <span v-else>@{{ owner.login }}</span>
    </p>
    <h3 class="s-trackcard__title">
      <NuxtLinkLocale :to="to" class="s-trackcard__link">{{ title }}</NuxtLinkLocale>
    </h3>
    <p v-if="description" class="s-trackcard__text">{{ description }}</p>
    <p
      v-if="
        pinned || topics !== undefined || lessons !== undefined || forks !== undefined || updated
      "
      class="s-trackcard__facts"
    >
      <span v-if="pinned"><UiIcon name="pin" :size="12" />{{ $t("publicProfile.pinned") }}</span>
      <span v-if="topics !== undefined"
        ><UiIcon name="track" :size="12" />{{ $t("count.topics", countArgs(topics)) }}</span
      >
      <span v-if="lessons !== undefined"
        ><UiIcon name="lesson" :size="12" />{{ $t("count.lessons", countArgs(lessons)) }}</span
      >
      <span v-if="forks !== undefined"
        ><UiIcon name="fork" :size="12" />{{ $t("count.forks", countArgs(forks)) }}</span
      >
      <span v-if="updated" class="s-trackcard__updated">{{ updated }}</span>
    </p>
  </article>
</template>
<style scoped>
.s-trackcard {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--s-2);
  padding: var(--s-4) var(--s-5);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease);
}
.s-trackcard:hover {
  border-color: var(--s-ink);
  box-shadow: var(--s-shadow-2);
}
.s-trackcard__owner {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
.s-trackcard__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.s-trackcard__link {
  color: inherit;
  text-decoration: none;
}
.s-trackcard__profile {
  position: relative;
  z-index: 1;
}
/* Extend the Track link across the card, below the separate profile link. */
.s-trackcard__link::after {
  content: "";
  position: absolute;
  inset: 0;
}
.s-trackcard__text {
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
}
.s-trackcard__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1) var(--s-4);
  margin-top: var(--s-2);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.04em;
  color: var(--s-ink-3);
}
.s-trackcard__facts span {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
}
.s-trackcard__updated {
  margin-left: auto;
}
</style>
