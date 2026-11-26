<script setup lang="ts">
const { t } = useI18n();
defineProps<{ connect?: boolean }>();
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
async function copyToken() {
  if (!issued.value) return;
  try {
    await navigator.clipboard.writeText(issued.value.token);
    message.value = t("token.copied");
  } catch {
    message.value = t("token.manual");
  }
}
</script>

<template>
  <section>
    <h2>{{ $t("token.title") }}</h2>
    <p v-if="endpoint">{{ $t("token.endpoint") }} <code>{{ endpoint }}</code></p>
    <form @submit.prevent="createToken">
      <label>{{ $t("token.name") }} <input v-model="name" required /></label>
      <button :disabled="busy || !name.trim()">{{ $t("token.create") }}</button>
    </form>
    <div v-if="issued">
      <p>{{ $t("token.once") }}</p>
      <code>{{ issued.token }}</code>
      <button type="button" @click="copyToken">{{ $t("token.copy") }}</button>
      <button type="button" @click="issued = undefined">{{ $t("token.dismiss") }}</button>
    </div>
    <AgentConfig v-if="connect" :token="issued?.token" />
    <p role="status">{{ message }}</p>
    <p v-if="listError">
      {{ $t("token.load") }} <button @click="refresh()">{{ $t("common.retry") }}</button>
    </p>
    <ul v-else-if="!connect && tokens?.length">
      <li v-for="token in tokens" :key="token.id">
        {{ token.name }} (<code>{{ token.prefix }}…</code>)
        <span v-if="token.revokedAt">{{ $t("token.revoked") }}</span>
        <button v-else type="button" :disabled="busy" @click="revokeToken(token.id)">
          {{ $t("token.revoke") }}
        </button>
      </li>
    </ul>
    <p v-else-if="!connect && status === 'success'">{{ $t("token.none") }}</p>
  </section>
</template>
