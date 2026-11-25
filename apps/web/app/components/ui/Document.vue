<script setup lang="ts">
/**
 * A long formal document, such as the Terms of Use. The Markdown is split at its second-level
 * headings so that every section gets a number and an anchor.
 */
const props = defineProps<{
  title: string;
  markdown: string;
  version?: string;
  updated?: string;
  /** The language of the text, when it differs from the page. */
  lang?: string;
}>();
const parts = computed(() => {
  const [intro = "", ...rest] = props.markdown.split(/^## /m);
  return {
    intro: intro.trim(),
    sections: rest.map((chunk, i) => {
      const [heading = "", ...body] = chunk.split("\n");
      return { id: "section-" + (i + 1), title: heading.trim(), body: body.join("\n").trim() };
    }),
  };
});
</script>
<template>
  <article class="s-document" :lang="lang">
    <header class="s-document__head">
      <div class="s-document__tools"><slot name="tools" /></div>
      <h1 class="s-document__title">{{ title }}</h1>
      <p class="s-document__meta">
        <span v-if="version">{{ $t("legal.version", { version }) }}</span>
        <span v-if="updated">{{ $t("ui.updated", { date: updated }) }}</span>
      </p>
    </header>
    <div class="s-document__layout">
      <nav v-if="parts.sections.length > 1" class="s-document__toc" :aria-label="$t('ui.sections')">
        <ol>
          <li v-for="(s, i) in parts.sections" :key="s.id">
            <a :href="'#' + s.id"><span>§{{ i + 1 }}</span>{{ s.title }}</a>
          </li>
        </ol>
      </nav>
      <div class="s-document__body">
        <UiProse v-if="parts.intro" :markdown="parts.intro" />
        <section
          v-for="(s, i) in parts.sections"
          :id="s.id"
          :key="s.id"
          class="s-document__section"
        >
          <h2 class="s-document__heading">
            <span aria-hidden="true">§{{ i + 1 }}</span>{{ s.title }}
          </h2>
          <UiProse :markdown="s.body" />
        </section>
        <slot />
      </div>
    </div>
  </article>
</template>
<style scoped>
.s-document {
  container: s-document / inline-size;
  display: grid;
  gap: var(--s-8);
  max-width: 64rem;
  margin: 0 auto;
}
.s-document__head {
  display: grid;
  gap: var(--s-3);
  padding-bottom: var(--s-6);
  border-bottom: 1px solid var(--s-line-strong);
}
.s-document__tools:empty {
  display: none;
}
.s-document__title {
  font: 500 clamp(1.75rem, 5cqi, var(--s-text-4xl)) / 1.12 var(--s-font-read);
  letter-spacing: -0.022em;
  text-wrap: balance;
}
.s-document__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1) var(--s-5);
  font: 500 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.04em;
  color: var(--s-ink-3);
}
.s-document__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-8);
}
.s-document__toc ol {
  display: grid;
  gap: var(--s-1);
  list-style: none;
}
.s-document__toc a {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  padding: var(--s-1) 0;
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
  text-decoration: none;
}
.s-document__toc a:hover {
  color: var(--s-ink);
}
.s-document__toc span,
.s-document__heading span {
  font-family: var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-copper);
}
.s-document__toc span {
  font-size: var(--s-text-xs);
  line-height: 1.6;
}
.s-document__body {
  display: grid;
  gap: var(--s-8);
  min-width: 0;
}
.s-document__section {
  display: grid;
  gap: var(--s-3);
  scroll-margin-top: 5rem;
}
.s-document__heading {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
  font: 600 var(--s-text-xl) / 1.25 var(--s-font-read);
  letter-spacing: -0.012em;
}
.s-document__heading span {
  font-size: var(--s-text-sm);
  font-weight: 500;
}
@container s-document (min-width: 52rem) {
  .s-document__layout {
    grid-template-columns: 14rem minmax(0, 1fr);
    gap: var(--s-12);
  }
  .s-document__toc {
    position: sticky;
    top: calc(var(--s-sticky-top, 0px) + 5rem);
    align-self: start;
  }
}
</style>
