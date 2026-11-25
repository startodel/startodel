<script setup lang="ts">
const { t } = useI18n();
const props = defineProps<{ text: string }>();
const status = ref("");
async function copy() {
  try {
    await navigator.clipboard.writeText(props.text);
    status.value = t("common.copied");
  } catch {
    status.value = t("agent.manual");
  }
}
</script>
<template>
  <div class="agent-prompt">
    <p>{{ text }}</p>
    <button type="button" @click="copy">{{ $t("agent.copy") }}</button> <small role="status">{{
      status
    }}</small>
  </div>
</template>
<style scoped>
.agent-prompt {
  padding: 0.9rem 1rem;
  background: #f1f5ef;
  border-radius: 6px;
}
.agent-prompt p {
  margin: 0 0 0.6rem;
}
</style>
