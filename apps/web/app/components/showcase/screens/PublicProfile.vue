<script setup lang="ts">
import { screenPath } from "../sample";
import { specimenProfile } from "../public-profile";
</script>
<template>
  <ShowcaseSite
    ><UiPublicProfile :data="specimenProfile" :track-path="() => screenPath('public-track')"
  /></ShowcaseSite>
</template>
