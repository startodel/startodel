<template>
  <UiFocusLayout>
    <template #actions
      ><UiAvatar name="Bob" :size="24" /><span>bob</span
      ><UiButton size="sm" variant="ghost" icon="logout">{{ $t("nav.logout") }}</UiButton></template
    >
    <UiConsentPanel name="ChatGPT" host="chatgpt.com" />
    <template #footer>{{ $t("oauth.disconnectHint") }}</template>
  </UiFocusLayout>
</template>
