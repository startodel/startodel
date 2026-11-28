<script setup lang="ts">
/**
 * One connected agent: the name and version its client reports in MCP `initialize`, how it reaches
 * Startodel and when it last did. It names the client, never a model.
 */
const props = defineProps<{
  /** Leave empty when the client did not report a name. */
  name?: string | null;
  version?: string | null;
  via: "oauth" | "token";
  /** The name of the MCP Token, when the agent connects with one. */
  tokenName?: string | null;
  status: "active" | "idle" | "unused";
  lastActiveAt?: string | null;
}>();
const { t } = useI18n();
const displayDate = useDisplayDate("short");
const word = computed(
  () =>
    ({
      active: t("connectedAgent.active"),
      idle: t("connectedAgent.idle"),
      unused: t("connectedAgent.unused"),
    })[props.status],
);
const connection = computed(() =>
  props.via === "oauth"
    ? t("connectedAgent.oauth")
    : props.tokenName
      ? t("connectedAgent.tokenNamed", { name: props.tokenName })
      : t("connectedAgent.token"),
);
</script>
<template>
  <div class="s-agent-identity" :class="'s-agent-identity--' + status">
    <div class="s-agent-identity__main">
      <p class="s-agent-identity__name">
        <bdi v-if="name">{{ name }}</bdi>
        <span v-else class="s-agent-identity__unknown">{{ t("connectedAgent.unknown") }}</span>
        <span v-if="name && version" class="s-agent-identity__version">{{ version }}</span>
      </p>
      <p class="s-agent-identity__facts">
        <span class="s-agent-identity__via"
          ><UiIcon :name="via === 'oauth' ? 'plug' : 'key'" :size="12" /><bdi>{{
            connection
          }}</bdi></span
        >
        <time v-if="lastActiveAt && status !== 'unused'" :datetime="lastActiveAt">{{
          t("connectedAgent.lastActive", { date: displayDate(lastActiveAt) })
        }}</time>
      </p>
    </div>
    <p class="s-agent-identity__status">
      <svg class="s-agent-identity__pad" viewBox="0 0 16 16" aria-hidden="true">
        <template v-if="status === 'active'">
          <circle cx="8" cy="8" r="3.5" fill="currentColor" />
          <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" stroke-width="1.5" />
        </template>
        <circle
          v-else
          cx="8"
          cy="8"
          r="5.75"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          :stroke-dasharray="status === 'unused' ? '2.2 2.3' : undefined"
        />
      </svg>
      {{ word }}
    </p>
    <div v-if="$slots.action" class="s-agent-identity__action"><slot name="action" /></div>
  </div>
</template>
<style scoped>
.s-agent-identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3) var(--s-5);
  min-width: 0;
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-surface);
}
.s-agent-identity__main {
  flex: 1 1 15rem;
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}
.s-agent-identity__name {
  font: 600 var(--s-text-md) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}
.s-agent-identity__unknown {
  font-weight: 500;
  color: var(--s-ink-2);
}
.s-agent-identity__version {
  margin-left: var(--s-2);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-3);
}
.s-agent-identity__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.125rem var(--s-4);
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
  overflow-wrap: anywhere;
}
.s-agent-identity__via {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.s-agent-identity__via .s-icon {
  color: var(--s-ink-3);
}
.s-agent-identity__status {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--s-ink-3);
}
.s-agent-identity--active .s-agent-identity__status {
  color: var(--s-copper);
}
.s-agent-identity__pad {
  flex: none;
  width: 0.75rem;
  height: 0.75rem;
}
.s-agent-identity__action {
  flex: none;
  display: flex;
  gap: var(--s-2);
  margin-left: auto;
}
</style>
