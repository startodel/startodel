<script setup lang="ts">
definePageMeta({ layout: "focus" });
const { t } = useI18n();
useHead({ title: t("agent.connect") });
const {
  tokens,
  listError,
  refresh,
  status,
  name,
  endpoint,
  issued,
  busy,
  message,
  createToken,
  revokeToken,
} = useMcpTokens();
const client = ref("json");
const header = computed(() => "Bearer <" + t("token.placeholder") + ">");
const config = computed(() =>
  JSON.stringify(
    {
      mcpServers: {
        startodel: { type: "http", url: endpoint, headers: { Authorization: header.value } },
      },
    },
    null,
    2,
  ),
);
const active = computed(() => tokens.value?.filter((token) => !token.revokedAt) ?? []);
// Dismissing the secret must keep the connection check on the same token.
const watchingId = ref<string>();
watch(issued, (token) => {
  if (token) watchingId.value = token.id;
});
const connected = computed(() => {
  const watching = active.value.find((token) => token.id === watchingId.value);
  return watching ? !!watching.lastUsedAt : active.value.some((token) => token.lastUsedAt);
});
let poll: ReturnType<typeof setInterval>;
onMounted(() => {
  poll = setInterval(() => {
    if (active.value.length && !connected.value && !busy.value && status.value !== "pending")
      void refresh();
  }, 5000);
});
onBeforeUnmount(() => clearInterval(poll));
</script>
<template>
  <div class="s-stack">
    <UiPageHeader :title="$t('agent.connect')" :description="$t('agent.access')" />
    <section class="s-stack">
      <UiSectionHeading :title="$t('token.title')" />
      <form class="s-form-row" @submit.prevent="createToken">
        <UiField :label="$t('token.name')"><UiInput v-model="name" required /></UiField>
        <UiButton
          type="submit"
          class="s-form-row__action"
          icon="key"
          variant="primary"
          :loading="busy"
          :disabled="!name.trim()"
          >{{ $t("token.create") }}</UiButton
        >
      </form>
      <UiNotice v-if="issued" :key="issued.id" tone="warning" :title="$t('token.once')">
        <UiCopyField :label="$t('settings.token')" :value="issued.token" secret />
        <template #actions
          ><UiButton size="sm" @click="issued = undefined">{{
            $t("token.dismiss")
          }}</UiButton></template
        >
      </UiNotice>
      <UiNotice v-if="message" tone="danger" :title="message" />
      <UiNotice v-if="listError" tone="danger" :title="$t('token.load')">
        <template #actions
          ><UiButton size="sm" @click="refresh()">{{ $t("common.retry") }}</UiButton></template
        >
      </UiNotice>
      <UiSkeletonList v-else-if="!tokens" />
      <UiTable
        v-else-if="tokens.length"
        :caption="$t('token.title')"
        :rows="tokens"
        :row-key="(row) => row.id"
        :columns="[
          { key: 'name', label: $t('token.name') },
          { key: 'prefix', label: $t('settings.prefix') },
          { key: 'action', label: '' },
        ]"
      >
        <template #cell-prefix="{ row }"><code>{{ row.prefix }}…</code></template>
        <template #cell-action="{ row }">
          <UiBadge v-if="row.revokedAt">{{ $t("token.revoked") }}</UiBadge>
          <UiButton
            v-else
            size="sm"
            variant="danger"
            :disabled="busy"
            @click="revokeToken(row.id)"
            >{{ $t("token.revoke") }}</UiButton
          >
        </template>
      </UiTable>
      <UiEmptyState v-else :title="$t('token.none')" icon="key" compact />
    </section>
    <section class="s-stack">
      <UiSectionHeading :title="$t('agent.config')" />
      <UiCopyField v-if="endpoint" :label="$t('token.endpoint')" :value="endpoint" />
      <UiTabs
        v-model="client"
        :label="$t('agent.config')"
        :tabs="[
          { id: 'json', label: $t('agent.json') },
          { id: 'http', label: $t('agent.transport') },
        ]"
      >
        <template #json
          ><UiCodeBlock language="json" :code="config" :line-numbers="false"
        /></template>
        <template #http
          ><UiCodeBlock
            language="http"
            :code="(endpoint ?? '') + '\nAuthorization: ' + header"
            :line-numbers="false"
        /></template>
      </UiTabs>
    </section>
    <UiAgentPrompt :label="$t('agent.first')" :text="$t('agent.guide')" tool="get_guide" />
    <UiNotice
      v-if="active.length && !listError"
      :tone="connected ? 'success' : 'info'"
      :icon="connected ? 'check' : 'clock'"
      :title="connected ? $t('agent.connected') : $t('agent.waiting')"
    />
    <div class="s-cluster">
      <UiButton to="/" variant="primary" icon-right="arrow-right">{{ $t("agent.done") }}</UiButton>
      <UiButton to="/" variant="ghost">{{ $t("agent.skip") }}</UiButton>
    </div>
  </div>
</template>
