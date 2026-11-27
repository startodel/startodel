<script setup lang="ts">
const props = defineProps<{ text: string }>();
const paragraph = useTemplateRef("paragraph");
const id = useId();
const lines = 3;
const expanded = ref(false);
const overflows = ref(false);

function measure() {
  const el = paragraph.value;
  if (!el) return;
  // scrollHeight includes the clipped lines, and stays measurable while expanded.
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
  overflows.value = el.scrollHeight > Math.ceil(lineHeight * lines);
  if (!overflows.value) expanded.value = false;
}

onMounted(() => {
  const observer = new ResizeObserver(measure);
  observer.observe(paragraph.value!);
  document.fonts.addEventListener("loadingdone", measure);
  measure();
  onBeforeUnmount(() => {
    observer.disconnect();
    document.fonts.removeEventListener("loadingdone", measure);
  });
});
watch(
  () => props.text,
  () => {
    expanded.value = false;
    measure();
  },
  { flush: "post" },
);
</script>
<template>
  <div>
    <p ref="paragraph" :id="id" class="s-description" :class="{ 'is-clamped': !expanded }">
      {{ text }}
    </p>
    <button
      v-if="overflows"
      type="button"
      class="s-link s-description__toggle"
      :aria-expanded="expanded"
      :aria-controls="id"
      @click="expanded = !expanded"
    >
      {{ expanded ? $t("ui.showLess") : $t("ui.showMore") }}
    </button>
  </div>
</template>
<style scoped>
.s-description {
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.s-description__toggle {
  font-size: var(--s-text-sm);
}
.s-description.is-clamped {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: v-bind(lines);
  line-clamp: v-bind(lines);
  overflow: hidden;
}
</style>
