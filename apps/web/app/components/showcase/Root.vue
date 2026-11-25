<script setup lang="ts">
import "~/assets/design/index.css";
const theme = useTheme();
useHead({
  htmlAttrs: { "data-theme": () => (theme.value === "auto" ? undefined : theme.value) },
  link: [
    { rel: "icon", type: "image/svg+xml", href: "/brand/favicon.svg" },
    { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
  ],
  meta: [{ name: "robots", content: "noindex" }],
});
</script>
<template>
  <div class="s-root"><slot /><UiToaster /></div>
</template>
