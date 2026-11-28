<script setup lang="ts">
import type { AgentClient } from "../../ui/ConnectAgent.vue";
import { sampleMcpUrl, sampleToken, screenPath } from "../sample";
const props = defineProps<{ state?: string }>();
const client = ref<AgentClient>(
  props.state === "chatgpt" ? "chatgpt" : props.state === "other" ? "other" : "claude",
);
const issued = ref(false);
const busy = ref(false);
function create() {
  busy.value = true;
  setTimeout(() => {
    issued.value = true;
    busy.value = false;
  }, 500);
}
</script>
<template>
  <UiFocusLayout :home="screenPath('landing')">
    <template #actions>
      <UiButton variant="ghost" size="sm" :to="screenPath('dashboard')">{{
        $t("agent.skip")
      }}</UiButton>
    </template>
    <div class="s-stack" style="--s-gap: var(--s-8)">
      <UiFocusHeader
        :kicker="$t('onboarding.step', { n: 2, total: 2 })"
        :title="$t('agent.connect')"
        :lead="$t('agent.access')"
      />
      <UiConnectAgent
        v-model:client="client"
        :endpoint="sampleMcpUrl"
        :connected="state === 'connected' ? { name: 'Claude' } : undefined"
        :prompt="$t('next.buildPrompt', { goals: $t('onboarding.internals') })"
        :next="screenPath('dashboard')"
        :issued="issued ? { token: sampleToken } : undefined"
        :token-busy="busy"
        @token="create"
        @dismiss="issued = false"
      />
    </div>
  </UiFocusLayout>
</template>
