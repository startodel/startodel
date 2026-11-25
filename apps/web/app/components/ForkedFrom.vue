<script setup lang="ts">
import type { ForkedFrom } from "@startodel/core";
defineProps<{ from: ForkedFrom }>();
</script>
<template>
  <p class="muted">
    {{ $t("public.from") }}
    <NuxtLinkLocale
      v-if="from.source"
      :to="'/u/' + encodeURIComponent(from.source.login) + '/' + from.source.slug"
      >@{{ from.login }}/{{ from.slug }}</NuxtLinkLocale
    ><span v-else>@{{ from.login }}/{{ from.slug }}</span>
  </p>
</template>
