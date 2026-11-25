<script setup lang="ts">
import { MASTERY_LABELS } from "@startodel/core";
import { sampleEdges, sampleTopics, screenPath } from "../sample";
const steps = [
  {
    title: "Say where you stand",
    text: "Three questions: your stack, your goals and your grade. No placement test.",
    icon: "user",
  },
  {
    title: "Connect your agent",
    text: "Create an MCP Token and paste one config block into the agent you already use.",
    icon: "plug",
  },
  {
    title: "Study the board",
    text: "The agent plans a Track and writes each Lesson: theory, code, a Quiz, an Exercise.",
    icon: "track",
  },
  {
    title: "Get grilled",
    text: "Fifteen questions, answered in your own words. The agent gives each one a Verdict.",
    icon: "grill",
  },
] as const;
const facts = [
  {
    title: "No model on the server",
    text: "Startodel stores your learning data and nothing else. The thinking happens in your agent, with your keys.",
  },
  {
    title: "Built for people who ship",
    text: "Lessons assume you know how to program. They go to the mechanism, the trade-off and the failure mode.",
  },
  {
    title: "Open source, MIT",
    text: "Run it yourself or use the hosted version. Publish a Track and anyone can fork it.",
  },
];
</script>
<template>
  <ShowcaseSite>
    <section class="hero">
      <div class="s-page hero__inner">
        <div class="hero__copy">
          <p class="s-label hero__kicker">Learning for experienced developers</p>
          <h1 class="s-display hero__title">Wire up what you know.</h1>
          <p class="hero__lead">
            Your own AI agent plans the Track, writes the Lessons and grills you. Startodel keeps
            the board: every Topic, what it depends on, and how well you hold it.
          </p>
          <div class="s-cluster hero__actions">
            <UiButton variant="primary" size="lg" icon="github" :to="screenPath('onboarding')"
              >Sign in with GitHub</UiButton
            >
            <UiButton
              size="lg"
              variant="ghost"
              icon-right="arrow-right"
              :to="{ path: screenPath('landing'), hash: '#how' }"
              >How it works</UiButton
            >
          </div>
          <p class="hero__note">Free and open source. You bring the agent.</p>
        </div>
        <figure class="hero__board">
          <figcaption class="hero__plate">
            <span>Track · Node.js runtime internals</span>
            <span><i aria-hidden="true" />6 of 12 live</span>
          </figcaption>
          <UiTrackMap
            class="s-grid hero__map"
            :topics="sampleTopics"
            :edges="sampleEdges"
            label="A sample Track drawn as a circuit board: six of twelve Topics carry signal"
            fit
          />
        </figure>
      </div>
    </section>

    <section id="how" class="band">
      <div class="s-page s-stack" style="--s-gap: var(--s-8)">
        <header class="band__head">
          <p class="s-label">How it works</p>
          <h2 class="s-title">Four steps, one loop.</h2>
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
          <p class="s-label">Mastery</p>
          <h2 class="s-title">Signal, not streaks.</h2>
          <p class="signal__lead">
            Every Topic has a Mastery level from 0 to 4. Reading a Lesson gets you to 1. A clean
            Quiz gets you to 2 and powers the Topics behind it. Levels 3 and 4 need evidence: your
            agent raises them when you can explain the thing and its internals.
          </p>
        </div>
        <ol class="signal__scale" aria-label="Mastery levels">
          <li v-for="level in 5" :key="level">
            <UiMastery :level="level - 1" size="lg" />
            <span>{{ MASTERY_LABELS[level - 1] }}</span>
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
        <h2 class="s-title cta__title">Power up your first Topic.</h2>
        <div class="s-cluster">
          <UiButton variant="primary" size="lg" icon="github" :to="screenPath('onboarding')"
            >Sign in with GitHub</UiButton
          >
          <UiButton size="lg" href="https://github.com/startodel/startodel" icon-right="external"
            >Read the source</UiButton
          >
        </div>
      </div>
    </section>
  </ShowcaseSite>
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
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--s-copper-fill);
}
.hero__map {
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
