<script setup lang="ts">
import type { LinkTarget } from "./nav";
export type AgentClient = "claude" | "chatgpt" | "other";
/**
 * Connecting an external agent by URL. The learner picks the client they use, pastes the MCP URL
 * there and allows access on the consent page. A personal MCP Token is the way in for an agent
 * that cannot open a browser to sign in.
 */
const props = defineProps<{
  /** The MCP URL to paste into the agent. */
  endpoint: string;
  /** Set once an app or a token of this Owner has connected. */
  connected?: { name: string | null };
  /** What to send to the agent once it is connected. */
  prompt: string;
  /** Where the learner goes next. */
  next: LinkTarget;
  /** The personal MCP Token, shown once after it is issued. */
  issued?: { token: string };
  tokenBusy?: boolean;
  tokenError?: string;
}>();
const emit = defineEmits<{ token: [name: string]; dismiss: [] }>();
const client = defineModel<AgentClient>("client", { default: "claude" });
const { t } = useI18n();
const copied = ref(false);
const sample = ref("code");
const tokenName = ref(t("agent.tokenName"));
const clients = computed(() => [
  { value: "claude" as const, label: "Claude", hint: t("agent.claudeHint") },
  { value: "chatgpt" as const, label: "ChatGPT", hint: t("agent.chatgptHint") },
  { value: "other" as const, label: t("agent.other"), hint: t("agent.otherHint") },
]);
const links = {
  claude: "https://claude.ai/customize/connectors",
  chatgpt: "https://chatgpt.com/plugins",
};
const config = (headers?: Record<string, string>) =>
  JSON.stringify(
    {
      mcpServers: { startodel: { type: "http", url: props.endpoint, ...(headers && { headers }) } },
    },
    null,
    2,
  );
const command = computed(() => "claude mcp add --transport http startodel " + props.endpoint);
const tokenConfig = computed(() =>
  config({ Authorization: "Bearer <" + t("token.placeholder") + ">" }),
);
</script>
<template>
  <div class="s-connect">
    <section v-if="connected" class="s-connect__done" aria-live="polite">
      <p class="s-connect__state">
        <UiBadge tone="verdigris" variant="solid" icon="check">{{ t("agent.connected") }}</UiBadge>
        <bdi v-if="connected.name" class="s-connect__name">{{ connected.name }}</bdi>
      </p>
      <p class="s-connect__text">{{ t("agent.ask") }}</p>
      <UiAgentPrompt :text="prompt" tool="get_guide" />
      <div>
        <UiButton variant="primary" size="lg" :to="next" icon-right="arrow-right">{{
          t("agent.done")
        }}</UiButton>
      </div>
    </section>
    <template v-else>
      <UiRadioGroup
        v-model="client"
        :label="t('agent.choose')"
        name="agent-client"
        variant="cards"
        :options="clients"
      />
      <UiSteps :label="t('agent.steps')">
        <UiStep :title="t('agent.copyUrl')" :done="copied">
          <UiCopyField :label="t('agent.url')" :value="endpoint" @copied="copied = true" />
        </UiStep>
        <template v-if="client === 'claude'">
          <UiStep :title="t('agent.claudeAdd')">
            <div>
              <UiButton size="sm" :href="links.claude" icon-right="external">{{
                t("agent.openClaude")
              }}</UiButton>
            </div>
          </UiStep>
          <UiStep :title="t('agent.claudeAllow')" />
        </template>
        <template v-else-if="client === 'chatgpt'">
          <UiStep :title="t('agent.chatgptAdd')">
            <div>
              <UiButton size="sm" :href="links.chatgpt" icon-right="external">{{
                t("agent.openChatgpt")
              }}</UiButton>
            </div>
          </UiStep>
          <UiStep :title="t('agent.chatgptAllow')" />
        </template>
        <template v-else>
          <UiStep :title="t('agent.otherAdd')">
            <UiTabs
              v-model="sample"
              :label="t('agent.config')"
              :tabs="[
                { id: 'code', label: 'Claude Code' },
                { id: 'json', label: t('agent.json') },
              ]"
            >
              <template #code
                ><UiCodeBlock language="bash" :code="command" :line-numbers="false"
              /></template>
              <template #json
                ><UiCodeBlock language="json" :code="config()" :line-numbers="false"
              /></template>
            </UiTabs>
          </UiStep>
          <UiStep :title="t('agent.otherAllow')" />
        </template>
      </UiSteps>
      <UiNotice v-if="client === 'chatgpt'" :title="t('agent.chatgptNote')" />
      <UiCollapsible v-if="client === 'other'" :title="t('agent.tokenTitle')" icon="key">
        <div class="s-connect__token">
          <p class="s-connect__text">{{ t("agent.tokenText") }}</p>
          <UiNotice v-if="issued" tone="warning" :title="t('token.once')">
            <UiCopyField :label="t('settings.token')" :value="issued.token" secret />
            <template #actions
              ><UiButton size="sm" @click="emit('dismiss')">{{
                t("token.dismiss")
              }}</UiButton></template
            >
          </UiNotice>
          <form v-else class="s-form-row" @submit.prevent="emit('token', tokenName)">
            <UiField :label="t('token.name')"><UiInput v-model="tokenName" required /></UiField>
            <UiButton
              class="s-form-row__action"
              type="submit"
              icon="key"
              :loading="tokenBusy"
              :disabled="!tokenName.trim()"
              >{{ t("token.create") }}</UiButton
            >
          </form>
          <UiNotice v-if="tokenError" tone="danger" :title="tokenError" />
          <UiCodeBlock language="json" :code="tokenConfig" :line-numbers="false" />
        </div>
      </UiCollapsible>
      <p class="s-connect__wait" role="status">
        <UiPending /><span>{{ t("agent.waiting") }}</span>
      </p>
    </template>
  </div>
</template>
<style scoped>
.s-connect,
.s-connect__done,
.s-connect__token {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-6);
}
.s-connect__done,
.s-connect__token {
  gap: var(--s-4);
}
.s-connect__state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3);
}
.s-connect__name {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.s-connect__text {
  color: var(--s-ink-2);
  text-wrap: pretty;
}
.s-connect__wait {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding-top: var(--s-5);
  border-top: 1px solid var(--s-line);
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
</style>
