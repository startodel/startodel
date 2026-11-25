<script setup lang="ts">
import { screenPath } from "./sample";
/** The public layout with sample links, shared by the mock public screens. */
defineProps<{ signedIn?: boolean }>();
</script>
<template>
  <div class="site">
    <UiSiteHeader
      :home="screenPath('landing')"
      :sign-in="screenPath('onboarding')"
      :dashboard="screenPath('dashboard')"
      :user="signedIn ? { name: 'Alice Petrova', login: 'alice' } : undefined"
      :links="[
        { label: 'How it works', to: { path: screenPath('landing'), hash: '#how' } },
        { label: 'Public Tracks', to: screenPath('public-profile') },
        { label: 'GitHub', href: 'https://github.com/startodel/startodel' },
      ]"
    />
    <main class="site__main"><slot /></main>
    <UiFooter
      :links="[
        { label: 'Terms of Use', to: screenPath('legal') },
        { label: 'Publishing rules', to: screenPath('legal') },
        { label: 'Source', href: 'https://github.com/startodel/startodel' },
      ]"
    />
  </div>
</template>
<style scoped>
.site {
  --s-page: 72rem;
  --s-page-gutter: var(--s-5);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
.site__main {
  container: s-main / inline-size;
  flex: 1;
  width: 100%;
}
</style>
