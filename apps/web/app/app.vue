<script setup lang="ts">
import { isPublicPage } from "./utils/public-pages";
const { user, clear, fetch: fetchSession } = useUserSession();
const route = useRoute();
usePublicOrigin();
onMounted(() => {
  if (isPublicPage(route.path)) void fetchSession();
});
useHead({
  htmlAttrs: { lang: "en" },
  titleTemplate: (title) => (title ? title + " · Startodel" : "Startodel"),
});
async function logout() {
  await clear();
  clearNuxtData();
  await navigateTo("/login");
}
</script>
<template>
  <header class="mast">
    <div class="bar">
      <NuxtLink class="brand" to="/"
        ><span aria-hidden="true" class="brand-mark">S</span>Startodel</NuxtLink
      >
      <nav v-if="user && route.path !== '/login'" aria-label="Main navigation">
        <NuxtLink to="/">Dashboard</NuxtLink><NuxtLink to="/grills">Grills</NuxtLink
        ><NuxtLink to="/reviews">Reviews</NuxtLink><NuxtLink to="/progress">Progress</NuxtLink
        ><NuxtLink to="/settings">Settings</NuxtLink>
        <span class="identity"
          ><img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" width="28" height="28" />{{
            user.name || user.login
          }}</span
        >
        <button class="quiet" @click="logout">Log out</button>
      </nav>
    </div>
  </header>
  <NuxtPage :page-key="route.path" />
  <footer class="bar">
    <nav aria-label="Legal">
      <NuxtLink to="/terms">Terms</NuxtLink><NuxtLink to="/rules">Publishing rules</NuxtLink>
    </nav>
  </footer>
</template>
<style>
:root {
  font-family: "Inter", system-ui, sans-serif;
  background: #f7f8f4;
  color: #192e29;
  font-size: 16px;
  line-height: 1.55;
  --ink: #192e29;
  --muted: #50665d;
  --green: #17624f;
  --line: #cbd6cd;
  --paper: #fff;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
.mast {
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.bar,
main {
  width: min(1080px, calc(100% - 3rem));
  margin: auto;
}
.bar,
nav,
.actions,
.identity {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.bar {
  justify-content: space-between;
  min-height: 4.2rem;
  padding: 0.75rem 0;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--ink);
  font-weight: 750;
  font-size: 1.25rem;
  letter-spacing: -0.05em;
}
.brand-mark {
  border-radius: 6px;
  background: var(--green);
  color: #fff;
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  font:
    italic bold 1.35rem Georgia,
    serif;
}
nav {
  font-size: 0.92rem;
}
nav a {
  color: var(--muted);
  text-decoration: none;
}
nav .router-link-exact-active {
  color: var(--green);
  text-decoration: underline;
  text-underline-offset: 0.35rem;
}
.identity {
  gap: 0.45rem;
}
.identity img {
  border-radius: 50%;
}
main {
  padding: 3.5rem 0 5rem;
}
.narrow {
  max-width: 750px;
}
h1,
h2,
h3,
p {
  overflow-wrap: anywhere;
}
h1,
h2 {
  font-family: "Source Serif 4", "Georgia", serif;
  font-weight: 500;
  line-height: 1.15;
}
h1 {
  font-size: clamp(2.3rem, 5vw, 3.6rem);
  letter-spacing: -0.045em;
  margin: 0 0 1rem;
}
h2 {
  font-size: 1.65rem;
  margin: 1.6rem 0 0.8rem;
}
h3 {
  font-size: 1.08rem;
}
p {
  margin: 0.6rem 0 1rem;
}
a {
  color: var(--green);
  text-underline-offset: 0.18em;
}
button,
.button,
input {
  font: inherit;
}
.button,
button {
  display: inline-block;
  cursor: pointer;
  background: white;
  color: var(--green);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.45rem 0.85rem;
  text-decoration: none;
  font-weight: 600;
}
.primary {
  background: var(--green);
  color: white;
  border-color: var(--green);
}
button:hover,
.button:hover {
  filter: brightness(0.95);
}
button:disabled {
  cursor: default;
  opacity: 0.55;
}
.quiet {
  background: transparent;
  border: 0;
  padding: 0.25rem;
}
.panel {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: clamp(1rem, 3vw, 1.8rem);
  margin: 1rem 0;
  min-width: 0;
}
.panel > :first-child {
  margin-top: 0;
}
.muted,
small {
  color: var(--muted);
}
pre {
  padding: 1rem;
  overflow: auto;
  white-space: pre;
  border-radius: 6px;
  background: #eff4ee;
}
code {
  overflow-wrap: anywhere;
}
input:not([type="radio"], [type="checkbox"]) {
  border: 1px solid #939f96;
  border-radius: 5px;
  padding: 0.5rem;
  background: white;
  max-width: 100%;
}
input {
  accent-color: var(--green);
}
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
legend {
  font-weight: 650;
  margin-bottom: 0.7rem;
}
details > summary {
  cursor: pointer;
  color: var(--green);
  font-weight: 600;
}
progress {
  accent-color: var(--green);
  height: 0.7rem;
  width: 100%;
}
:focus-visible {
  outline: 3px solid #247ca4;
  outline-offset: 3px;
}
.actions {
  margin: 1rem 0;
}
.choices {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.choice {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.4rem 0.65rem;
  cursor: pointer;
  background: white;
}
.choice:has(input:checked) {
  border-color: var(--green);
  background: #e7f1ea;
}
.choice input {
  margin-right: 0.45rem;
}
@media (max-width: 600px) {
  .bar,
  main {
    width: calc(100% - 2rem);
  }
  main {
    padding-top: 2rem;
  }
  nav {
    gap: 0.6rem;
  }
  .identity {
    display: none;
  }
}
</style>
