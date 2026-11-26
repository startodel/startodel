<script setup lang="ts">
definePageMeta({ layout: "site" });
const { t } = useI18n();
const rememberLanguage = useSignInLanguage();
usePublicHead(t("login.title"), t("login.description"), "/login");

const topics = computed(() => [
  { id: "index", tag: "T01", title: t("login.indexes"), level: 3 },
  { id: "statistics", tag: "T02", title: t("login.statistics"), level: 2 },
  { id: "plan", tag: "T03", title: t("login.plans"), level: 1 },
  { id: "join", tag: "T04", title: t("login.joins"), level: 0 },
]);
const edges = [
  { from: "index", to: "plan" },
  { from: "statistics", to: "plan" },
  { from: "plan", to: "join" },
];
const steps = computed(
  () =>
    [
      { icon: "user", title: t("login.questionnaire"), text: t("login.questionnaireText") },
      { icon: "plug", title: t("login.connect"), text: t("login.connectText") },
      { icon: "track", title: t("login.study"), text: t("login.studyText") },
      { icon: "grill", title: t("login.practice"), text: t("login.practiceText") },
    ] as const,
);
</script>
<template>
  <div class="s-page s-stack landing">
    <section class="s-stack">
      <header class="s-stack">
        <p class="s-label">{{ $t("login.audience") }}</p>
        <h1 class="s-display">{{ $t("login.heading") }}</h1>
        <p class="s-read">{{ $t("login.intro") }}</p>
        <div class="s-cluster">
          <UiButton
            href="/auth/github"
            target="_self"
            variant="primary"
            size="lg"
            icon="github"
            @click="rememberLanguage"
            >{{ $t("login.signIn") }}</UiButton
          >
          <UiButton
            :to="{ path: '/login', hash: '#how' }"
            variant="ghost"
            icon-right="arrow-right"
            >{{ $t("login.how") }}</UiButton
          >
        </div>
      </header>
      <UiCard as="figure" variant="sunken">
        <figcaption class="s-label">{{ $t("login.example") }}</figcaption>
        <UiTrackMap class="s-grid" :topics="topics" :edges="edges" :label="$t('login.map')" fit />
      </UiCard>
    </section>
    <section id="how" class="s-stack">
      <UiSectionHeading :title="$t('login.how')" />
      <ol class="s-columns">
        <li v-for="step in steps" :key="step.icon">
          <UiCard>
            <template #header
              ><UiIcon :name="step.icon" />
              <h3>{{ step.title }}</h3></template
            >
            {{ step.text }}
          </UiCard>
        </li>
      </ol>
    </section>
    <section class="s-stack">
      <UiSectionHeading :title="$t('login.mastery')" />
      <p>{{ $t("login.masteryText") }}</p>
      <div class="s-cluster">
        <UiMastery v-for="level in 5" :key="level" :level="level - 1" show="full" />
      </div>
    </section>
    <section class="s-columns">
      <UiCard :tag="$t('login.agent')">{{ $t("login.agentText") }}</UiCard>
      <UiCard :tag="$t('login.open')">{{ $t("login.openText") }}</UiCard>
    </section>
    <section class="s-stack">
      <UiSectionHeading :title="$t('login.start')" />
      <div class="s-cluster">
        <UiButton
          href="/auth/github"
          target="_self"
          variant="primary"
          icon="github"
          @click="rememberLanguage"
          >{{ $t("login.signIn") }}</UiButton
        >
        <UiButton href="https://github.com/startodel/startodel" icon-right="external">{{
          $t("login.source")
        }}</UiButton>
      </div>
    </section>
  </div>
</template>
<style scoped>
.landing {
  gap: var(--s-12);
}
</style>
