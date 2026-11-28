<script setup lang="ts">
definePageMeta({ layout: "focus", connect: true });
const { t, n } = useI18n();
useHead({ title: t("agent.connect") });
const { tokens, refresh, status, name, endpoint, issued, busy, message, createToken } =
  useMcpTokens();
const { data: connections, refresh: refreshConnections } = await useFetch("/api/connections");
const prompt = useFirstTrackPrompt();
const connected = computed(() => {
  const app = connections.value?.[0];
  if (app) return { name: app.name };
  const token = tokens.value?.find((token) => !token.revokedAt && token.lastUsedAt);
  return token && { name: token.name };
});
async function createNamed(tokenName: string) {
  name.value = tokenName;
  await createToken();
}
// An approval happens in the agent's own window, so ask again while this page waits.
async function check() {
  if (connected.value || busy.value || document.visibilityState === "hidden") return;
  await refreshConnections();
  if (tokens.value?.some((token) => !token.revokedAt) && status.value !== "pending")
    await refresh();
}
let poll: ReturnType<typeof setInterval>;
onMounted(() => {
  poll = setInterval(check, 5000);
  window.addEventListener("focus", check);
});
onBeforeUnmount(() => {
  clearInterval(poll);
  window.removeEventListener("focus", check);
});
</script>
<template>
  <div class="s-stack" style="--s-gap: var(--s-8)">
    <UiFocusHeader
      :kicker="t('onboarding.step', { n: n(2), total: n(2) })"
      :title="t('agent.connect')"
      :lead="t('agent.access')"
    />
    <UiConnectAgent
      :endpoint="endpoint ?? ''"
      :connected="connected"
      :prompt="prompt"
      next="/dashboard"
      :issued="issued"
      :token-busy="busy"
      :token-error="message"
      @token="createNamed"
      @dismiss="issued = undefined"
    />
  </div>
</template>
