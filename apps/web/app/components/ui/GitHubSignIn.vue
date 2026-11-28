<script setup lang="ts">
/** The only filled control on the page when GitHub is the only Sign-in Method on offer. */
defineProps<{ href?: string; primary?: boolean }>();
const rememberLanguage = useSignInLanguage();
</script>
<template>
  <UiButton
    :href="href || '/auth/github'"
    target="_self"
    icon="github"
    size="lg"
    :variant="primary ? 'primary' : 'secondary'"
    @click="rememberLanguage"
    >{{ $t("login.signIn") }}</UiButton
  >
</template>
