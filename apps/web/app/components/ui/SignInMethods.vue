<script setup lang="ts">
import type { EmailActions } from "../../composables/useEmailChallenge";
defineProps<{
  methods: { email: string | null; github: string | null };
  actions?: EmailActions;
  specimen?: boolean;
}>();
const emit = defineEmits<{ changed: []; unlink: [] }>();
const editing = ref(false);
const rememberLanguage = useSignInLanguage();
function verified() {
  editing.value = false;
  emit("changed");
}
</script>
<template>
  <div class="s-methods">
    <div class="s-methods__row">
      <div>
        <strong>{{ $t("signin.email") }}</strong>
        <p>{{ methods.email || $t("signin.none") }}</p>
      </div>
      <UiButton v-if="actions" size="sm" @click="editing = !editing">{{
        editing ? $t("common.cancel") : methods.email ? $t("signin.change") : $t("signin.add")
      }}</UiButton>
    </div>
    <UiEmailChallenge v-if="actions && editing" :actions="actions" change @verified="verified" />
    <div class="s-methods__row">
      <div>
        <strong>{{ $t("signin.github") }}</strong>
        <p>{{ methods.github || $t("signin.none") }}</p>
      </div>
      <UiButton
        v-if="methods.github"
        size="sm"
        :disabled="!actions || !methods.email"
        @click="$emit('unlink')"
        >{{ $t("signin.unlink") }}</UiButton
      >
      <form
        v-else
        method="post"
        action="/auth/github"
        @submit="specimen ? $event.preventDefault() : rememberLanguage()"
      >
        <UiButton size="sm" icon="github" type="submit">{{ $t("signin.link") }}</UiButton>
      </form>
    </div>
    <p v-if="actions && methods.github && !methods.email" class="s-muted">
      {{ $t("signin.lastMethod") }}
    </p>
  </div>
</template>
<style scoped>
.s-methods {
  display: grid;
  gap: var(--s-4);
}
.s-methods__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  flex-wrap: wrap;
  padding-bottom: var(--s-4);
  border-bottom: 1px solid var(--s-line);
}
.s-methods__row p {
  color: var(--s-ink-2);
  overflow-wrap: anywhere;
}
</style>
