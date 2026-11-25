<script setup lang="ts">
const props = defineProps<{ token?: string }>();
const url = useMe().value?.mcpUrl;
const header = computed(() => "Bearer " + (props.token || "<your-token>"));
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
    <h3>Client configuration</h3>
    <pre tabindex="0"><code>{{ config }}</code></pre>
    <h3>Streamable HTTP</h3>
    <pre tabindex="0"><code>{{url}}
Authorization: {{header}}</code></pre>
    <h3>First prompt</h3>
    <pre tabindex="0"><code>Call get_guide and follow it.</code></pre>
  </div>
</template>
