<script setup lang="ts">
definePageMeta({ layout: "focus", connect: true });
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
  <div class="s-stack" style="--s-gap: var(--s-8)">
    <header class="s-stack" style="--s-gap: var(--s-3)">
      <p class="s-label">{{ $t("onboarding.title") }}</p>
      <h1 class="s-title">{{ $t("agent.connect") }}</h1>
      <p class="lead">{{ $t("agent.access") }}</p>
    </header>
    <ol class="wiring">
      <li class="wiring__step is-done">
        <span class="wiring__pad" aria-hidden="true">{{ $n(1) }}</span>
        <div class="wiring__body">
          <h2 class="wiring__title">{{ $t("token.title") }}</h2>
          <form class="token-form" @submit.prevent="createToken">
            <UiField :label="$t('token.name')"><UiInput v-model="name" required /></UiField>
            <UiButton
              type="submit"
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
        </div>
      </li>
      <li class="wiring__step" :class="{ 'is-done': active.length }">
        <span class="wiring__pad" aria-hidden="true">{{ $n(2) }}</span>
        <div class="wiring__body">
          <h2 class="wiring__title">{{ $t("agent.config") }}</h2>
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
        </div>
      </li>
      <li class="wiring__step" :class="{ 'is-done': connected }">
        <span class="wiring__pad" aria-hidden="true">{{ $n(3) }}</span>
        <div class="wiring__body">
          <h2 class="wiring__title">{{ $t("agent.first") }}</h2>
          <UiAgentPrompt :label="$t('agent.prompt')" :text="$t('agent.guide')" tool="get_guide" />
        </div>
      </li>
    </ol>
    <section class="status" :class="{ 'is-live': connected }" aria-live="polite">
      <UiBadge v-if="connected" tone="verdigris" variant="solid" icon="check">{{
        $t("agent.connected")
      }}</UiBadge>
      <UiPending v-else :label="active.length ? $t('agent.waiting') : $t('agent.begin')" />
      <p class="status__text s-muted">{{ $t("agent.poll") }}</p>
      <UiButton
        to="/dashboard"
        :variant="connected ? 'primary' : 'ghost'"
        icon-right="arrow-right"
        >{{ $t("agent.done") }}</UiButton
      >
    </section>
  </div>
</template>
<style scoped>
.lead {
  max-width: 40rem;
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.wiring {
  display: grid;
  list-style: none;
}
.wiring__step {
  position: relative;
  display: grid;
  grid-template-columns: var(--s-control-sm) minmax(0, 1fr);
  gap: var(--s-5);
  padding-bottom: var(--s-8);
}
/* The trace that joins the steps. It carries signal once a step is done. */
.wiring__step::before {
  content: "";
  position: absolute;
  top: var(--s-control-sm);
  bottom: 0;
  left: calc(var(--s-control-sm) / 2 - 1px);
  border-left: 1.5px dashed var(--s-line-strong);
}
.wiring__step.is-done::before {
  border-left: 2px solid var(--s-copper-fill);
}
.wiring__step:last-child {
  padding-bottom: 0;
}
.wiring__step:last-child::before {
  display: none;
}
.wiring__pad {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--s-control-sm);
  height: var(--s-control-sm);
  border: 1.5px solid var(--s-line-strong);
  border-radius: 50%;
  background: var(--s-bg);
  font: 600 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
.is-done > .wiring__pad {
  border-color: var(--s-copper-fill);
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
}
.wiring__body {
  display: grid;
  gap: var(--s-4);
  min-width: 0;
}
.wiring__title {
  font: 600 var(--s-text-xl) / var(--s-control-sm) var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.025em;
}
.token-form {
  display: grid;
  justify-items: start;
  gap: var(--s-4);
}
.token-form > :first-child {
  width: min(100%, 24rem);
}
.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3) var(--s-5);
  padding: var(--s-4) var(--s-5);
  border: 1px dashed var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.status.is-live {
  border: 1px solid var(--s-verdigris);
  background: var(--s-verdigris-soft);
}
.status__text {
  flex: 1 1 14rem;
}
</style>
