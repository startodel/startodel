<script setup lang="ts">
defineProps<{
  title: string;
  count: number;
  options: { value: string; label: string }[];
  showSingle?: boolean;
}>();
const language = defineModel<string>({ required: true });
</script>
<template>
  <UiSectionHeading :title="title" :count="$n(count)">
    <template v-if="showSingle || options.length > 2" #default>
      <UiSelect
        v-model="language"
        :label="$t('trackLanguage.filter')"
        size="sm"
        :options="options"
      />
    </template>
  </UiSectionHeading>
</template>
