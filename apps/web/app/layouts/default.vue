<script setup lang="ts">
const { user } = useUserSession();
const localePath = useLocalePath();
const route = useRoute();
const logout = useLogout();
</script>
<template>
  <div>
    <header class="mast">
      <div class="bar">
        <NuxtLinkLocale class="brand" to="/"
          ><span aria-hidden="true" class="brand-mark">S</span>Startodel</NuxtLinkLocale
        >
        <nav v-if="user && route.path !== localePath('/login')" :aria-label="$t('nav.main')">
          <NuxtLinkLocale to="/">{{ $t("nav.dashboard") }}</NuxtLinkLocale
          ><NuxtLinkLocale to="/grills">{{ $t("nav.grills") }}</NuxtLinkLocale
          ><NuxtLinkLocale to="/reviews">{{ $t("nav.reviews") }}</NuxtLinkLocale
          ><NuxtLinkLocale to="/progress">{{ $t("nav.progress") }}</NuxtLinkLocale
          ><NuxtLinkLocale to="/settings">{{ $t("nav.settings") }}</NuxtLinkLocale>
          <span class="identity"
            ><img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" width="28" height="28" />{{
              user.name || user.login
            }}</span
          >
          <button class="quiet" @click="logout">{{ $t("nav.logout") }}</button>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
    <slot />
    <footer class="bar">
      <nav :aria-label="$t('legal.nav')">
        <NuxtLinkLocale to="/terms">{{ $t("legal.terms") }}</NuxtLinkLocale
        ><NuxtLinkLocale to="/rules">{{ $t("legal.rules") }}</NuxtLinkLocale>
      </nav>
      <LanguageSwitcher />
    </footer>
  </div>
</template>
