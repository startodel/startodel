<script setup lang="ts">
import type { ThemedToken } from "shiki/types";
const props = defineProps<{ code: string; language: string }>();
const lines = shallowRef<ThemedToken[][]>();
onMounted(() =>
  watchEffect(async (onCleanup) => {
    const { code, language } = props;
    let current = true;
    onCleanup(() => {
      current = false;
    });
    try {
      const { highlight } = await import("../utils/highlight");
      const result = await highlight(code, language);
      if (current) lines.value = result;
    } catch {
      if (current) lines.value = undefined;
    }
  }),
);
</script>
<template>
  <figure>
    <figcaption>{{ language }}</figcaption>
    <pre
      tabindex="0"
    ><code v-if="lines"><template v-for="(line,i) in lines" :key="i"><template v-if="i">{{'\n'}}</template><span v-for="(token,j) in line" :key="j" :style="{color:token.color}">{{token.content}}</span></template></code><code v-else>{{code}}</code></pre>
  </figure>
</template>
<style scoped>
figure {
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 7px;
  overflow: hidden;
}
figcaption {
  background: #eff4ee;
  padding: 0.35rem 1rem;
  font-size: 0.85rem;
}
pre {
  margin: 0;
  background: white;
}
</style>
