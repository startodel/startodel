<script setup lang="ts">
defineProps<{ name: string | null; host: string; request?: string }>();
</script>
<template>
  <section class="s-consent">
    <UiPageHeader
      :title="$t('oauth.wantsAccess', { name: name ?? $t('oauth.unnamed') })"
      :description="$t('oauth.declared')"
    />
    <div class="s-consent__details">
      <p class="s-consent__label">{{ $t("oauth.returnsTo") }}</p>
      <p class="s-mono"><bdi>{{ host }}</bdi></p>
    </div>
    <div>
      <h2 class="s-consent__title">{{ $t("oauth.permission") }}</h2>
      <p>{{ $t("oauth.canDo") }}</p>
    </div>
    <form
      class="s-cluster"
      action="/oauth/decision"
      method="post"
      @submit="!request && $event.preventDefault()"
    >
      <UiButton variant="primary" type="submit" name="allow" :value="request">{{
        $t("oauth.allow")
      }}</UiButton>
      <UiButton type="submit" name="deny" :value="request">{{ $t("oauth.deny") }}</UiButton>
    </form>
  </section>
</template>
<style scoped>
.s-consent {
  display: grid;
  gap: var(--s-6);
  overflow-wrap: anywhere;
}
.s-consent__details {
  padding: var(--s-4);
  background: var(--s-sunken);
  border-inline-start: 2px solid var(--s-line-strong);
}
.s-consent__label {
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
  margin-bottom: var(--s-1);
}
.s-consent__title {
  font-size: var(--s-text-lg);
  margin-bottom: var(--s-2);
}
</style>
