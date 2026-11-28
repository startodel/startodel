<script setup lang="ts">
defineProps<{ href?: string }>();
const rememberLanguage = useSignInLanguage();
</script>
<template>
  <UiButton
    :href="href || '/auth/github'"
    target="_self"
    icon="github"
    size="lg"
    @click="rememberLanguage"
    >{{ $t("login.signIn") }}</UiButton
  >
</template>
