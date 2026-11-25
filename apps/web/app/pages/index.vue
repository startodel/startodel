<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { user, clear } = useUserSession();
async function logout() {
  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <main v-if="user">
    <h1>{{ user.login }}</h1>
    <p v-if="user.name">{{ user.name }}</p>
    <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" width="64" height="64" />
    <button type="button" @click="logout">Log out</button>
  </main>
</template>
