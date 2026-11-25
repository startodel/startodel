<script setup lang="ts">
const props = defineProps<{ question: string; presets: string[]; label: string }>();
const selected = defineModel<string[]>({ required: true });
const extra = ref("");
const options = computed(() => [...new Set([...props.presets, ...selected.value])]);
function add() {
  selected.value = [
    ...new Set([
      ...selected.value,
      ...extra.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ]),
  ];
  extra.value = "";
}
function onKey(event: KeyboardEvent) {
  if (!event.isComposing && [",", "Enter"].includes(event.key)) {
    event.preventDefault();
    add();
  }
}
</script>
<template>
  <fieldset>
    <legend>{{ question }}</legend>
    <div class="choices">
      <label v-for="option in options" :key="option" class="choice"
        ><input type="checkbox" v-model="selected" :value="option" />{{ option }}</label
      >
    </div>
    <label class="addition"
      >{{ label }} <input v-model="extra" placeholder="Add your own" @keydown="onKey" @blur="add"
    /></label>
  </fieldset>
</template>
<style scoped>
.addition {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.8rem;
  font-size: 0.92rem;
}
</style>
