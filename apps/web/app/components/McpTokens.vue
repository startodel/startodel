<script setup lang="ts">
defineProps<{ connect?: boolean }>();
const { data: tokens, error: listError, refresh, status } = useFetch("/api/mcp-tokens");
const name = ref("");
const endpoint = useMe().value?.mcpUrl;
const issued = ref<{ id: string; token: string }>();
const busy = ref(false);
const message = ref("");
async function createToken() {
  busy.value = true;
  message.value = "";
  issued.value = undefined;
  try {
    issued.value = await $fetch("/api/mcp-tokens", { method: "POST", body: { name: name.value } });
    name.value = "";
    await refresh();
  } catch {
    message.value = "Could not create the token. Check the list before trying again.";
  } finally {
    busy.value = false;
  }
}

async function revokeToken(id: string) {
  busy.value = true;
  message.value = "";
  try {
    await $fetch(`/api/mcp-tokens/${id}`, { method: "DELETE" });
    if (issued.value?.id === id) issued.value = undefined;
    await refresh();
  } catch {
    message.value = "Could not revoke the token. Try again.";
  } finally {
    busy.value = false;
  }
}

async function copyToken() {
  if (!issued.value) return;
  try {
    await navigator.clipboard.writeText(issued.value.token);
    message.value = "Token copied.";
  } catch {
    message.value = "Select and copy the token manually.";
  }
}
</script>

<template>
  <section>
    <h2>MCP tokens</h2>
    <p v-if="endpoint">MCP URL: <code>{{ endpoint }}</code></p>
    <form @submit.prevent="createToken">
      <label>Token name <input v-model="name" required /></label>
      <button :disabled="busy || !name.trim()">Create token</button>
    </form>
    <div v-if="issued">
      <p>Copy this token now. You will not see it again.</p>
      <code>{{ issued.token }}</code>
      <button type="button" @click="copyToken">Copy token</button>
      <button type="button" @click="issued = undefined">Dismiss</button>
    </div>
    <AgentConfig v-if="connect" :token="issued?.token" />
    <p role="status">{{ message }}</p>
    <p v-if="listError">Could not load tokens. <button @click="refresh()">Retry</button></p>
    <ul v-else-if="!connect && tokens?.length">
      <li v-for="token in tokens" :key="token.id">
        {{ token.name }} (<code>{{ token.prefix }}…</code>)
        <span v-if="token.revokedAt">Revoked</span>
        <button v-else type="button" :disabled="busy" @click="revokeToken(token.id)">Revoke</button>
      </li>
    </ul>
    <p v-else-if="!connect && status === 'success'">No tokens yet.</p>
  </section>
</template>
