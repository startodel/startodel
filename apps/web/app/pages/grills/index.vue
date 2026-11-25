<script setup lang="ts">
const countArgs = useCountArgs();
const { t } = useI18n();
const displayDate = useDisplayDate();
useHead({ title: t("nav.grills") });
const { data, error, refresh } = await useFetch("/api/grills");
</script>
<template>
  <main>
    <h1>{{ $t("nav.grills") }}</h1>
    <p>{{ $t("grill.intro") }}</p>
    <p v-if="error" role="alert">
      {{ $t("grill.load") }} <button @click="refresh()">{{ $t("common.retry") }}</button>
    </p>
    <section v-for="g in data" :key="g.id" class="panel">
      <small
        >{{ g.status === "open" ? $t("grill.open") : $t("grill.finished") }} ·
        {{ displayDate(g.createdAt) }} · {{ g.track || $t("grill.across") }}</small
      >
      <h2><NuxtLinkLocale :to="'/grills/' + g.id">{{ g.title }}</NuxtLinkLocale></h2>
      <p>
        {{ $t("grill.stats", { answered: $n(g.answered), judged: $n(g.judged) }) }} ·
        {{ $t("count.questions", countArgs(g.total)) }}
      </p>
    </section>
    <p v-if="data && !data.length">{{ $t("grill.none") }}</p>
    <section class="panel narrow">
      <h2>{{ $t("grill.start") }}</h2>
      <AgentPrompt :text="$t('grill.prompt')" />
    </section>
  </main>
</template>
