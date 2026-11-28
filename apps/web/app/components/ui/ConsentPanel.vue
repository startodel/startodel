<script setup lang="ts">
/**
 * The decision an Owner makes when an OAuth Client asks for access: who asks, what it will be
 * able to do, where the browser returns, and two answers. The name is the app's own claim.
 */
defineProps<{ name: string | null; host: string; request?: string }>();
</script>
<template>
  <section class="s-consent">
    <UiFocusHeader :title="$t('oauth.wantsAccess', { name: name ?? $t('oauth.unnamed') })" />
    <dl class="s-consent__facts">
      <div class="s-consent__fact">
        <dt class="s-label">{{ $t("oauth.permission") }}</dt>
        <dd>{{ $t("oauth.canDo") }}</dd>
      </div>
      <div class="s-consent__fact">
        <dt class="s-label">{{ $t("oauth.returnsTo") }}</dt>
        <dd class="s-mono"><bdi>{{ host }}</bdi></dd>
      </div>
    </dl>
    <form
      class="s-consent__actions"
      action="/oauth/decision"
      method="post"
      @submit="!request && $event.preventDefault()"
    >
      <UiButton variant="primary" size="lg" type="submit" name="allow" :value="request">{{
        $t("oauth.allow")
      }}</UiButton>
      <UiButton size="lg" type="submit" name="deny" :value="request">{{
        $t("oauth.deny")
      }}</UiButton>
    </form>
    <p class="s-consent__note">{{ $t("oauth.declared") }}</p>
  </section>
</template>
<style scoped>
.s-consent {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-6);
  max-width: 30rem;
  margin-inline: auto;
  overflow-wrap: anywhere;
}
.s-consent__facts {
  display: grid;
  border-top: 1px solid var(--s-line);
}
.s-consent__fact {
  display: grid;
  gap: var(--s-1);
  padding-block: var(--s-4);
  border-bottom: 1px solid var(--s-line);
}
.s-consent__actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  gap: var(--s-3);
}
.s-consent__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
  text-wrap: pretty;
}
</style>
