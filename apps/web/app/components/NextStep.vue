<script setup lang="ts">
const countArgs = useCountArgs();
const goalLabels = useGoalLabels();
const me = useMe();
const goals = computed(() =>
  me.value?.profile?.goals.map((goal) => goalLabels.value.get(goal) ?? goal).join(", "),
);
const { data, error, refresh } = await useFetch("/api/next-step");
</script>
<template>
  <section class="panel next">
    <h2>{{ $t("next.title") }}</h2>
    <p v-if="error" role="alert">
      {{ $t("next.load") }} <button @click="refresh()">{{ $t("common.retry") }}</button>
    </p>
    <template v-if="data">
      <p v-if="'title' in data">
        <strong>{{ data.title }}</strong> ·
        {{ $t("grill.unanswered", { count: $n(data.unanswered) }) }} ·
        {{ $t("grill.waitingCount", { waiting: $n(data.waiting) }) }}
      </p>
      <template v-else-if="'suggestions' in data"
        ><p>{{ $t("next.ready") }}</p>
        <ul>
          <li v-for="t in data.suggestions" :key="t.id">
            <NuxtLinkLocale :to="'/topics/' + t.id">{{ t.title }}</NuxtLinkLocale>
          </li>
        </ul></template
      >
      <p v-else-if="data.id === 'first-steps'">{{ $t("next.onboarding") }}</p>
      <p v-else-if="data.id === 'build-track-technology'">{{ $t("progress.noTracks") }}</p>
      <p v-else-if="data.id === 'review-loop'">
        {{ $t("count.reviews", countArgs(data.state.dueReviews)) }}
      </p>
      <p v-else>{{ $t("next.plan") }}</p>
      <NuxtLinkLocale v-if="'href' in data" :to="data.href" class="button primary">{{
        data.id === "first-steps"
          ? $t("next.complete")
          : data.id === "grill-session"
            ? $t("next.continue")
            : $t("next.review")
      }}</NuxtLinkLocale>
      <AgentPrompt
        v-if="'prompt' in data"
        :text="
          data.id === 'build-track-technology'
            ? $t('next.buildPrompt', {
                goals: goals || me?.profile?.stack.join(', ') || $t('next.goals'),
              })
            : $t('next.planPrompt')
        "
      />
    </template>
  </section>
</template>
<style scoped>
.next {
  border-left: 4px solid var(--green);
}
</style>
