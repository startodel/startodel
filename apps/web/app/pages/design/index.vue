<script setup lang="ts">
import { MASTERY_LABELS } from "@startodel/core";
import { iconNames } from "../../components/ui/icons";
import { colorGroups, spaceScale, typeScale } from "../../components/showcase/tokens";
definePageMeta({ middleware: "design" });
useHead({ title: "Design foundations" });
const sections = [
  { id: "concept", title: "Concept" },
  { id: "brand", title: "Brand" },
  { id: "colour", title: "Colour" },
  { id: "scales", title: "Mastery and Verdict" },
  { id: "type", title: "Typography" },
  { id: "shape", title: "Space and shape" },
  { id: "motion", title: "Motion" },
  { id: "icons", title: "Icons" },
];
const mastery = [
  "No evidence yet. Bars are outlined, never missing.",
  "Every Lesson in the Topic is read.",
  "Every Quiz passes. The Topic counts as complete.",
  "Explained in a Grill, assessed with evidence.",
  "Knows why it works that way.",
];
const verdicts = [
  ["strong", "A full pad"],
  ["partial", "A half pad"],
  ["weak", "A hollow pad"],
  ["pending", "Answered, not judged yet"],
  ["none", "Not answered"],
] as const;
const principles = [
  [
    "Signal over decoration",
    "Copper appears only where something is live: a primary action, progress, a completed Topic. A screen with no copper has nothing waiting for you.",
  ],
  [
    "Three voices",
    "Mono speaks for the system. Sans runs the controls. A serif carries everything you read or write.",
  ],
  [
    "Shape before colour",
    "Mastery is a bar count. A Verdict is a pad that is full, half or hollow. Colour repeats what the shape already says.",
  ],
  [
    "Cut, not moulded",
    "Hairlines, tight corners and hard edges. Nothing glows, blurs or floats without a reason.",
  ],
];
const replay = ref(0);
</script>
<template>
  <ShowcaseDocs :sections="sections">
    <header class="intro">
      <p class="s-label intro__kicker">Startodel design system · Concept “Signal”</p>
      <h1 class="s-display">Knowledge is a board. Bring it online.</h1>
      <p class="intro__lead s-read">
        A Track is drawn like a circuit: Topics are parts, prerequisites are traces. What you have
        learned carries signal and turns copper. What you have not is still tin. The interface is
        the instrument you read that board with.
      </p>
    </header>

    <ShowcaseSection id="concept" title="Concept" :index="1">
      <template #lead
        >Four rules decide most questions. The full rationale lives in
        <code class="s-mono">docs/design/CONCEPT.md</code>.</template
      >
      <ol class="principles">
        <li v-for="([title, text], i) in principles" :key="title">
          <span class="s-label">{{ String(i + 1).padStart(2, "0") }}</span>
          <h3>{{ title }}</h3>
          <p>{{ text }}</p>
        </li>
      </ol>
    </ShowcaseSection>

    <ShowcaseSection id="brand" title="Brand" :index="2">
      <template #lead
        >The mark is a trace in the shape of an S. It leaves a filled pad, the start, and arrives at
        an open via, the next thing to learn. The wordmark is set in Martian Mono,
        condensed.</template
      >
      <div class="marks">
        <div class="marks__cell" data-theme="light"><UiLogo :size="44" /></div>
        <div class="marks__cell" data-theme="dark"><UiLogo :size="44" /></div>
        <div class="marks__cell marks__cell--row">
          <UiLogo variant="tile" :size="72" /><UiLogo variant="tile" :size="32" /><UiLogo
            variant="tile"
            :size="16"
          />
          <UiLogo variant="mark" :size="72" /><UiLogo variant="mark" :size="32" /><UiLogo
            variant="mark"
            :size="16"
          />
        </div>
        <div class="marks__cell marks__cell--og">
          <img
            src="/brand/og.png"
            alt="Open Graph image"
            width="1200"
            height="630"
            loading="lazy"
          />
        </div>
      </div>
      <ul class="files">
        <li
          v-for="f in [
            'logo.svg',
            'logo-dark.svg',
            'mark.svg',
            'mark-dark.svg',
            'favicon.svg',
            'icon-maskable.svg',
            'apple-touch-icon.png',
            'og.png',
          ]"
          :key="f"
        >
          <a class="s-link s-mono" :href="'/brand/' + f">/brand/{{ f }}</a>
        </li>
        <li>
          <NuxtLinkLocale class="s-link s-mono" to="/design/og">/design/og</NuxtLinkLocale> renders
          the Open Graph template.
        </li>
      </ul>
    </ShowcaseSection>

    <ShowcaseSection id="colour" title="Colour" :index="3">
      <template #lead
        >Metals on a board. Each swatch shows the light value on the left and the dark value on the
        right. Both come from one <code class="s-mono">light-dark()</code> declaration.</template
      >
      <div v-for="group in colorGroups" :key="group.title" class="group">
        <div class="group__head">
          <h3 class="s-label">{{ group.title }}</h3>
          <p>{{ group.note }}</p>
        </div>
        <div class="swatches">
          <ShowcaseSwatch
            v-for="[token, role] in group.tokens"
            :key="token"
            :token="token"
            :role="role"
          />
        </div>
      </div>
    </ShowcaseSection>

    <ShowcaseSection id="scales" title="Mastery and Verdict" :index="4">
      <template #lead
        >Both scales read without colour. Mastery is a count of bars with a numeral. A Verdict is a
        pad with a word.</template
      >
      <div class="scale">
        <div v-for="(label, level) in MASTERY_LABELS" :key="level" class="scale__step">
          <span
            class="scale__chip"
            :style="{
              background: `var(--s-mastery-${level})`,
              color: `var(--s-on-mastery-${level})`,
            }"
            >{{ level }}</span
          >
          <UiMastery :level="level" size="lg" show="full" />
          <p>{{ mastery[level] }}</p>
        </div>
      </div>
      <div class="scale scale--verdict">
        <div v-for="[verdict, note] in verdicts" :key="verdict" class="scale__step">
          <UiVerdict :verdict="verdict" size="lg" />
          <p>{{ note }}</p>
        </div>
      </div>
    </ShowcaseSection>

    <ShowcaseSection id="type" title="Typography" :index="5">
      <template #lead
        >Three self-hosted variable families, each with Latin and Cyrillic. No request leaves the
        site to fetch a font.</template
      >
      <div class="voices">
        <article class="voice">
          <p class="s-label">System · Martian Mono, condensed</p>
          <p class="voice__sample voice__sample--mono">T07 · Mastery 3 of 4</p>
          <p class="voice__sample voice__sample--mono voice__sample--sm">Очередь микрозадач 0–4</p>
          <p class="voice__note">
            Page titles, labels, designators, readouts and code. Width 75 for interface, 87.5 for
            code.
          </p>
        </article>
        <article class="voice">
          <p class="s-label">Controls · Onest</p>
          <p class="voice__sample voice__sample--ui">Continue grill session</p>
          <p class="voice__sample voice__sample--ui voice__sample--sm">Подключите своего агента</p>
          <p class="voice__note">Buttons, forms, navigation, tables and short interface text.</p>
        </article>
        <article class="voice">
          <p class="s-label">Reading · Literata</p>
          <p class="voice__sample voice__sample--read">When does a timer run?</p>
          <p class="voice__sample voice__sample--read voice__sample--sm">
            <em>Браузер выполняет задачу до конца.</em>
          </p>
          <p class="voice__note">
            Lesson text, Track and Lesson titles, Grill Questions and the answers you write.
          </p>
        </article>
      </div>
      <ShowcaseSpecimen label="Type scale" layout="block">
        <table class="ramp">
          <tbody>
            <tr v-for="[name, size, use, voice] in typeScale" :key="name">
              <th class="s-mono">--s-text-{{ name }}</th>
              <td class="s-mono s-muted">{{ size }}</td>
              <td>
                <span
                  class="ramp__sample"
                  :class="'ramp__sample--' + voice"
                  :style="{ fontSize: `var(--s-text-${name})` }"
                  >{{ use }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Prose" note=".s-prose styles rendered Markdown" layout="block">
        <div class="s-prose">
          <h2>Tasks run to completion</h2>
          <p>
            A browser runs a task to completion. A timer callback must wait until the current task
            returns, <em>even if its delay has already elapsed</em>. See the
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model"
              >execution model</a
            >
            and try <code>setTimeout(fn, 0)</code> yourself.
          </p>
          <ul>
            <li>Synchronous code finishes first.</li>
            <li>Microtasks drain before the next task.</li>
          </ul>
          <blockquote>An expired timer queues a task. It does not interrupt one.</blockquote>
        </div>
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="shape" title="Space and shape" :index="6">
      <template #lead>A 4px pitch, tight corners and hard edges.</template>
      <ShowcaseSpecimen label="Space" note="--s-1 to --s-24" layout="block">
        <ul class="space">
          <li v-for="n in spaceScale" :key="n">
            <span class="s-mono">--s-{{ n }}</span>
            <i :style="{ width: `var(--s-${n})` }" />
            <span class="s-mono s-muted">{{ n * 4 }}px</span>
          </li>
        </ul>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Radius">
        <div
          v-for="r in ['xs', 'sm', 'md', 'lg']"
          :key="r"
          class="tile"
          :style="{ borderRadius: `var(--s-radius-${r})` }"
        >
          <span class="s-mono">{{ r }}</span>
        </div>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Elevation"
        note="Light surfaces print a hard edge. Dark surfaces rely on their outline."
      >
        <div
          v-for="n in [1, 2, 3]"
          :key="n"
          class="tile tile--raised"
          :style="{ boxShadow: `var(--s-shadow-${n})` }"
        >
          <span class="s-mono">shadow-{{ n }}</span>
        </div>
        <div
          class="tile tile--raised"
          :style="{ boxShadow: 'var(--s-glow)', borderColor: 'var(--s-copper-fill)' }"
        >
          <span class="s-mono">glow</span>
        </div>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Board grid"
        note=".s-grid, behind the Track board and empty states only"
        surface="grid"
      >
        <div class="tile tile--raised"><span class="s-mono">16px</span></div>
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="motion" title="Motion" :index="7">
      <template #lead
        >Short and mechanical. Durations collapse to zero when the system asks for reduced
        motion.</template
      >
      <ShowcaseSpecimen label="Durations" layout="stack">
        <div><UiButton size="sm" icon="play" @click="replay++">Replay</UiButton></div>
        <ul :key="replay" class="motion">
          <li
            v-for="[token, use] in [
              ['dur-1', '120ms · hover, press'],
              ['dur-2', '200ms · tabs, toggles'],
              ['dur-3', '320ms · dialogs, progress'],
            ]"
            :key="token"
          >
            <span class="s-mono">--s-{{ token }}</span>
            <span class="motion__track"
              ><i :style="{ animationDuration: `var(--s-${token})` }"
            /></span>
            <span class="s-muted">{{ use }}</span>
          </li>
        </ul>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Pending" note="Three pads light in turn while the system waits">
        <UiPending label="Loading" /><span class="s-muted">Waiting for your agent</span>
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="icons" title="Icons" :index="8">
      <template #lead
        >Drawn for this system on a 16px grid with a 1.5px stroke, like schematic symbols. No icon
        font and no emoji.</template
      >
      <ul class="icons">
        <li v-for="name in iconNames" :key="name">
          <UiIcon :name="name" :size="20" /><span class="s-mono">{{ name }}</span>
        </li>
      </ul>
    </ShowcaseSection>
  </ShowcaseDocs>
</template>
<style scoped>
.intro {
  container-type: inline-size;
  display: grid;
  gap: var(--s-5);
  max-width: 60rem;
}
.intro__kicker {
  color: var(--s-copper);
}
.intro__lead {
  max-width: 62ch;
  color: var(--s-ink-2);
}
.principles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: var(--s-6);
  list-style: none;
}
.principles li {
  display: grid;
  gap: var(--s-2);
  align-content: start;
  padding-top: var(--s-3);
  border-top: 2px solid var(--s-copper-fill);
}
.principles h3 {
  font-size: var(--s-text-lg);
  font-weight: 600;
}
.principles p {
  color: var(--s-ink-2);
}
.marks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: var(--s-4);
}
.marks__cell {
  display: grid;
  place-items: center;
  min-height: 11rem;
  padding: var(--s-6);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-bg);
}
.marks__cell--row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--s-5);
}
.marks__cell--og {
  padding: 0;
  overflow: hidden;
}
.marks__cell--og img {
  width: 100%;
  height: auto;
}
.files {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-5);
  list-style: none;
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.group {
  display: grid;
  gap: var(--s-4);
}
.group__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-1) var(--s-4);
}
.group__head h3 {
  color: var(--s-ink);
}
.group__head p {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: var(--s-5) var(--s-4);
}
.scale {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: var(--s-4);
}
.scale--verdict {
  grid-template-columns: repeat(auto-fit, minmax(12.5rem, 1fr));
}
.scale__step {
  display: grid;
  gap: var(--s-3);
  align-content: start;
  justify-items: start;
  padding: var(--s-4);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.scale__step p {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.scale__chip {
  display: grid;
  place-items: center;
  width: 100%;
  height: 3rem;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  font: 600 var(--s-text-xl) / 1 var(--s-font-mono);
  font-stretch: 75%;
}
.voices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: var(--s-4);
}
.voice {
  display: grid;
  gap: var(--s-3);
  align-content: start;
  padding: var(--s-5);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.voice__sample {
  font-size: var(--s-text-3xl);
  line-height: 1.1;
  overflow-wrap: anywhere;
}
.voice__sample--sm {
  font-size: var(--s-text-xl);
  color: var(--s-ink-2);
}
.voice__sample--mono {
  font-family: var(--s-font-mono);
  font-stretch: 75%;
  font-weight: 600;
  letter-spacing: -0.035em;
}
.voice__sample--ui {
  font-weight: 600;
  letter-spacing: -0.02em;
}
.voice__sample--read {
  font-family: var(--s-font-read);
  font-weight: 500;
  letter-spacing: -0.02em;
}
.voice__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.ramp {
  width: 100%;
  border-collapse: collapse;
}
.ramp :is(th, td) {
  padding: var(--s-2) var(--s-4) var(--s-2) 0;
  border-bottom: 1px solid var(--s-line);
  text-align: left;
  vertical-align: baseline;
  font-weight: 400;
  white-space: nowrap;
}
.ramp td:last-child {
  width: 100%;
  white-space: normal;
}
.ramp__sample {
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.ramp__sample--mono {
  font-family: var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.03em;
}
.ramp__sample--read {
  font-family: var(--s-font-read);
  font-weight: 500;
}
.space {
  display: grid;
  gap: var(--s-2);
  list-style: none;
}
.space li {
  display: grid;
  grid-template-columns: 4rem 6.5rem auto;
  align-items: center;
  gap: var(--s-4);
}
.space i {
  height: 0.75rem;
  background: var(--s-copper-fill);
}
.tile {
  display: grid;
  place-items: center;
  width: 6.5rem;
  height: 4.5rem;
  border: 1px solid var(--s-line-strong);
  background: var(--s-surface);
}
.tile--raised {
  border-color: var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
}
.motion {
  display: grid;
  gap: var(--s-3);
  width: 100%;
  list-style: none;
}
.motion li {
  display: grid;
  grid-template-columns: 5rem minmax(4rem, 14rem) auto;
  align-items: center;
  gap: var(--s-4);
  font-size: var(--s-text-sm);
}
.motion__track {
  height: 2px;
  background: var(--s-line);
}
.motion__track i {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--s-copper-fill);
  transform-origin: left;
  animation: motion-run var(--s-dur-2) var(--s-ease) both;
}
@keyframes motion-run {
  from {
    scale: 0 1;
  }
}
.icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  gap: 1px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-line);
  list-style: none;
  overflow: hidden;
}
.icons li {
  display: grid;
  justify-items: center;
  gap: var(--s-2);
  padding: var(--s-4) var(--s-2);
  background: var(--s-bg);
  font-size: var(--s-text-xs);
  color: var(--s-ink-3);
}
.icons li .s-icon {
  color: var(--s-ink);
}
</style>
