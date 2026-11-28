<script setup lang="ts">
import type { PublicProfilePatch } from "@startodel/core";
import type { ProfileSettings } from "../../ui/PublicProfileSettings.vue";
import { specimenEmailActions } from "../signin";
import { specimenSettings } from "../public-profile";
import type { TableColumn } from "../../ui/Table.vue";
import {
  sampleGrades,
  sampleMcpUrl,
  sampleProfile,
  sampleToken,
  sampleTokens,
  screenPath,
} from "../sample";
const sampleConnections = ref([
  {
    id: "sample",
    name: "ChatGPT",
    host: "chatgpt.com",
    createdAt: "2026-11-20",
    lastUsedAt: "2026-11-28",
  },
]);
const props = defineProps<{ state?: string }>();
type Token = (typeof sampleTokens)[number];
const columns: TableColumn<Token>[] = [
  { key: "name", label: "Name" },
  { key: "prefix", label: "Token" },
  { key: "created", label: "Created" },
  { key: "lastUsed", label: "Last used" },
  { key: "actions", label: "", align: "right" },
];
const publicSettings = ref<ProfileSettings>(specimenSettings);
async function saveProfile({ pinnedTrackIds, ...patch }: PublicProfilePatch) {
  publicSettings.value = {
    ...publicSettings.value,
    ...patch,
    tracks: publicSettings.value.tracks.map((track) => {
      if (!pinnedTrackIds) return track;
      const i = pinnedTrackIds.indexOf(track.id);
      return { ...track, pinOrder: i === -1 ? null : i + 1 };
    }),
  };
}
const name = ref("");
const tried = ref(false);
const revoking = ref<Token | undefined>(props.state === "revoke" ? sampleTokens[1] : undefined);
const grade = ref(sampleProfile.grade);
const digest = ref(true);
const { push: notify } = useToast();
function revoke() {
  notify({ tone: "success", title: "Token revoked", text: revoking.value?.name });
  revoking.value = undefined;
}
</script>
<template>
  <ShowcaseApp current="settings" :crumbs="[{ label: 'Settings' }]">
    <div class="settings">
      <UiPageHeader
        title="Settings"
        description="Your Profile, the agents that can act for you, and how Startodel looks."
      />

      <section id="connected-apps" class="group">
        <header class="group__head">
          <h2 class="group__title">{{ $t("oauth.connections") }}</h2>
          <p class="group__text">{{ $t("oauth.appsHint") }}</p>
        </header>
        <div class="group__body">
          <UiConnectedApps :connections="sampleConnections" @disconnect="sampleConnections = []" />
        </div>
      </section>
      <section class="group" id="sign-in-settings">
        <header class="group__head">
          <h2 class="group__title">{{ $t("signin.methods") }}</h2>
        </header>
        <div class="group__body">
          <UiSignInMethods
            specimen
            :methods="{ email: 'learner@example.org', github: null }"
            :actions="specimenEmailActions"
          />
        </div>
      </section>
      <section class="group" aria-labelledby="set-tokens">
        <header class="group__head">
          <h2 id="set-tokens" class="group__title">MCP Tokens</h2>
          <p class="group__text">
            A token lets one agent read and write your learning data. Create one per machine, so you
            can revoke it without touching the others.
          </p>
        </header>
        <div class="group__body">
          <UiNotice v-if="state === 'created'" tone="success" title="Token created">
            <div class="s-stack" style="--s-gap: var(--s-3)">
              <p>Copy it now. It is shown once.</p>
              <UiCopyField label="MCP Token" :value="sampleToken" secret />
            </div>
            <template #actions>
              <UiButton size="sm" :to="screenPath('connect')" icon="plug"
                >Connection details</UiButton
              >
            </template>
          </UiNotice>

          <form class="create" novalidate @submit.prevent="tried = true">
            <UiField
              class="create__field"
              label="New token name"
              for="set-token-name"
              :error="tried && !name.trim() ? 'Give the token a name' : undefined"
              hint="For example: laptop, editor agent."
            >
              <UiInput id="set-token-name" v-model="name" :invalid="tried && !name.trim()" />
            </UiField>
            <UiButton type="submit" icon="key">Create token</UiButton>
          </form>

          <UiTable
            caption="MCP Tokens"
            :columns="columns"
            :rows="sampleTokens"
            :row-key="(t) => t.id"
          >
            <template #cell-name="{ row }">
              <strong :class="{ 's-muted': !row.active }">{{ row.name }}</strong>
            </template>
            <template #cell-prefix="{ row }"
              ><code class="s-mono">{{ row.prefix }}…</code></template
            >
            <template #cell-lastUsed="{ row }">
              <span :class="{ 's-muted': row.lastUsed === 'Never' }">{{ row.lastUsed }}</span>
            </template>
            <template #cell-actions="{ row }">
              <UiButton v-if="row.active" size="sm" variant="danger" @click="revoking = row"
                >Revoke</UiButton
              >
              <UiBadge v-else>Revoked</UiBadge>
            </template>
          </UiTable>
          <UiCopyField label="MCP URL" :value="sampleMcpUrl" />
        </div>
      </section>

      <section class="group" aria-labelledby="set-profile">
        <header class="group__head">
          <h2 id="set-profile" class="group__title">Profile</h2>
          <p class="group__text">
            Your agent reads this to plan Tracks and to pitch Lessons at the right depth.
          </p>
        </header>
        <div class="group__body">
          <div class="who">
            <UiAvatar :name="sampleProfile.name" :size="48" />
            <div>
              <p class="who__name">{{ sampleProfile.name }}</p>
              <p class="s-muted">@{{ sampleProfile.login }} · signed in with GitHub</p>
            </div>
          </div>
          <UiField label="Stack">
            <div class="s-cluster" style="--s-gap: var(--s-2)">
              <UiChip v-for="s in sampleProfile.stack" :key="s" removable>{{ s }}</UiChip>
            </div>
          </UiField>
          <UiField label="Grade" for="set-grade">
            <UiSelect
              id="set-grade"
              v-model="grade"
              :options="sampleGrades.map((g) => ({ value: g.value, label: g.label }))"
              style="max-width: 14rem"
            />
          </UiField>
          <div>
            <UiButton :to="screenPath('onboarding')" icon="user">Edit the questionnaire</UiButton>
          </div>
        </div>
      </section>

      <section class="group">
        <header class="group__head">
          <h2 class="group__title">{{ $t("publicProfile.settings") }}</h2>
          <p class="group__text">{{ $t("publicProfile.settingsHint") }}</p>
        </header>
        <UiPublicProfileSettings
          :settings="publicSettings"
          :save="saveProfile"
          :profile-to="screenPath('public-profile')"
        />
      </section>
      <section class="group" aria-labelledby="set-look">
        <header class="group__head">
          <h2 id="set-look" class="group__title">Interface</h2>
          <p class="group__text">Stored in this browser.</p>
        </header>
        <div class="group__body">
          <div class="row"><span>Theme</span><UiThemeToggle /></div>
          <div class="row"><span>Language</span><UiLanguageSwitcher variant="inline" /></div>
          <div class="row">
            <UiSwitch v-model="digest">Animate current on the Track board</UiSwitch>
          </div>
        </div>
      </section>

      <section class="group group--danger" aria-labelledby="set-session">
        <header class="group__head">
          <h2 id="set-session" class="group__title">Session</h2>
        </header>
        <div class="group__body">
          <div><UiButton icon="logout" :to="screenPath('landing')">Sign out</UiButton></div>
        </div>
      </section>
    </div>

    <UiModal
      :open="!!revoking"
      size="sm"
      title="Revoke this token?"
      :description="`“${revoking?.name}” stops working at once. The agent that uses it will need a new token.`"
      @update:open="$event || (revoking = undefined)"
    >
      <template #footer>
        <UiButton variant="ghost" @click="revoking = undefined">Keep it</UiButton>
        <UiButton variant="danger" icon="trash" @click="revoke">Revoke token</UiButton>
      </template>
    </UiModal>
  </ShowcaseApp>
</template>
<style scoped>
.settings {
  display: grid;
  gap: var(--s-10);
  max-width: 60rem;
}
.group {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-5);
  padding-top: var(--s-8);
  border-top: 1px solid var(--s-line-strong);
}
/* The page header already draws a rule above the first group. */
.group:first-of-type {
  padding-top: 0;
  border-top: 0;
}
.group__head {
  display: grid;
  align-content: start;
  gap: var(--s-2);
}
.group__title {
  font: 600 var(--s-text-xl) / 1.2 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.025em;
}
.group__text {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.group__body {
  display: grid;
  gap: var(--s-5);
  min-width: 0;
}
@container s-main (min-width: 52rem) {
  .group {
    grid-template-columns: 15rem minmax(0, 1fr);
    gap: var(--s-10);
  }
}
.create {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--s-3);
}
.create__field {
  flex: 1 1 16rem;
}
.create > :last-child {
  margin-top: 1.625rem;
}
.who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-4);
}
.who > div {
  flex: 1 1 12rem;
}
.who__name {
  font-weight: 600;
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding-bottom: var(--s-4);
  border-bottom: 1px solid var(--s-line);
  font-weight: 500;
}
</style>
