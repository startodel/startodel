<script setup lang="ts">
const { user } = useUserSession();
const logout = useLogout();
</script>
<template>
  <UiRoot>
    <UiFocusLayout>
      <template #actions>
        <template v-if="user">
          <UiAvatar :name="user.name || user.login" :src="user.avatarUrl" :size="24" />
          <span>{{ user.login }}</span>
          <UiButton variant="ghost" size="sm" icon="logout" @click="logout">{{
            $t("nav.logout")
          }}</UiButton>
        </template>
      </template>
      <slot />
    </UiFocusLayout>
  </UiRoot>
</template>
