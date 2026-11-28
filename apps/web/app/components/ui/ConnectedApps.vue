<script setup lang="ts">
import type { LinkTarget } from "./nav";
withDefaults(
  defineProps<{
    connections: {
      id: string;
      name: string | null;
      host: string;
      createdAt: string;
      lastUsedAt: string;
    }[];
    busy?: boolean;
    /** Where an Owner with no Connection goes to make one. */
    connectTo?: LinkTarget;
  }>(),
  { connectTo: "/onboarding/connect" },
);
defineEmits<{ disconnect: [id: string] }>();
const date = useDisplayDate();
</script>
<template>
  <ul v-if="connections.length" class="s-connections">
    <li v-for="item in connections" :key="item.id" class="s-connections__row">
      <div>
        <strong><bdi>{{ item.name ?? $t("oauth.unnamed") }}</bdi></strong>
        <p class="s-mono"><bdi>{{ item.host }}</bdi></p>
        <p class="s-connections__dates">
          {{ $t("oauth.connectedOn", { date: date(item.createdAt) }) }} ·
          {{ $t("oauth.usedOn", { date: date(item.lastUsedAt) }) }}
        </p>
      </div>
      <UiButton size="sm" variant="danger" :disabled="busy" @click="$emit('disconnect', item.id)">{{
        $t("oauth.disconnect")
      }}</UiButton>
    </li>
  </ul>
  <UiEmptyState v-else :title="$t('oauth.empty')" icon="plug" compact>
    <template #actions
      ><UiButton size="sm" icon="plug" :to="connectTo">{{
        $t("dashboard.connect")
      }}</UiButton></template
    >
  </UiEmptyState>
</template>
<style scoped>
.s-connections {
  display: grid;
  gap: var(--s-3);
  list-style: none;
}
.s-connections__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--s-3);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  padding: var(--s-4);
  background: var(--s-surface);
  overflow-wrap: anywhere;
}
.s-connections__row > div {
  min-width: 0;
}
.s-connections__dates {
  margin-top: var(--s-2);
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
</style>
