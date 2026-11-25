<script setup lang="ts">
const { t } = useI18n();
const props = defineProps<{ token?: string }>();
const url = useMe().value?.mcpUrl;
const header = computed(() => "Bearer " + (props.token || "<" + t("token.placeholder") + ">"));
const config = computed(() =>
  JSON.stringify(
    { mcpServers: { startodel: { type: "http", url, headers: { Authorization: header.value } } } },
    null,
    2,
  ),
);
</script>
<template>
  <div>
    <h3>{{ $t("agent.config") }}</h3>
    <pre tabindex="0"><code>{{ config }}</code></pre>
    <h3>{{ $t("agent.transport") }}</h3>
    <pre tabindex="0"><code>{{url}}
Authorization: {{header}}</code></pre>
    <h3>{{ $t("agent.first") }}</h3>
    <pre tabindex="0"><code>{{ $t('agent.guide') }}</code></pre>
  </div>
</template>
