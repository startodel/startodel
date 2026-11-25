<script setup lang="ts">
import docs from "../utils/legal.generated.json";
const props = defineProps<{ name: "terms" | "rules" }>();
const route = useRoute();
const preferred = useState<"en" | "ru">("legal-language", () => {
  const header = import.meta.client
    ? navigator.languages.join(",")
    : (useRequestHeaders(["accept-language"])["accept-language"] ?? "");
  const languages = header
    .split(",")
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().toLowerCase().split(";");
      const weight = parameters.find((p) => p.trim().startsWith("q="));
      return { lang: tag?.split("-")[0], quality: weight ? Number(weight.trim().slice(2)) : 1 };
    })
    .filter((item) => item.quality > 0)
    .sort((a, b) => b.quality - a.quality);
  return languages.find((item) => item.lang === "ru" || item.lang === "en")?.lang === "ru"
    ? "ru"
    : "en";
});
const lang = computed(() =>
  route.query.lang === "ru" || route.query.lang === "en" ? route.query.lang : preferred.value,
);
const doc = computed(() => docs[props.name][lang.value]);
useHead(() => ({
  title: doc.value.title,
  htmlAttrs: { lang: lang.value },
  meta: [{ name: "description", content: doc.value.body.split("\n\n")[1] }],
}));
</script>
<template>
  <main class="narrow">
    <nav aria-label="Language">
      <NuxtLink :to="{ query: { lang: 'en' } }" lang="en" hreflang="en">English</NuxtLink
      ><NuxtLink :to="{ query: { lang: 'ru' } }" lang="ru" hreflang="ru">Русский</NuxtLink>
    </nav>
    <h1>{{ doc.title }}</h1>
    <p class="muted">{{ lang === "ru" ? "Версия" : "Version" }} {{ doc.version }}</p>
    <article class="panel"><LessonMarkdown :text="doc.body" /></article>
  </main>
</template>
