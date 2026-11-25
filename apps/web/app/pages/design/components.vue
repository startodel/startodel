<script setup lang="ts">
import type { TableColumn } from "../../components/ui/Table.vue";
import {
  sampleCode,
  sampleNav,
  sampleNavTracks,
  sampleTopics,
  sampleUser,
} from "../../components/showcase/sample";
definePageMeta({ middleware: "design" });
useHead({ title: "Design components" });
const sections = [
  { id: "actions", title: "Actions" },
  { id: "forms", title: "Forms" },
  { id: "status", title: "Status" },
  { id: "surfaces", title: "Surfaces" },
  { id: "feedback", title: "Feedback" },
  { id: "navigation", title: "Navigation" },
  { id: "data", title: "Data" },
  { id: "code", title: "Code and copy" },
  { id: "shell", title: "App shell" },
];
const { push: notify } = useToast();
const text = ref("PostgreSQL");
const empty = ref("");
const answer = ref(
  "A timer callback is queued as a task once its delay elapses. It runs only after the current task and all microtasks finish.",
);
const grade = ref("senior");
const goal = ref<string | null>("depth");
const stack = ref<string[]>(["TypeScript", "PostgreSQL"]);
const chips = ref(["TypeScript", "Vue", "PostgreSQL"]);
const tab = ref("lessons");
const segment = ref("board");
const modal = ref(false);
const collapsed = ref(true);
const sort = ref<{ key: string; dir: "asc" | "desc" } | undefined>({ key: "level", dir: "desc" });
type Topic = (typeof sampleTopics)[number];
const columns: TableColumn<Topic>[] = [
  { key: "id", label: "Ref", width: "4rem" },
  { key: "title", label: "Topic", sortable: true },
  { key: "level", label: "Mastery", sortable: true },
  { key: "lessons", label: "Lessons", align: "right", sortable: true },
  { key: "due", label: "Next review" },
];
const token = "stm_4f1c9a7be2d04c6f8a3b5d1e7c9f2a6b";
const prompt =
  "Use the Startodel MCP server. Read my Profile, then create a Track for my goal and write the first Lesson.";
</script>
<template>
  <ShowcaseDocs :sections="sections">
    <header class="intro">
      <p class="s-label intro__kicker">Startodel design system · Components</p>
      <h1 class="s-title intro__title">Components</h1>
      <p class="intro__lead">
        Every primitive in every state. Switch the theme in the bar above. Resize the window: parts
        respond to the space they are given, not to the screen.
      </p>
    </header>

    <ShowcaseSection id="actions" title="Actions" :index="1">
      <template #lead
        >One primary action per view. It is the only filled copper on the screen.</template
      >
      <ShowcaseSpecimen label="Button · variants">
        <UiButton variant="primary">Start grill</UiButton>
        <UiButton>Open track</UiButton>
        <UiButton variant="ghost">Skip</UiButton>
        <UiButton variant="danger">Revoke token</UiButton>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Button · sizes and icons">
        <UiButton size="sm" icon="plus">Small</UiButton>
        <UiButton icon="copy">Medium</UiButton>
        <UiButton size="lg" variant="primary" icon-right="arrow-right">Continue lesson</UiButton>
        <UiButton icon="copy" label="Copy" />
        <UiButton variant="ghost" icon="more" label="More" />
        <UiButton size="sm" variant="ghost" icon="x" label="Close" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Button · states">
        <UiButton variant="primary" loading>Saving</UiButton>
        <UiButton loading>Checking</UiButton>
        <UiButton variant="primary" disabled>Submit answer</UiButton>
        <UiButton disabled>Reveal solution</UiButton>
        <UiButton href="https://github.com/hmbanan666/startodel" icon="github" icon-right="external"
          >Link button</UiButton
        >
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Button · block" layout="stack">
        <UiButton variant="primary" size="lg" icon="github" block>Sign in with GitHub</UiButton>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Kbd" note="Keys that act on the current view">
        <span class="s-muted">Choose an option</span><UiKbd>1</UiKbd><UiKbd>2</UiKbd
        ><UiKbd>3</UiKbd>
        <span class="s-muted">Submit</span><UiKbd>Ctrl</UiKbd><UiKbd>Enter</UiKbd>
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="forms" title="Forms" :index="2">
      <template #lead
        >Labels sit above fields. Errors say what happened and how to fix it. Anything the learner
        writes at length is set in the reading face.</template
      >
      <ShowcaseSpecimen label="Field and Input" layout="grid">
        <UiField label="Stack" for="f-stack" hint="Languages and tools you use at work.">
          <UiInput id="f-stack" v-model="text" />
        </UiField>
        <UiField label="Search topics" for="f-search" optional>
          <UiInput id="f-search" v-model="empty" icon="search" placeholder="Event loop" />
        </UiField>
        <UiField
          label="Token name"
          for="f-error"
          error="Enter a name so you can tell tokens apart."
        >
          <UiInput id="f-error" v-model="empty" invalid />
        </UiField>
        <UiField label="Server URL" for="f-mono">
          <UiInput id="f-mono" model-value="https://startodel.ru/mcp" mono readonly />
        </UiField>
        <UiField label="Disabled" for="f-disabled">
          <UiInput id="f-disabled" model-value="Cannot be changed" disabled />
        </UiField>
        <UiField label="Large" for="f-lg">
          <UiInput id="f-lg" v-model="text" size="lg" />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Textarea" note="Answers are written in Literata" layout="stack">
        <UiField label="Your answer" for="f-answer" hint="Explain it as you would to a colleague.">
          <UiTextarea id="f-answer" v-model="answer" :rows="4" />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Select" layout="grid">
        <UiField label="Grade" for="f-grade">
          <UiSelect
            id="f-grade"
            v-model="grade"
            :options="[
              { value: 'middle', label: 'Middle' },
              { value: 'senior', label: 'Senior' },
              { value: 'staff', label: 'Staff' },
            ]"
          />
        </UiField>
        <UiField label="Small" for="f-grade-sm">
          <UiSelect
            id="f-grade-sm"
            v-model="grade"
            size="sm"
            :options="[
              { value: 'middle', label: 'Middle' },
              { value: 'senior', label: 'Senior' },
            ]"
          />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Choice chips · one" layout="stack">
        <UiChoiceChips
          v-model="goal"
          legend="Goal"
          name="goal"
          :options="[
            { value: 'depth', label: 'Go deeper in my stack' },
            { value: 'interview', label: 'Prepare for interviews' },
            { value: 'switch', label: 'Move to a new stack' },
          ]"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Choice chips · many" layout="stack">
        <UiChoiceChips
          v-model="stack"
          legend="Stack"
          name="stack"
          multiple
          :options="['TypeScript', 'Go', 'Rust', 'PostgreSQL', 'Kubernetes']"
        />
        <UiChoiceChips
          :model-value="['Go']"
          legend="Disabled"
          name="stack-disabled"
          multiple
          disabled
          :options="['TypeScript', 'Go', 'Rust']"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Chip">
        <UiChip
          v-for="chip in chips"
          :key="chip"
          removable
          @remove="chips = chips.filter((c) => c !== chip)"
          >{{ chip }}</UiChip
        >
        <UiChip tone="copper">senior</UiChip>
        <UiChip>read only</UiChip>
        <UiButton
          v-if="chips.length < 3"
          size="sm"
          variant="ghost"
          icon="plus"
          @click="chips = ['TypeScript', 'Vue', 'PostgreSQL']"
          >Reset</UiButton
        >
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="status" title="Status" :index="3">
      <template #lead>Every state has a shape and a word. Colour only repeats them.</template>
      <ShowcaseSpecimen label="Mastery · sizes" note="Signal strength, 0 to 4">
        <UiMastery v-for="n in 5" :key="n" :level="n - 1" size="sm" show="bars" />
        <span class="gap" />
        <UiMastery v-for="n in 5" :key="n" :level="n - 1" />
        <span class="gap" />
        <UiMastery :level="3" size="lg" show="full" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Verdict">
        <UiVerdict verdict="strong" /><UiVerdict verdict="partial" /><UiVerdict verdict="weak" />
        <UiVerdict verdict="pending" /><UiVerdict verdict="none" />
        <span class="gap" />
        <UiVerdict verdict="strong" size="sm" glyph-only /><UiVerdict
          verdict="partial"
          size="sm"
          glyph-only
        /><UiVerdict verdict="weak" size="sm" glyph-only />
        <span class="gap" />
        <UiVerdict verdict="strong" size="lg" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Badge · tones">
        <UiBadge>draft</UiBadge>
        <UiBadge tone="copper" pad>ready</UiBadge>
        <UiBadge tone="verdigris" icon="check">passed</UiBadge>
        <UiBadge tone="brass" icon="clock">due today</UiBadge>
        <UiBadge tone="oxide" icon="alert">revoked</UiBadge>
        <UiBadge tone="steel" icon="globe">public</UiBadge>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Badge · variants">
        <UiBadge variant="outline">theory</UiBadge>
        <UiBadge variant="outline" tone="copper">exercise</UiBadge>
        <UiBadge variant="outline" tone="oxide" icon="lock">blocked</UiBadge>
        <UiBadge variant="solid">v0.4</UiBadge>
        <UiBadge variant="solid" tone="copper">new</UiBadge>
        <UiBadge variant="solid" tone="verdigris">complete</UiBadge>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Progress" layout="stack">
        <UiProgress :value="58" label="Track progress" show-value />
        <UiProgress :value="7" :max="15" label="Questions answered" segmented show-value />
        <UiProgress :value="12" :max="12" label="Topics complete" tone="verdigris" show-value />
        <UiProgress :value="35" label="Lesson read" size="sm" tone="neutral" />
        <UiProgress :value="0" label="Not started" show-value />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Stat" note="Readouts sit in a description list" layout="block">
        <dl class="stats">
          <UiStat label="Topics complete" :value="7" unit="/ 12" live />
          <UiStat label="Due today" :value="4">2 overdue</UiStat>
          <UiStat label="Grills" :value="3" />
          <UiStat label="Strong answers" :value="68" unit="%" />
        </dl>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Pending, Skeleton, Avatar">
        <UiPending label="Waiting" />
        <div class="skeleton"><UiSkeleton :lines="3" /></div>
        <UiAvatar name="Alice Petrova" /><UiAvatar name="hmbanan666" :size="36" />
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="surfaces" title="Surfaces" :index="4">
      <template #lead
        >Cards are plates on the board. A live card carries a copper edge and marks the one thing to
        do next.</template
      >
      <ShowcaseSpecimen label="Card · variants" layout="grid">
        <UiCard
          ><strong>Default</strong>
          <p class="s-muted">A plate on the board.</p></UiCard
        >
        <UiCard variant="raised"
          ><strong>Raised</strong>
          <p class="s-muted">Lifts above its neighbours.</p></UiCard
        >
        <UiCard variant="sunken"
          ><strong>Sunken</strong>
          <p class="s-muted">A well for read-only content.</p></UiCard
        >
        <UiCard variant="outline"
          ><strong>Outline</strong>
          <p class="s-muted">A slot not filled yet.</p></UiCard
        >
        <UiCard variant="live" tag="Next up"
          ><strong>Live</strong>
          <p class="s-muted">The one thing to do next.</p></UiCard
        >
        <UiCard tag="T03" :to="{ hash: '#surfaces' }"
          ><strong>Link card</strong>
          <p class="s-muted">The whole plate is the target.</p></UiCard
        >
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Card · header and footer" layout="grid">
        <UiCard padding="md">
          <template #header
            ><span class="s-label">L02 · Lesson</span><span class="push" /><UiBadge
              tone="verdigris"
              icon="check"
              >read</UiBadge
            ></template
          >
          <p class="card-title">How narrowing follows control flow</p>
          <p class="s-muted">7 blocks · 12 min</p>
          <template #footer
            ><UiMastery :level="2" show="full" /><span class="push" /><UiButton
              size="sm"
              icon-right="arrow-right"
              >Open</UiButton
            ></template
          >
        </UiCard>
        <UiCard padding="none">
          <template #header><span class="s-label">Padding none</span></template>
          <UiProgress :value="40" label="Edge to edge" size="sm" />
          <p class="pad s-muted">For lists, tables and media.</p>
        </UiCard>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Section heading" note="A trace that ends in a pad" layout="stack">
        <UiSectionHeading title="Lessons" :count="4" />
        <UiSectionHeading title="Prerequisites" :level="3"
          ><UiButton size="sm" variant="ghost" icon="plus">Add</UiButton></UiSectionHeading
        >
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Page header · system voice" layout="block">
        <UiPageHeader
          title="Reviews"
          kicker="4 due today"
          description="Topics come back on a schedule. Each pass moves a Topic one Review Box up."
        >
          <template #actions
            ><UiButton variant="primary" icon="play">Start practice</UiButton></template
          >
        </UiPageHeader>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Page header · content voice"
        note="Titles written for the learner use the reading face"
        layout="block"
      >
        <UiPageHeader
          title="How narrowing follows control flow"
          kicker="T03 · L02 · Lesson"
          voice="content"
        >
          <template #meta
            ><UiMastery :level="2" show="full" /><UiBadge icon="clock">12 min</UiBadge></template
          >
          <template #actions><UiButton icon="track">Open track</UiButton></template>
        </UiPageHeader>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Empty state" layout="grid" flush>
        <UiEmptyState title="No tracks yet" icon="track">
          Connect your agent and ask it to build a Track for your goal.
          <template #actions
            ><UiButton variant="primary" icon="plug">Connect an agent</UiButton></template
          >
        </UiEmptyState>
        <UiEmptyState title="Nothing due today" icon="check" compact>
          Your next review is in 3 days.
        </UiEmptyState>
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="feedback" title="Feedback" :index="5">
      <template #lead
        >Notices stay in the page. Toasts confirm an action and leave. A dialog interrupts only for
        a decision that cannot be undone.</template
      >
      <ShowcaseSpecimen label="Notice" layout="stack">
        <UiNotice title="Waiting for your agent"
          >Paste the prompt into your agent. This page updates when the verdicts arrive.</UiNotice
        >
        <UiNotice tone="info" title="This Track is public"
          >Anyone with the link can read its Lessons.</UiNotice
        >
        <UiNotice tone="success" title="Topic complete"
          >Mastery 2 reached. Two Topics are now ready.</UiNotice
        >
        <UiNotice tone="warning" title="3 reviews are overdue">
          Review them today to keep their Review Box.
          <template #actions><UiButton size="sm">Review now</UiButton></template>
        </UiNotice>
        <UiNotice tone="danger" title="The answer was not saved"
          >Check your connection, then submit again.</UiNotice
        >
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Toast · tones" layout="stack">
        <UiToast title="Copied to clipboard" :dismissible="false" />
        <UiToast tone="success" title="Token created" text="Copy it now. It is shown once." />
        <UiToast tone="warning" title="Session expires in 5 minutes" />
        <UiToast tone="danger" title="Could not revoke the token" text="Try again." />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Toast · live">
        <UiButton
          @click="notify({ tone: 'success', title: 'Answer saved', text: 'Question 7 of 15' })"
          >Show success</UiButton
        >
        <UiButton @click="notify({ title: 'Copied to clipboard' })">Show neutral</UiButton>
        <UiButton
          @click="
            notify({
              tone: 'danger',
              title: 'Could not save',
              text: 'Check your connection.',
              timeout: 0,
            })
          "
          >Show sticky error</UiButton
        >
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Modal"
        note="Native dialog: focus is trapped and Escape closes it"
        layout="stack"
        surface="grid"
      >
        <UiModal title="Revoke this token?" size="sm" inline>
          <p>Agents that use “laptop” lose access at once. You cannot undo this.</p>
          <template #footer
            ><UiButton variant="ghost">Cancel</UiButton
            ><UiButton variant="danger">Revoke token</UiButton></template
          >
        </UiModal>
        <div><UiButton icon="external" @click="modal = true">Open the dialog</UiButton></div>
        <UiModal v-model:open="modal" title="Finish this grill?">
          <p>You answered 12 of 15 Questions. Unanswered Questions get no Verdict.</p>
          <template #footer
            ><UiButton variant="ghost" @click="modal = false">Keep answering</UiButton
            ><UiButton variant="primary" @click="modal = false">Finish grill</UiButton></template
          >
        </UiModal>
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="navigation" title="Navigation" :index="6">
      <ShowcaseSpecimen label="Tabs · line" layout="stack">
        <UiTabs
          v-model="tab"
          label="Topic sections"
          id-base="demo"
          :tabs="[
            { id: 'lessons', label: 'Lessons', count: 4 },
            { id: 'grills', label: 'Grills', count: 2 },
            { id: 'history', label: 'History' },
            { id: 'notes', label: 'Notes', disabled: true },
          ]"
        />
        <p
          :id="'demo-panel-' + tab"
          role="tabpanel"
          :aria-labelledby="'demo-tab-' + tab"
          class="s-muted"
        >
          Panel “{{ tab }}”. Arrow keys move between tabs.
        </p>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Tabs · segment">
        <UiTabs
          v-model="segment"
          label="Track view"
          variant="segment"
          id-base="view"
          :tabs="[
            { id: 'board', label: 'Board', icon: 'track' },
            { id: 'list', label: 'List', icon: 'menu' },
          ]"
        />
        <UiThemeToggle />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Breadcrumbs" note="A path, in the system voice">
        <UiBreadcrumbs
          :items="[
            { label: 'Tracks', to: { hash: '#navigation' } },
            {
              label: 'TypeScript internals',
              to: { hash: '#navigation' },
            },
            { label: 'T03 Control flow narrowing' },
          ]"
        />
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="data" title="Data" :index="7">
      <ShowcaseSpecimen label="Table" note="Click a header to sort" layout="block" flush>
        <UiTable
          v-model:sort="sort"
          :columns="columns"
          :rows="sampleTopics"
          :row-key="(r) => r.id"
          caption="Topics by Mastery"
        >
          <template #cell-id="{ row }"><span class="s-label">{{ row.id }}</span></template>
          <template #cell-title="{ row }"><strong>{{ row.title }}</strong></template>
          <template #cell-level="{ row }"><UiMastery :level="row.level" show="full" /></template>
          <template #cell-due="{ row }">
            <UiBadge v-if="row.due === 'today'" tone="brass" icon="clock">today</UiBadge>
            <span v-else-if="row.due">{{ row.due }}</span>
            <span v-else class="s-muted">not scheduled</span>
          </template>
        </UiTable>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Table · dense and empty" layout="block" flush>
        <UiTable :columns="columns" :rows="[]" :row-key="(r) => r.id" caption="No topics" dense>
          <template #empty>No Topics match this filter.</template>
        </UiTable>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Timeline" layout="block">
        <ol class="timeline">
          <UiTimelineItem
            kind="Grill"
            title="TypeScript internals · 15 questions"
            time="Today, 14:20"
            datetime="2026-11-25T14:20"
            icon="grill"
            tone="copper"
          >
            <span class="verdicts"
              ><UiVerdict verdict="strong" size="sm" /> 9
              <UiVerdict verdict="partial" size="sm" /> 4
              <UiVerdict verdict="weak" size="sm" /> 2</span
            >
          </UiTimelineItem>
          <UiTimelineItem
            kind="Mastery"
            title="Control flow narrowing reached level 2"
            time="Today, 11:02"
            icon="check"
            tone="verdigris"
          >
            <UiMastery :level="2" show="full" />
          </UiTimelineItem>
          <UiTimelineItem
            kind="Review"
            title="Structural typing moved to Review Box 4"
            time="Yesterday"
            icon="review"
          />
          <UiTimelineItem
            kind="Review"
            title="Variance returned to Review Box 0"
            time="22 Nov"
            icon="review"
            tone="oxide"
          />
          <UiTimelineItem
            kind="Lesson"
            title="Read “How narrowing follows control flow”"
            time="21 Nov"
          />
        </ol>
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="code" title="Code and copy" :index="8">
      <template #lead
        >Code is highlighted with the same metals as the interface. Tokens are rendered as text,
        never as markup.</template
      >
      <ShowcaseSpecimen label="Code block" layout="block">
        <UiCodeBlock :code="sampleCode" language="ts" title="event-loop.ts" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Code block · no title, no line numbers" layout="block">
        <UiCodeBlock
          code="pnpm install&#10;pnpm db:migrate&#10;pnpm dev"
          language="bash"
          :line-numbers="false"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Copy field" layout="stack">
        <UiCopyField label="MCP server URL" value="https://startodel.ru/mcp" />
        <UiCopyField
          label="MCP Token"
          :value="token"
          secret
          hint="Shown once. Store it in your agent’s configuration."
        />
        <UiCopyField label="Prompt for your agent" :value="prompt" multiline />
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="shell" title="App shell" :index="9">
      <template #lead
        >A rail on wide containers, a tab bar on narrow ones. The rail lists the product’s five
        places, then the learner’s Tracks with their progress. It collapses to icons to give the
        Track board more room.</template
      >
      <ShowcaseSpecimen label="Wide · rail open" layout="block" flush>
        <div class="frame">
          <UiAppShell
            :items="sampleNav"
            current="dashboard"
            :tracks="sampleNavTracks"
            current-track="ts"
            :user="sampleUser"
            :home="{ hash: '#shell' }"
            :crumbs="[{ label: 'Dashboard' }]"
          >
            <template #actions><UiThemeToggle /></template>
            <UiPageHeader title="Dashboard" kicker="Wednesday, 25 November" />
            <UiEmptyState title="Content area" compact>Screens are composed here.</UiEmptyState>
          </UiAppShell>
        </div>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Wide · rail collapsed" note="Dark theme scope" layout="block" flush>
        <div class="frame" data-theme="dark">
          <UiAppShell
            v-model:collapsed="collapsed"
            :items="sampleNav"
            current="reviews"
            :tracks="sampleNavTracks"
            :user="sampleUser"
            :home="{ hash: '#shell' }"
            :crumbs="[{ label: 'Reviews' }]"
          >
            <UiPageHeader title="Reviews" kicker="4 due today" />
            <UiEmptyState title="Content area" compact>Screens are composed here.</UiEmptyState>
          </UiAppShell>
        </div>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Narrow · tab bar" note="390px container" surface="grid">
        <div class="frame frame--phone">
          <UiAppShell
            :items="sampleNav"
            current="grills"
            :tracks="sampleNavTracks"
            :user="sampleUser"
            :home="{ hash: '#shell' }"
            :crumbs="[{ label: 'Grills' }]"
          >
            <UiPageHeader title="Grills" kicker="3 sessions" />
            <UiEmptyState title="Content area" compact>Screens are composed here.</UiEmptyState>
          </UiAppShell>
        </div>
        <div class="frame frame--phone" data-theme="dark">
          <UiAppShell
            :items="sampleNav"
            current="progress"
            :tracks="sampleNavTracks"
            :user="sampleUser"
            :home="{ hash: '#shell' }"
            :crumbs="[
              { label: 'Tracks', to: { hash: '#shell' } },
              { label: 'TypeScript internals' },
            ]"
          >
            <UiPageHeader title="Progress" kicker="7 of 12 topics" />
            <UiEmptyState title="Content area" compact>Screens are composed here.</UiEmptyState>
          </UiAppShell>
        </div>
      </ShowcaseSpecimen>
    </ShowcaseSection>
  </ShowcaseDocs>
</template>
<style scoped>
.intro {
  display: grid;
  gap: var(--s-3);
}
.intro__kicker {
  color: var(--s-copper);
}
.intro__title {
  font-size: var(--s-text-4xl);
}
.intro__lead {
  max-width: 64ch;
  font-size: var(--s-text-lg);
  color: var(--s-ink-2);
}
.gap {
  width: var(--s-4);
}
.push {
  margin-left: auto;
}
.pad {
  padding: var(--s-4);
}
.card-title {
  font: 500 var(--s-text-xl) / 1.25 var(--s-font-read);
  letter-spacing: -0.01em;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--s-6);
}
.skeleton {
  width: 14rem;
}
.timeline {
  list-style: none;
  max-width: 36rem;
}
.verdicts {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  font: 500 var(--s-text-sm) / 1 var(--s-font-mono);
  font-stretch: 75%;
}
.frame {
  --s-shell-height: 30rem;
  width: 100%;
  background: var(--s-bg);
  color: var(--s-ink);
}
.frame--phone {
  --s-shell-height: 40rem;
  width: 390px;
  max-width: 100%;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-lg);
  overflow: hidden;
  box-shadow: var(--s-shadow-3);
}
</style>
