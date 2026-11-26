export function useMcpTokens() {
  const { t } = useI18n();
  const { data: tokens, error: listError, refresh, status } = useFetch("/api/mcp-tokens");
  const name = ref("");
  const endpoint = useMe().value?.mcpUrl;
  const issued = ref<{ id: string; token: string }>();
  const busy = ref(false);
  const message = ref("");
  async function createToken() {
    if (busy.value || !name.value.trim()) return;
    busy.value = true;
    message.value = "";
    issued.value = undefined;
    try {
      issued.value = await $fetch("/api/mcp-tokens", {
        method: "POST",
        body: { name: name.value },
      });
      name.value = "";
      await refresh();
    } catch {
      message.value = t("token.createError");
    } finally {
      busy.value = false;
    }
  }

  async function revokeToken(id: string) {
    if (busy.value) return;
    busy.value = true;
    message.value = "";
    try {
      await $fetch(`/api/mcp-tokens/${id}`, { method: "DELETE" });
      if (issued.value?.id === id) issued.value = undefined;
      await refresh();
    } catch {
      message.value = t("token.revokeError");
    } finally {
      busy.value = false;
    }
  }

  return {
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
  };
}
