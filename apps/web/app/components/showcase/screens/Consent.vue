<script setup lang="ts">
import { sampleUser } from "../sample";
</script>
<template>
  <UiFocusLayout :user="sampleUser">
    <UiConsentPanel name="ChatGPT" host="chatgpt.com" />
    <template #footer>{{ $t("oauth.disconnectHint") }}</template>
  </UiFocusLayout>
</template>
