<script setup lang="ts">
defineProps<{ sections: { id: string; title: string }[] }>();
const route = useRoute();
const pages = [
  { to: "/design", label: "Foundations" },
  { to: "/design/components", label: "Components" },
];
</script>
<template>
  <ShowcaseRoot>
    <div class="docs">
      <header class="docs__bar">
        <NuxtLink to="/design" class="docs__brand">
          <UiLogo :size="22" class="docs__logo" /><UiLogo
            variant="mark"
            :size="22"
            class="docs__mark"
          /><span class="docs__name">Design system</span>
        </NuxtLink>
        <nav class="docs__pages" aria-label="Showcase">
          <NuxtLink
            v-for="p in pages"
            :key="p.to"
            :to="p.to"
            class="docs__page"
            :aria-current="route.path.replace(/\/$/, '') === p.to ? 'page' : undefined"
            >{{ p.label }}</NuxtLink
          >
        </nav>
        <UiThemeToggle />
      </header>
      <div class="docs__layout">
        <nav class="docs__toc" aria-label="On this page">
          <p class="s-label">On this page</p>
          <ol>
            <li v-for="(s, i) in sections" :key="s.id">
              <a :href="'#' + s.id"
                ><span class="docs__index">{{ String(i + 1).padStart(2, "0") }}</span
                >{{ s.title }}</a
              >
            </li>
          </ol>
        </nav>
        <main class="docs__main"><slot /></main>
      </div>
    </div>
  </ShowcaseRoot>
</template>
<style scoped>
.docs {
  container: docs / inline-size;
  min-height: 100dvh;
}
.docs__bar {
  position: sticky;
  top: 0;
  z-index: var(--s-z-nav);
  display: flex;
  align-items: center;
  gap: var(--s-6);
  min-height: 3.25rem;
  padding: 0 var(--s-6);
  border-bottom: 1px solid var(--s-line);
  background: color-mix(in srgb, var(--s-bg) 92%, transparent);
  backdrop-filter: blur(6px);
}
.docs__brand {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
.docs__name {
  padding-left: var(--s-3);
  border-left: 1px solid var(--s-line-strong);
  font: 500 var(--s-text-2xs) / 1.6 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.docs__brand .docs__mark {
  display: none;
}
.docs__pages {
  display: flex;
  gap: var(--s-5);
  min-width: 0;
  margin-right: auto;
  overflow-x: auto;
  scrollbar-width: none;
}
.docs__page {
  position: relative;
  flex: none;
  padding: 1rem 0;
  font-size: var(--s-text-sm);
  font-weight: 600;
  color: var(--s-ink-3);
}
.docs__page:hover,
.docs__page[aria-current="page"] {
  color: var(--s-ink);
}
.docs__page[aria-current="page"]::after {
  content: "";
  position: absolute;
  inset: auto 0 -1px;
  height: 2px;
  background: var(--s-copper-fill);
}
.docs__layout {
  display: grid;
  grid-template-columns: 13rem minmax(0, 1fr);
  gap: var(--s-10);
  max-width: 84rem;
  margin: 0 auto;
  padding: 0 var(--s-6);
}
.docs__toc {
  position: sticky;
  top: 3.25rem;
  align-self: start;
  max-height: calc(100dvh - 3.25rem);
  padding: var(--s-8) 0;
  overflow-y: auto;
  scrollbar-width: none;
}
.docs__toc ol {
  display: grid;
  gap: 1px;
  margin-top: var(--s-3);
  list-style: none;
}
.docs__toc a {
  display: flex;
  gap: var(--s-3);
  padding: 0.3125rem 0;
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.docs__toc a:hover {
  color: var(--s-copper);
}
.docs__index {
  font: 500 var(--s-text-2xs) / 1.75 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.docs__main {
  min-width: 0;
  padding: var(--s-10) 0 var(--s-24);
}
@container docs (max-width: 56rem) {
  .docs__bar {
    gap: var(--s-4);
    padding: 0 var(--s-4);
  }
  .docs__name {
    display: none;
  }
  .docs__layout {
    grid-template-columns: minmax(0, 1fr);
    padding: 0 var(--s-4);
  }
  .docs__toc {
    display: none;
  }
}
@container docs (max-width: 34rem) {
  .docs__brand .docs__logo {
    display: none;
  }
  .docs__brand .docs__mark {
    display: inline-flex;
  }
}
</style>
