<script setup lang="ts">
import { sampleAgentFit, useSampleAgents } from "./sample-people";
const agents = useSampleAgents();
</script>
<template>
  <ShowcaseSpecimen
    id="planned-agent-identity"
    label="UiAgentIdentity"
    note="The client as it names itself in MCP initialize, how it connects and its status"
    layout="stack"
  >
    <UiAgentIdentity
      v-for="agent in agents"
      :key="agent.id"
      :name="agent.name"
      :version="agent.version"
      :via="agent.via"
      :token-name="agent.tokenName"
      :status="agent.status"
      :last-active-at="agent.lastActiveAt"
    >
      <template #action>
        <UiButton size="sm" variant="danger">{{
          agent.via === "oauth" ? $t("oauth.disconnect") : $t("token.revoke")
        }}</UiButton>
      </template>
    </UiAgentIdentity>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-agent-fit-compact"
    label="UiAgentFit · compact"
    note="For the Dashboard. The word opens the four signals"
  >
    <UiAgentFit size="compact" v-bind="sampleAgentFit.good" />
    <UiAgentFit size="compact" v-bind="sampleAgentFit.attention" />
    <UiAgentFit size="compact" v-bind="sampleAgentFit.poor" />
    <UiAgentFit size="compact" v-bind="sampleAgentFit.unknown" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-agent-fit"
    label="UiAgentFit · full"
    note="For Settings. A prompt appears when a signal is off"
    layout="block"
  >
    <UiAgentFit v-bind="sampleAgentFit.attention" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen id="planned-agent-fit-results" label="UiAgentFit · results" layout="grid">
    <UiAgentFit v-bind="sampleAgentFit.good" />
    <UiAgentFit v-bind="sampleAgentFit.poor" />
    <UiAgentFit v-bind="sampleAgentFit.unknown" />
  </ShowcaseSpecimen>
</template>
