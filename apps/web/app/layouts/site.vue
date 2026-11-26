<script setup lang="ts">
const { user } = useUserSession();
const rememberLanguage = useSignInLanguage();
</script>
<template>
  <UiRoot>
    <div class="site">
      <UiSiteHeader
        home="/login"
        :user="user ?? undefined"
        :links="[{ label: $t('login.how'), to: { path: '/login', hash: '#how' } }]"
        @sign-in="rememberLanguage"
      />
      <main class="site__main"><slot /></main>
      <UiFooter
        :links="[
          { label: $t('legal.terms'), to: '/terms' },
          { label: $t('legal.rules'), to: '/rules' },
          { label: $t('login.source'), href: 'https://github.com/startodel/startodel' },
        ]"
      />
    </div>
  </UiRoot>
</template>
<style scoped>
.site {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
.site__main {
  container: s-main / inline-size;
  flex: 1;
  width: 100%;
  padding-block: var(--s-10) var(--s-16);
}
</style>
