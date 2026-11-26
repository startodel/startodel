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
  <div class="s-stack settings">
    <UiPageHeader :title="$t('nav.settings')" />
    <section class="settings__group">
      <div class="s-stack">
        <UiSectionHeading :title="$t('token.title')" />
        <p>{{ $t("settings.tokenAccess") }}</p>
      </div>
      <div class="s-stack">
        <UiNotice v-if="issued" :key="issued.id" tone="success" :title="$t('token.once')">
          <UiCopyField :label="$t('settings.token')" :value="issued.token" secret />
          <template #actions
            ><UiButton size="sm" @click="issued = undefined">{{
              $t("token.dismiss")
            }}</UiButton></template
          >
        </UiNotice>
        <form class="s-form-row" @submit.prevent="createToken">
          <UiField :label="$t('token.name')"><UiInput v-model="name" required /></UiField>
          <UiButton
            type="submit"
            icon="key"
            class="s-form-row__action"
            :disabled="busy || !name.trim()"
            >{{ $t("token.create") }}</UiButton
          >
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
    <section v-if="me?.user" class="settings__group">
      <UiSectionHeading :title="$t('onboarding.profile')" />
      <div class="s-stack">
        <div class="s-cluster">
          <UiAvatar :name="me.user.name || me.user.login" :src="me.user.avatarUrl" />
          <strong>{{ me.user.name || me.user.login }}</strong>
          <span class="s-muted">@{{ me.user.login }}</span>
        </div>
        <div class="s-cluster">
          <UiChip v-for="tech in me.profile.stack" :key="tech">{{ tech }}</UiChip>
          <UiBadge v-if="me.profile.experience">{{ $t(`grade.${me.profile.experience}`) }}</UiBadge>
        </div>
        <div><UiButton to="/onboarding" icon="user">{{ $t("settings.edit") }}</UiButton></div>
      </div>
    </section>
    <section class="settings__group">
      <UiSectionHeading :title="$t('settings.appearance')" />
      <div class="s-stack">
        <div class="s-cluster"><span>{{ $t("ui.theme") }}</span><UiThemeToggle /></div>
        <div class="s-cluster">
          <span>{{ $t("nav.language") }}</span><UiLanguageSwitcher variant="inline" />
        </div>
      </div>
    </section>
    <section class="settings__group">
      <UiSectionHeading :title="$t('settings.session')" />
      <div><UiButton icon="logout" @click="logout">{{ $t("nav.logout") }}</UiButton></div>
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
  gap: var(--s-10);
}
.settings__group {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-5);
}
@container s-main (min-width: 52rem) {
  .settings__group {
    grid-template-columns: 15rem minmax(0, 1fr);
    gap: var(--s-10);
  }
}
</style>
