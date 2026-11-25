<script setup lang="ts">
import { languageCookie } from "../../shared/locale";
const { t, locale } = useI18n();
const preference = useCookie(languageCookie, { sameSite: "lax", maxAge: 31536000, path: "/" });
usePublicHead(t("login.title"), t("login.description"), "/login");
</script>
<template>
  <main>
    <h1>Startodel</h1>
    <a href="/auth/github" @click="preference = locale">{{ $t("login.signIn") }}</a>
  </main>
</template>
