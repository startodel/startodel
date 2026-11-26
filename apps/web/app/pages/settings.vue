<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
useHead({ title: t("nav.settings") });
const {
  tokens,
  listError,
  refresh,
  status,
  name,
  endpoint,
  issued,
  busy,
  message,
  createToken,
  revokeToken,
} = useMcpTokens();
const me = useMe();
const displayDate = useDisplayDate();
const animate = useBoardMotion();
const logout = useLogout();
const revoking = ref<{ id: string; name: string }>();
const columns = computed(() => [
  { key: "name", label: t("token.name") },
  { key: "prefix", label: t("settings.prefix") },
  { key: "createdAt", label: t("settings.created") },
  { key: "lastUsedAt", label: t("settings.lastUsed") },
  { key: "actions", label: "", align: "right" as const },
]);
function confirmRevoke() {
  if (!revoking.value) return;
  const id = revoking.value.id;
  revoking.value = undefined;
  return revokeToken(id);
}
</script>
<template>
  <div class="settings">
    <UiPageHeader :title="$t('nav.settings')" :description="$t('settings.intro')" />
    <section class="group">
      <header class="group__head">
        <h2 class="group__title">{{ $t("token.title") }}</h2>
        <p class="group__text">{{ $t("settings.tokenAccess") }}</p>
      </header>
      <div class="group__body">
        <UiNotice v-if="issued" :key="issued.id" tone="success" :title="$t('token.once')">
          <UiCopyField :label="$t('settings.token')" :value="issued.token" secret />
          <template #actions
            ><UiButton size="sm" @click="issued = undefined">{{
              $t("token.dismiss")
            }}</UiButton></template
          >
        </UiNotice>
        <form class="create" @submit.prevent="createToken">
          <UiField class="create__field" :label="$t('token.name')"
            ><UiInput v-model="name" required
          /></UiField>
          <UiButton type="submit" icon="key" :disabled="busy || !name.trim()">{{
            $t("token.create")
          }}</UiButton>
        </form>
        <UiNotice v-if="message" tone="danger" :title="message" />
        <UiNotice v-if="listError" tone="danger" :title="$t('token.load')">
          <template #actions
            ><UiButton size="sm" @click="refresh()">{{ $t("common.retry") }}</UiButton></template
          >
        </UiNotice>
        <UiSkeletonList v-else-if="status === 'pending' || status === 'idle'" variant="table" />
        <UiTable
          v-else-if="tokens?.length"
          :caption="$t('token.title')"
          :columns="columns"
          :rows="tokens"
          :row-key="(row) => row.id"
        >
          <template #cell-name="{ row }"
            ><strong :class="{ 's-muted': row.revokedAt }">{{ row.name }}</strong></template
          >
          <template #cell-prefix="{ row }"><code class="s-mono">{{ row.prefix }}…</code></template>
          <template #cell-createdAt="{ row }">{{ displayDate(row.createdAt) }}</template>
          <template #cell-lastUsedAt="{ row }">{{
            row.lastUsedAt ? displayDate(row.lastUsedAt) : $t("settings.never")
          }}</template>
          <template #cell-actions="{ row }">
            <UiBadge v-if="row.revokedAt">{{ $t("token.revoked") }}</UiBadge>
            <UiButton v-else variant="danger" size="sm" :disabled="busy" @click="revoking = row">{{
              $t("token.revoke")
            }}</UiButton>
          </template>
        </UiTable>
        <UiEmptyState v-else :title="$t('token.none')" icon="key" compact />
        <UiCopyField v-if="endpoint" :label="$t('token.endpoint')" :value="endpoint" />
      </div>
    </section>
    <section v-if="me?.user" class="group">
      <header class="group__head">
        <h2 class="group__title">{{ $t("onboarding.profile") }}</h2>
        <p class="group__text">{{ $t("onboarding.intro") }}</p>
      </header>
      <div class="group__body">
        <div class="who">
          <UiAvatar :size="48" :name="me.user.name || me.user.login" :src="me.user.avatarUrl" />
          <div>
            <p class="who__name">{{ me.user.name || me.user.login }}</p>
            <p class="s-muted">@{{ me.user.login }}</p>
          </div>
          <UiButton
            :to="'/u/' + encodeURIComponent(me.user.login)"
            icon-right="external"
            size="sm"
            >{{ $t("settings.publicProfile") }}</UiButton
          >
        </div>
        <div class="s-cluster">
          <UiChip v-for="tech in me.profile.stack" :key="tech">{{ tech }}</UiChip>
          <UiBadge v-if="me.profile.experience">{{ $t(`grade.${me.profile.experience}`) }}</UiBadge>
        </div>
        <div><UiButton to="/onboarding" icon="user">{{ $t("settings.edit") }}</UiButton></div>
      </div>
    </section>
    <section class="group">
      <header class="group__head">
        <h2 class="group__title">{{ $t("settings.appearance") }}</h2>
        <p class="group__text">{{ $t("settings.browser") }}</p>
      </header>
      <div class="group__body">
        <div class="row"><span>{{ $t("ui.theme") }}</span><UiThemeToggle /></div>
        <div class="row">
          <span>{{ $t("nav.language") }}</span><UiLanguageSwitcher variant="inline" />
        </div>
        <div class="row"><UiSwitch v-model="animate">{{ $t("settings.motion") }}</UiSwitch></div>
      </div>
    </section>
    <section class="group">
      <header class="group__head">
        <h2 class="group__title">{{ $t("settings.session") }}</h2>
      </header>
      <div class="group__body">
        <div><UiButton icon="logout" @click="logout">{{ $t("nav.logout") }}</UiButton></div>
      </div>
    </section>
    <UiModal
      :open="!!revoking"
      :title="$t('settings.confirm')"
      :description="$t('settings.revokeEffect', { name: revoking?.name })"
      size="sm"
      @update:open="$event || (revoking = undefined)"
    >
      <template #footer>
        <UiButton variant="ghost" @click="revoking = undefined">{{ $t("common.cancel") }}</UiButton>
        <UiButton variant="danger" icon="trash" :disabled="busy" @click="confirmRevoke">{{
          $t("token.revoke")
        }}</UiButton>
      </template>
    </UiModal>
  </div>
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
.create .create__field {
  flex: 1 1 16rem;
}
.create > :last-child {
  margin-top: calc(var(--s-text-sm) * 1.35 + var(--s-2));
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
