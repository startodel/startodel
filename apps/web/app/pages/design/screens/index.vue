<script setup lang="ts">
import { screens } from "../../../components/showcase/screens";
definePageMeta({ middleware: "design" });
useHead({ title: "Design screens" });
const groups = ["Public", "Getting started", "Learning", "Account"] as const;
const sections = groups.map((g) => ({ id: g.toLowerCase().replace(" ", "-"), title: g }));
</script>
<template>
  <ShowcaseDocs :sections="sections">
    <header class="intro">
      <p class="s-label intro__kicker">Startodel design system · Screens</p>
      <h1 class="s-title intro__title">Screens</h1>
      <p class="intro__lead">
        Every page of the product as a full-size mock, built only from the components and sample
        data. Nothing here reads or writes learner data. Each screen opens on its own so that it
        responds to the real window: narrow the window to see the mobile layout.
      </p>
    </header>
    <ShowcaseSection
      v-for="(g, i) in groups"
      :id="sections[i]!.id"
      :key="g"
      :title="g"
      :index="i + 1"
    >
      <ul class="cards">
        <li v-for="s in screens.filter((s) => s.group === g)" :key="s.id" class="card">
          <p class="s-label card__route">{{ s.route }}</p>
          <h3 class="card__title">
            <NuxtLinkLocale :to="'/design/screens/' + s.id" class="card__link">{{
              s.title
            }}</NuxtLinkLocale>
          </h3>
          <p class="card__note">{{ s.note }}</p>
          <ul v-if="s.states" class="card__states" :aria-label="s.title + ' states'">
            <li v-for="state in s.states" :key="state.id">
              <NuxtLinkLocale
                :to="{ path: '/design/screens/' + s.id, query: { state: state.id } }"
                >{{ state.label }}</NuxtLinkLocale
              >
            </li>
          </ul>
        </li>
      </ul>
    </ShowcaseSection>
  </ShowcaseDocs>
</template>
<style scoped>
.intro {
  display: grid;
  gap: var(--s-3);
  margin-bottom: var(--s-12);
}
.intro__kicker {
  color: var(--s-copper);
}
.intro__lead {
  max-width: 44rem;
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: var(--s-4);
  list-style: none;
}
.card {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--s-2);
  padding: var(--s-4) var(--s-5) var(--s-5);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease);
}
.card:hover {
  border-color: var(--s-ink);
  box-shadow: var(--s-shadow-2);
}
.card__route {
  text-transform: none;
  letter-spacing: 0.02em;
}
.card__title {
  font: 600 var(--s-text-xl) / 1.2 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.025em;
}
.card__link {
  color: var(--s-ink);
  text-decoration: none;
}
.card__link::after {
  content: "";
  position: absolute;
  inset: 0;
}
.card__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.card__states {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1);
  margin-top: var(--s-2);
  list-style: none;
}
.card__states a {
  display: block;
  padding: 0.125rem var(--s-2);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-2);
  font-size: var(--s-text-xs);
  font-weight: 500;
  text-decoration: none;
}
.card__states a:hover {
  border-color: var(--s-ink);
  color: var(--s-ink);
}
</style>
