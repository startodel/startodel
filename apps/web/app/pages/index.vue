<script setup lang="ts">
const countArgs = useCountArgs();
const { t } = useI18n();
useHead({ title: t("nav.dashboard") });
const { data, error, refresh } = await useFetch("/api/dashboard");
</script>
<template>
  <main>
    <h1>{{ $t("nav.dashboard") }}</h1>
    <NextStep />
    <p v-if="error" role="alert">
      {{ $t("dashboard.load") }} <button @click="refresh()">{{ $t("common.retry") }}</button>
    </p>
    <template v-if="data"
      ><p class="muted">
        {{ $t("count.tracks", countArgs(data.tracks.length)) }} ·
        {{ $t("count.reviews", countArgs(data.dueReviewsCount)) }}
      </p>
      <section v-if="data.tracks.length">
        <h2>{{ $t("dashboard.tracks") }}</h2>
        <div class="cards">
          <article v-for="t in data.tracks" :key="t.trackId" class="panel">
            <h3><NuxtLinkLocale :to="'/tracks/' + t.trackId">{{ t.title }}</NuxtLinkLocale></h3>
            <p>{{ $t("dashboard.atLevel", { done: $n(t.completed), total: $n(t.total) }) }}</p>
            <progress
              :aria-label="$t('dashboard.completion', { title: t.title })"
              :value="t.percent"
              max="100"
            /><small
              >{{ $t("dashboard.percent", { percent: $n(t.percent / 100, { style: "percent" }) }) }}
              <strong v-if="t.total && t.completed === t.total">
                · {{ $t("dashboard.completed") }}</strong
              ></small
            >
          </article>
        </div>
      </section>
      <section v-else class="panel narrow">
        <h2>{{ $t("dashboard.first") }}</h2>
        <p>{{ $t("dashboard.start") }}</p>
        <NuxtLinkLocale to="/onboarding/connect" class="button primary">{{
          $t("agent.connect")
        }}</NuxtLinkLocale
        ><AgentConfig />
      </section>
    </template>
  </main>
</template>
<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));
  gap: 1rem;
}
.cards .panel {
  margin: 0;
}
.cards h3 {
  font-size: 1.35rem;
}
</style>
