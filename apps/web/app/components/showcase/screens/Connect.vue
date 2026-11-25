<script setup lang="ts">
import { sampleConfig, sampleFirstPrompt, sampleMcpUrl, sampleToken, screenPath } from "../sample";
const props = defineProps<{ state?: string }>();
const name = ref("Laptop · editor agent");
const issued = ref(props.state === "waiting" || props.state === "connected");
const busy = ref(false);
function create() {
  busy.value = true;
  setTimeout(() => {
    issued.value = true;
    busy.value = false;
  }, 500);
}
const client = ref("json");
const clients = [
  { id: "json", label: "JSON config" },
  { id: "http", label: "Streamable HTTP" },
];
const http = `${sampleMcpUrl}\nAuthorization: Bearer ${sampleToken}`;
</script>
<template>
  <UiFocusLayout :home="screenPath('landing')" width="md">
    <template #actions>
      <UiButton variant="ghost" size="sm" :to="screenPath('dashboard')">Skip for now</UiButton>
    </template>
    <div class="s-stack" style="--s-gap: var(--s-8)">
      <header class="s-stack" style="--s-gap: var(--s-3)">
        <p class="s-label">Connect an agent</p>
        <h1 class="s-title">Plug in the agent you already use.</h1>
        <p class="lead">
          Startodel has no model of its own. Your agent reads and writes your learning data through
          MCP, with a token that you can revoke at any time.
        </p>
      </header>

      <ol class="wiring">
        <li class="wiring__step is-done">
          <span class="wiring__pad" aria-hidden="true">1</span>
          <div class="wiring__body">
            <h2 class="wiring__title">Create an MCP Token</h2>
            <form v-if="!issued" class="token-form" @submit.prevent="create">
              <UiField
                label="Token name"
                for="token-name"
                hint="Name it after the machine or the agent."
              >
                <UiInput id="token-name" v-model="name" required />
              </UiField>
              <UiButton
                type="submit"
                variant="primary"
                icon="key"
                :loading="busy"
                :disabled="!name.trim()"
                >Create token</UiButton
              >
            </form>
            <template v-else>
              <UiCopyField label="MCP Token" :value="sampleToken" secret />
              <UiNotice tone="warning" title="Copy it now">
                The token is shown once. If you lose it, revoke it in Settings and create another.
              </UiNotice>
            </template>
          </div>
        </li>
        <li class="wiring__step" :class="{ 'is-done': issued }">
          <span class="wiring__pad" aria-hidden="true">2</span>
          <div class="wiring__body">
            <h2 class="wiring__title">Add the server to your agent</h2>
            <UiCopyField label="MCP URL" :value="sampleMcpUrl" />
            <UiTabs v-model="client" label="Client configuration" :tabs="clients">
              <template #json>
                <UiCodeBlock
                  :code="sampleConfig"
                  language="json"
                  title="mcp.json"
                  :line-numbers="false"
                />
              </template>
              <template #http>
                <UiCodeBlock
                  :code="http"
                  language="http"
                  title="Any MCP client"
                  :line-numbers="false"
                />
              </template>
            </UiTabs>
          </div>
        </li>
        <li class="wiring__step" :class="{ 'is-done': state === 'connected' }">
          <span class="wiring__pad" aria-hidden="true">3</span>
          <div class="wiring__body">
            <h2 class="wiring__title">Send the first prompt</h2>
            <UiAgentPrompt :text="sampleFirstPrompt" tool="get_guide" label="First prompt" />
            <p class="s-muted">
              The agent reads the guide, sees that you have no Track yet and offers to build one.
            </p>
          </div>
        </li>
      </ol>

      <section class="status" :class="{ 'is-live': state === 'connected' }" aria-live="polite">
        <template v-if="state === 'connected'">
          <UiBadge tone="verdigris" variant="solid" icon="check">Connected</UiBadge>
          <p class="status__text">
            <strong>Your agent called <code class="s-mono">get_guide</code> a moment ago.</strong>
            It is planning your first Track.
          </p>
          <UiButton variant="primary" :to="screenPath('dashboard')" icon-right="arrow-right"
            >Open the dashboard</UiButton
          >
        </template>
        <template v-else>
          <UiPending
            :label="
              issued ? 'Waiting for the first call from your agent' : 'Create a token to begin'
            "
          />
          <p class="status__text s-muted">This page updates when the token is first used.</p>
          <UiButton :to="screenPath('dashboard')" variant="ghost"
            >Continue without waiting</UiButton
          >
        </template>
      </section>
    </div>
  </UiFocusLayout>
</template>
<style scoped>
.lead {
  max-width: 40rem;
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.wiring {
  display: grid;
  list-style: none;
}
.wiring__step {
  position: relative;
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr);
  gap: var(--s-5);
  padding-bottom: var(--s-8);
}
/* The trace that joins the steps. It carries signal once a step is done. */
.wiring__step::before {
  content: "";
  position: absolute;
  top: 1.75rem;
  bottom: 0;
  left: calc(0.875rem - 1px);
  border-left: 1.5px dashed var(--s-line-strong);
}
.wiring__step.is-done::before {
  border-left: 2px solid var(--s-copper-fill);
}
.wiring__step:last-child {
  padding-bottom: 0;
}
.wiring__step:last-child::before {
  display: none;
}
.wiring__pad {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1.5px solid var(--s-line-strong);
  border-radius: 50%;
  background: var(--s-bg);
  font: 600 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
.is-done > .wiring__pad {
  border-color: var(--s-copper-fill);
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
}
.wiring__body {
  display: grid;
  gap: var(--s-4);
  min-width: 0;
}
.wiring__title {
  font: 600 var(--s-text-xl) / 1.75rem var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.025em;
}
.token-form {
  display: grid;
  justify-items: start;
  gap: var(--s-4);
}
.token-form > :first-child {
  width: min(100%, 24rem);
}
.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3) var(--s-5);
  padding: var(--s-4) var(--s-5);
  border: 1px dashed var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.status.is-live {
  border: 1px solid var(--s-verdigris);
  background: var(--s-verdigris-soft);
}
.status__text {
  flex: 1 1 14rem;
}
</style>
