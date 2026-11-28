<script setup lang="ts">
import { trackAccessIcon, type TrackAccess } from "./access";
/** How a Track is shared, as a shape and a word. */
defineProps<{ access: TrackAccess }>();
const { t } = useI18n();
const words = computed<Record<TrackAccess, string>>(() => ({
  private: t("access.private"),
  public: t("access.public"),
  gated: t("access.gated"),
}));
</script>
<template>
  <UiBadge variant="outline" :icon="trackAccessIcon[access]">{{ words[access] }}</UiBadge>
</template>
