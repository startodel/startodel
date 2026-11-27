<script setup lang="ts">
const indexTag = useIndexTag();
definePageMeta({ layout: "site" });
const { t } = useI18n();
const rememberLanguage = useSignInLanguage();
usePublicHead(t("login.title"), t("login.description"), "/");

const topics = computed(() => [
  { id: "plans", tag: indexTag("topic", 1), title: t("login.plans"), level: 4 },
  { id: "statistics", tag: indexTag("topic", 2), title: t("login.statistics"), level: 3 },
  { id: "estimates", tag: indexTag("topic", 3), title: t("login.estimates"), level: 3 },
  { id: "joins", tag: indexTag("topic", 4), title: t("login.joins"), level: 2 },
  { id: "hash", tag: indexTag("topic", 5), title: t("login.hash"), level: 2 },
  { id: "memory", tag: indexTag("topic", 6), title: t("login.memory"), level: 1 },
  { id: "parallel", tag: indexTag("topic", 7), title: t("login.parallel"), level: 0 },
  { id: "indexes", tag: indexTag("topic", 8), title: t("login.indexes"), level: 2 },
  { id: "scans", tag: indexTag("topic", 9), title: t("login.scans"), level: 0 },
  { id: "cost", tag: indexTag("topic", 10), title: t("login.cost"), level: 1 },
  { id: "parameters", tag: indexTag("topic", 11), title: t("login.parameters"), level: 0 },
  { id: "analysis", tag: indexTag("topic", 12), title: t("login.analysis"), level: 0 },
]);
const edges = [
  { from: "plans", to: "statistics" },
  { from: "plans", to: "indexes" },
  { from: "plans", to: "cost" },
  { from: "statistics", to: "estimates" },
  { from: "statistics", to: "joins" },
  { from: "statistics", to: "parallel" },
  { from: "estimates", to: "hash" },
  { from: "joins", to: "memory" },
  { from: "hash", to: "memory" },
  { from: "indexes", to: "scans" },
  { from: "cost", to: "parameters" },
  { from: "scans", to: "analysis" },
  { from: "parameters", to: "analysis" },
];
const live = computed(() => topics.value.filter((topic) => topic.level >= 2).length);
const steps = computed(
  () =>
    [
      { icon: "user", title: t("login.questionnaire"), text: t("login.questionnaireText") },
      { icon: "plug", title: t("login.connect"), text: t("login.connectText") },
      { icon: "track", title: t("login.study"), text: t("login.studyText") },
      { icon: "grill", title: t("login.practice"), text: t("login.practiceText") },
    ] as const,
);

const facts = computed(() => [
  { title: t("login.agent"), text: t("login.agentText") },
  { title: t("login.depth"), text: t("login.depthText") },
  { title: t("login.open"), text: t("login.openText") },
]);
const route = useRoute();
</script>
<template>
  <div class="landing">
    <section class="hero">
      <div class="s-page hero__inner">
        <div class="hero__copy">
          <UiNotice
            v-if="route.query.error !== undefined"
            tone="danger"
            :title="$t('login.error')"
          />
          <p class="s-label hero__kicker">{{ $t("login.audience") }}</p>
          <h1 class="s-display hero__title">{{ $t("login.heading") }}</h1>
          <p class="hero__lead">
            {{ $t("login.intro") }}
          </p>
          <div class="s-cluster hero__actions">
            <UiButton
              variant="primary"
              size="lg"
              icon="github"
              href="/auth/github"
              target="_self"
              @click="rememberLanguage"
              >{{ $t("login.signIn") }}</UiButton
            >
            <UiButton
              size="lg"
              variant="ghost"
              icon-right="arrow-right"
              :to="{ path: '/', hash: '#how' }"
              >{{ $t("login.how") }}</UiButton
            >
          </div>
          <p class="hero__note">{{ $t("login.note") }}</p>
        </div>
        <figure class="hero__board">
          <figcaption class="hero__plate">
            <span>{{ $t("login.example") }}</span>
            <span
              ><i aria-hidden="true" />{{
                $t("login.live", { live: $n(live), total: $n(topics.length) })
              }}</span
            >
          </figcaption>
          <UiTrackMap
            class="s-grid hero__map"
            :topics="topics"
            :edges="edges"
            :label="$t('login.map')"
            fit
          />
        </figure>
      </div>
    </section>

    <section id="how" class="band">
      <div class="s-page s-stack" style="--s-gap: var(--s-8)">
        <header class="band__head">
          <p class="s-label">{{ $t("login.how") }}</p>
          <h2 class="s-title">{{ $t("login.steps") }}</h2>
        </header>
        <ol class="steps">
          <li v-for="(step, i) in steps" :key="step.title" class="steps__step">
            <span class="steps__pad" aria-hidden="true">{{ String(i + 1).padStart(2, "0") }}</span>
            <UiIcon :name="step.icon" :size="20" class="steps__icon" />
            <h3 class="steps__title">{{ step.title }}</h3>
            <p class="steps__text">{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="band band--plain">
      <div class="s-page signal">
        <div class="s-stack" style="--s-gap: var(--s-4)">
          <p class="s-label">{{ $t("progress.mastery") }}</p>
          <h2 class="s-title">{{ $t("login.mastery") }}</h2>
          <p class="signal__lead">
            {{ $t("login.masteryText") }}
          </p>
        </div>
        <ol class="signal__scale" :aria-label="$t('progress.levels')">
          <li v-for="level in 5" :key="level">
            <UiMastery :level="level - 1" size="lg" />
            <span>{{ $t(`mastery.level${level - 1}`) }}</span>
          </li>
        </ol>
      </div>
    </section>

    <section class="band">
      <div class="s-page s-columns" style="--s-gap: var(--s-8)">
        <article v-for="f in facts" :key="f.title" class="fact">
          <h3 class="fact__title">{{ f.title }}</h3>
          <p class="fact__text">{{ f.text }}</p>
        </article>
      </div>
    </section>

    <section class="cta">
      <div class="s-page cta__inner">
        <h2 class="s-title cta__title">{{ $t("login.start") }}</h2>
        <div class="s-cluster">
          <UiButton
            variant="primary"
            size="lg"
            icon="github"
            href="/auth/github"
            target="_self"
            @click="rememberLanguage"
            >{{ $t("login.signIn") }}</UiButton
          >
          <UiButton size="lg" href="https://github.com/startodel/startodel" icon-right="external">{{
            $t("login.source")
          }}</UiButton>
        </div>
      </div>
    </section>
  </div>
</template>
<style scoped>
.hero {
  border-bottom: 1px solid var(--s-line);
}
.hero__inner {
  display: grid;
  gap: var(--s-10);
  padding-block: clamp(var(--s-10), 8cqi, var(--s-20)) var(--s-12);
}
.hero__copy {
  display: grid;
  gap: var(--s-5);
  max-width: 44rem;
}
.hero__kicker {
  color: var(--s-copper);
}
.hero__lead {
  max-width: 38rem;
  font-size: var(--s-text-xl);
  line-height: 1.5;
  color: var(--s-ink-2);
  text-wrap: pretty;
}
.hero__actions {
  margin-top: var(--s-2);
}
.hero__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.hero__board {
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-lg);
  background: var(--s-sunken);
  box-shadow: var(--s-shadow-3);
  overflow: hidden;
}
.hero__plate {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--s-1) var(--s-4);
  padding: var(--s-3) var(--s-4);
  border-bottom: 1px solid var(--s-line);
  background: var(--s-surface);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.hero__plate span {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
}
.hero__plate i {
  width: var(--s-2);
  height: var(--s-2);
  border-radius: 50%;
  background: var(--s-copper-fill);
}
.hero__board .hero__map {
  padding: var(--s-2);
}
.band {
  padding-block: clamp(var(--s-12), 8cqi, var(--s-20));
  border-bottom: 1px solid var(--s-line);
  background: var(--s-surface);
}
.band--plain {
  background: var(--s-bg);
}
.band__head {
  display: grid;
  gap: var(--s-3);
}
.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  list-style: none;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  overflow: hidden;
}
.steps__step {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--s-2);
  padding: var(--s-5);
  /* Cell borders that collapse whatever the number of columns. */
  box-shadow:
    1px 0 0 var(--s-line),
    0 1px 0 var(--s-line);
}
.steps__pad {
  font: 600 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  color: var(--s-copper);
}
.steps__icon {
  margin-top: var(--s-4);
  color: var(--s-ink);
}
.steps__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
}
.steps__text,
.fact__text {
  color: var(--s-ink-2);
}
.signal {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  align-items: center;
  gap: var(--s-10);
}
.signal__lead {
  max-width: 34rem;
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.signal__scale {
  display: grid;
  list-style: none;
  border-top: 1px solid var(--s-line);
}
.signal__scale li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-3) 0;
  border-bottom: 1px solid var(--s-line);
  font-weight: 600;
}
.fact {
  display: grid;
  align-content: start;
  gap: var(--s-2);
  padding-top: var(--s-4);
  border-top: 2px solid var(--s-ink);
}
.fact__title {
  font: 600 var(--s-text-lg) / 1.25 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.02em;
}
.cta {
  padding-block: clamp(var(--s-12), 8cqi, var(--s-20));
}
.cta__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-6);
}
</style>
