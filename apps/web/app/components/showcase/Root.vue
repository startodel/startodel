<script setup lang="ts">
useHead({
  link: [
    { rel: "icon", type: "image/svg+xml", href: "/brand/favicon.svg" },
    { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
  ],
  meta: [{ name: "robots", content: "noindex" }],
});
</script>
<template>
  <UiRoot><slot /></UiRoot>
</template>
