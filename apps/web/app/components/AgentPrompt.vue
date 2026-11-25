<script setup lang="ts">
const props = defineProps<{ text: string }>();
const status = ref("");
async function copy() {
  try {
    await navigator.clipboard.writeText(props.text);
    status.value = "Copied";
  } catch {
    status.value = "Select and copy the prompt above.";
  }
}
</script>
<template>
  <div class="agent-prompt">
    <p>{{ text }}</p>
    <button type="button" @click="copy">Copy prompt</button> <small role="status">{{
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
