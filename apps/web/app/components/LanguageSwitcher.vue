<script setup lang="ts">
import { languageCookie } from "../../shared/locale";
const switchPath = useSwitchLocalePath();
const preference = useCookie(languageCookie, { sameSite: "lax", maxAge: 31536000, path: "/" });
</script>
<template>
  <nav :aria-label="$t('nav.language')">
    <NuxtLink
      v-for="lang in ['ru', 'en'] as const"
      :key="lang"
      :to="switchPath(lang)"
      :lang="lang"
      :hreflang="lang"
      @click="preference = lang"
      >{{ lang.toUpperCase() }}</NuxtLink
    >
  </nav>
</template>
