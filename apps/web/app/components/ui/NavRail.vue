<script setup lang="ts">
import type { LinkTarget, NavItem, NavTrack, NavUser } from "./nav";
withDefaults(
  defineProps<{
    items: NavItem[];
    current?: string;
    tracks?: NavTrack[];
    currentTrack?: string;
    user?: NavUser;
    home?: LinkTarget;
  }>(),
  { home: "/" },
);
defineEmits<{ logout: [] }>();
const collapsed = defineModel<boolean>("collapsed", { default: false });
</script>
<template>
  <aside class="s-rail" :class="{ 's-rail--collapsed': collapsed }">
    <div class="s-rail__brand">
      <NuxtLinkLocale :to="home" class="s-rail__home" :aria-label="$t('nav.home')">
        <UiLogo :variant="collapsed ? 'mark' : 'full'" :size="22" />
      </NuxtLinkLocale>
      <button
        type="button"
        class="s-rail__toggle"
        :aria-label="collapsed ? $t('nav.expand') : $t('nav.collapse')"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <UiIcon name="rail" />
      </button>
    </div>
    <nav class="s-rail__nav" :aria-label="$t('nav.main')">
      <ul class="s-rail__list">
        <li v-for="item in items" :key="item.id">
          <NuxtLinkLocale
            :to="item.to"
            class="s-rail__item"
            :class="{ 'is-current': item.id === current }"
            :aria-current="item.id === current ? 'page' : undefined"
            :title="collapsed ? item.label : undefined"
          >
            <UiIcon :name="item.icon" class="s-rail__icon" />
            <span class="s-rail__label">{{ item.label }}</span>
            <span v-if="item.count" class="s-rail__count"
              >{{ item.count }}<span class="s-sr">{{ " " + $t("nav.pending") }}</span></span
            >
          </NuxtLinkLocale>
        </li>
      </ul>
      <template v-if="tracks?.length">
        <p class="s-rail__heading">{{ $t("nav.tracks") }}</p>
        <ul class="s-rail__list">
          <li v-for="t in tracks" :key="t.id">
            <NuxtLinkLocale
              :to="t.to"
              class="s-rail__item s-rail__item--track"
              :class="{ 'is-current': t.id === currentTrack }"
              :aria-current="t.id === currentTrack ? 'page' : undefined"
              :title="collapsed ? t.title : undefined"
            >
              <span
                class="s-rail__pad"
                :class="{ 'is-done': t.percent >= 100 }"
                aria-hidden="true"
              />
              <span class="s-rail__label">{{ t.title }}</span>
              <span class="s-rail__percent">{{ t.percent }}%</span>
            </NuxtLinkLocale>
          </li>
        </ul>
      </template>
    </nav>
    <div class="s-rail__foot">
      <slot name="foot" />
      <div v-if="user" class="s-rail__user">
        <UiAvatar :name="user.name || user.login" :src="user.avatarUrl" :size="28" />
        <span class="s-rail__who">
          <span class="s-rail__name">{{ user.name || user.login }}</span>
          <span class="s-rail__login">@{{ user.login }}</span>
        </span>
        <button
          type="button"
          class="s-rail__toggle"
          :aria-label="$t('nav.logout')"
          :title="$t('nav.logout')"
          @click="$emit('logout')"
        >
          <UiIcon name="logout" />
        </button>
      </div>
    </div>
  </aside>
</template>
<style scoped>
.s-rail {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  width: var(--s-rail);
  height: 100%;
  padding: var(--s-4) var(--s-3);
  border-right: 1px solid var(--s-line);
  background: var(--s-surface);
  overflow: hidden auto;
  scrollbar-width: none;
}
.s-rail--collapsed {
  width: var(--s-rail-collapsed);
}
.s-rail__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  min-height: 2rem;
  padding-left: var(--s-2);
}
.s-rail--collapsed .s-rail__brand {
  flex-direction: column;
  padding-left: 0;
}
.s-rail__home {
  display: inline-flex;
  border-radius: var(--s-radius-sm);
}
.s-rail__toggle {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--s-control-sm);
  height: var(--s-control-sm);
  border-radius: var(--s-radius-sm);
  color: var(--s-ink-3);
}
.s-rail__toggle:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-rail__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
  min-height: 0;
}
.s-rail__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  list-style: none;
}
.s-rail__heading {
  margin: var(--s-5) 0 var(--s-1);
  padding: 0 var(--s-2);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-rail--collapsed .s-rail__heading {
  height: 1px;
  margin: var(--s-3) var(--s-2);
  padding: 0;
  background: var(--s-line);
  overflow: hidden;
  color: transparent;
}
.s-rail__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: 2.125rem;
  padding: 0 var(--s-2);
  border: 1px solid transparent;
  border-radius: var(--s-radius-sm);
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
  font-weight: 500;
  transition:
    background var(--s-dur-1) var(--s-ease),
    color var(--s-dur-1) var(--s-ease);
}
.s-rail__item:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-rail__item.is-current {
  border-color: var(--s-line);
  background: var(--s-raised);
  color: var(--s-ink);
  font-weight: 600;
  box-shadow: var(--s-shadow-1);
}
.s-rail__item.is-current::before {
  content: "";
  position: absolute;
  left: -0.8125rem;
  top: 50%;
  width: 0.5rem;
  height: 2px;
  background: var(--s-copper-fill);
  translate: 0 -50%;
}
.s-rail__item.is-current .s-rail__icon {
  color: var(--s-copper);
}
.s-rail__icon {
  width: 1.125rem;
  color: var(--s-ink-3);
}
.s-rail__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-rail__count,
.s-rail__percent {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
}
.s-rail__count {
  min-width: 1.125rem;
  padding: 0.1875rem 0.3125rem;
  border-radius: var(--s-radius-xs);
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
  text-align: center;
}
.s-rail__percent {
  color: var(--s-ink-3);
}
.s-rail__item--track {
  font-weight: 400;
}
.s-rail__pad {
  flex: none;
  width: 0.5rem;
  height: 0.5rem;
  margin: 0 0.3125rem;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--s-line-strong);
}
.s-rail__pad.is-done {
  background: var(--s-copper-fill);
  box-shadow: none;
}
.s-rail__item--track.is-current .s-rail__pad {
  box-shadow: inset 0 0 0 1.5px var(--s-copper-fill);
}
.s-rail__foot {
  display: grid;
  gap: var(--s-3);
}
.s-rail__user {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding-top: var(--s-3);
  border-top: 1px solid var(--s-line);
}
.s-rail__who {
  flex: 1;
  min-width: 0;
  display: grid;
  line-height: 1.25;
}
.s-rail__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--s-text-sm);
  font-weight: 600;
}
.s-rail__login {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 400 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.s-rail--collapsed :is(.s-rail__label, .s-rail__percent, .s-rail__who) {
  display: none;
}
.s-rail--collapsed .s-rail__item {
  justify-content: center;
  padding: 0;
}
.s-rail--collapsed .s-rail__count {
  position: absolute;
  top: 0.1875rem;
  right: 0.1875rem;
  min-width: 0;
  width: 0.4375rem;
  height: 0.4375rem;
  padding: 0;
  border-radius: 50%;
  overflow: hidden;
  color: transparent;
}
.s-rail--collapsed :is(.s-rail__user, .s-rail__foot) {
  justify-items: center;
  flex-direction: column;
}
</style>
