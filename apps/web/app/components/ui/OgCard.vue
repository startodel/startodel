<script setup lang="ts">
/** The 1200 by 630 Open Graph card. /design/og renders it for capture. */
withDefaults(defineProps<{ title?: string; kicker?: string; footer?: string }>(), {
  title: "Learn it down to the internals.",
  kicker: "Open source · Bring your own agent",
  footer: "startodel.ru",
});
const W = 132;
const H = 60;
const nodes = [
  { id: "T01", x: 36, y: 118, level: 4 },
  { id: "T02", x: 36, y: 352, level: 3 },
  { id: "T03", x: 236, y: 208, level: 2 },
  { id: "T04", x: 236, y: 442, level: 1 },
  { id: "T05", x: 436, y: 325, level: 0 },
];
const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
const traces = (
  [
    ["T01", "T03"],
    ["T02", "T03"],
    ["T02", "T04"],
    ["T03", "T05"],
    ["T04", "T05"],
  ] as const
).map(([from, to]) => {
  const [a, b] = [by[from]!, by[to]!];
  const [x1, y1, x2, y2] = [a.x + W, a.y + H / 2, b.x, b.y + H / 2];
  const mid = (x1 + x2) / 2;
  const c = 12 * Math.sign(y2 - y1);
  return {
    d: `M${x1} ${y1}H${mid - 12}L${mid} ${y1 + c}V${y2 - c}L${mid + 12} ${y2}H${x2}`,
    live: a.level >= 2,
    x1,
    y1,
    x2,
    y2,
  };
});
</script>
<template>
  <div class="s-og s-root s-grid" data-theme="dark">
    <div class="s-og__copy">
      <UiLogo :size="44" />
      <div class="s-og__text">
        <p class="s-og__kicker">{{ kicker }}</p>
        <p class="s-og__title">{{ title }}</p>
      </div>
      <p class="s-og__footer">
        <span>{{ footer }}</span>
        <span class="s-og__scale"
          ><UiMastery v-for="n in 5" :key="n" :level="n - 1" show="bars" size="lg"
        /></span>
      </p>
    </div>
    <svg class="s-og__board" viewBox="0 0 640 630" aria-hidden="true">
      <path
        v-for="t in traces"
        :key="t.d"
        :d="t.d"
        fill="none"
        :class="t.live ? 's-og__trace--live' : 's-og__trace'"
      />
      <g v-for="n in nodes" :key="n.id" :transform="`translate(${n.x} ${n.y})`">
        <rect
          :width="W"
          :height="H"
          rx="6"
          class="s-og__node"
          :class="{ 'is-live': n.level >= 2, 'is-full': n.level === 4 }"
        />
        <text x="12" y="22" class="s-og__id" :class="{ 'is-full': n.level === 4 }">{{ n.id }}</text>
        <rect
          v-for="b in 4"
          :key="b"
          :x="78 + b * 9"
          :y="24 - b * 4"
          width="5"
          :height="b * 4"
          rx="0.5"
          class="s-og__bar"
          :class="{ 'is-on': b <= n.level, 'is-full': n.level === 4 }"
        />
        <rect
          x="12"
          y="36"
          :width="50 + ((n.x + n.y) % 44)"
          height="6"
          rx="1"
          class="s-og__line"
          :class="{ 'is-full': n.level === 4 }"
        />
      </g>
      <template v-for="t in traces" :key="'p' + t.d">
        <circle :cx="t.x1" :cy="t.y1" r="4.5" class="s-og__pad" :class="{ 'is-live': t.live }" />
        <circle :cx="t.x2" :cy="t.y2" r="4.5" class="s-og__pad" :class="{ 'is-live': t.live }" />
      </template>
    </svg>
  </div>
</template>
<style scoped>
.s-og {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 560px;
  width: 1200px;
  height: 630px;
  overflow: hidden;
  background-color: var(--s-bg);
  color: var(--s-ink);
}
.s-og__copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 64px 0 60px 72px;
}
.s-og__text {
  display: grid;
  gap: 22px;
}
.s-og__kicker {
  font: 500 19px / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-copper);
}
.s-og__title {
  font: 600 84px / 0.98 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.045em;
  text-wrap: balance;
}
.s-og__footer {
  display: flex;
  align-items: flex-end;
  gap: 32px;
  font: 500 22px / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
.s-og__scale {
  display: inline-flex;
  gap: 18px;
}
.s-og__board {
  width: 640px;
  height: 630px;
  margin-left: -40px;
}
.s-og__trace,
.s-og__trace--live {
  stroke: var(--s-line-strong);
  stroke-width: 2;
  stroke-dasharray: 3 7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.s-og__trace--live {
  stroke: var(--s-copper-fill);
  stroke-width: 3;
  stroke-dasharray: none;
}
.s-og__pad {
  fill: var(--s-bg);
  stroke: var(--s-line-strong);
  stroke-width: 1.5;
}
.s-og__pad.is-live {
  fill: var(--s-copper-fill);
  stroke: var(--s-bg);
}
.s-og__node {
  fill: var(--s-raised);
  stroke: var(--s-line-strong);
  stroke-width: 1.5;
}
.s-og__node.is-live {
  stroke: var(--s-copper-fill);
}
.s-og__node.is-full {
  fill: var(--s-copper-fill);
}
.s-og__id {
  font: 500 13px var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  fill: var(--s-ink-3);
}
.s-og__bar {
  fill: none;
  stroke: var(--s-line-strong);
}
.s-og__bar.is-on {
  fill: var(--s-copper-fill);
  stroke: none;
}
.s-og__line {
  fill: var(--s-line-strong);
}
.s-og :is(.s-og__id, .s-og__line, .s-og__bar.is-on).is-full {
  fill: var(--s-on-copper);
}
.s-og__bar.is-full {
  stroke: none;
}
</style>
