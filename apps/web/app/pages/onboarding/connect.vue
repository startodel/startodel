<script setup lang="ts">
useHead({ title: "Connect your agent" });
</script>
<template>
  <main class="narrow">
    <h1>Connect your agent</h1>
    <p class="muted">Give your MCP client access to your Tracks and Lessons.</p>
    <div class="panel"><McpTokens connect /></div>
    <div class="actions">
      <NuxtLink class="button primary" to="/">Done</NuxtLink
      ><NuxtLink to="/">Skip for now</NuxtLink>
    </div>
  </main>
</template>
