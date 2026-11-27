<script setup lang="ts">
import type { TableColumn } from "../../components/ui/Table.vue";
import type { QuizResult } from "../../components/ui/Quiz.vue";
import { topicStates } from "../../components/ui/board";
import {
  type SampleBlock,
  sampleBoxes,
  sampleCode,
  sampleEdges,
  sampleLesson,
  sampleMasteryCounts,
  sampleNav,
  sampleNavTracks,
  sampleQuestions,
  sampleReviews,
  sampleTopicLessons,
  sampleTopics,
  sampleTracks,
  sampleUser,
  sampleWeek,
  screenPath,
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
  { id: "board", title: "Track board" },
  { id: "lesson", title: "Lesson" },
  { id: "grill", title: "Grill and review" },
  { id: "public", title: "Progress and public" },
];
const { push: notify } = useToast();
const text = ref("PostgreSQL");
const empty = ref("");
const answer = ref(
  "A timer callback is queued as a task once its delay elapses. It runs only after the current task and all microtasks finish.",
);
const grade = ref("senior");
const none = ref<string>();
const grades = [
  { value: "middle", label: "Middle" },
  { value: "senior", label: "Senior" },
  { value: "staff", label: "Staff" },
];
const gradeCards = [
  {
    value: "middle",
    label: "Middle",
    hint: "Three to five years. Knows the stack, not yet its edges.",
  },
  {
    value: "senior",
    label: "Senior",
    hint: "Owns systems. Wants the internals and the trade-offs.",
  },
  { value: "staff", label: "Staff", hint: "Works across teams. Wants breadth and judgment." },
];
const languages = ["TypeScript", "Go", "Rust", "Python", "Kotlin", "Elixir", "C#"];
const language = ref("Go");
const noLanguage = ref<string>();
const agreed = ref(true);
const publicTrack = ref(true);
const goal = ref<string | null>("depth");
const stack = ref<string[]>(["TypeScript", "PostgreSQL"]);
const chips = ref(["TypeScript", "Vue", "PostgreSQL"]);
const tab = ref("lessons");
const segment = ref<"board" | "list">("board");
const page = ref(3);
const modal = ref(false);
const collapsed = ref(true);
const sort = ref<{ key: string; dir: "asc" | "desc" } | undefined>({ key: "level", dir: "desc" });
type Topic = (typeof sampleTopics)[number];
const tableRows = sampleTopics.slice(0, 6);
const columns: TableColumn<Topic>[] = [
  { key: "tag", label: "Ref", width: "4rem" },
  { key: "title", label: "Topic", sortable: true },
  { key: "level", label: "Mastery", sortable: true },
  { key: "lessons", label: "Lessons", align: "right", sortable: true },
  { key: "due", label: "Next review" },
];
const step = ref("goals");
const steps = [
  { id: "stack", label: "Stack", hint: "What you work with" },
  { id: "goals", label: "Goals", hint: "What you want next" },
  { id: "grade", label: "Grade", hint: "Where you stand" },
];
const hintOpen = ref(true);

const boardTopics = sampleTopics.slice(0, 8);
const boardIds = new Set(boardTopics.map((t) => t.id));
const boardEdges = sampleEdges.filter((e) => boardIds.has(e.from) && boardIds.has(e.to));
const states = topicStates(sampleTopics, sampleEdges);
const selectedTopic = ref<string | undefined>("t04");
const partOf = (level: number) => sampleTopics.find((t) => t.level === level)!;
const blockedTopic = sampleTopics.find((t) => states.get(t.id) === "blocked")!;
const readyTopic = sampleTopics.find((t) => states.get(t.id) === "ready")!;

function blockOf<K extends SampleBlock["type"]>(type: K) {
  return sampleLesson.blocks.find((b) => b.type === type) as Extract<SampleBlock, { type: K }>;
}
const quiz = blockOf("quiz");
const exercise = blockOf("exercise");
const { title: linkTitle, url: linkUrl, note: linkNote } = blockOf("link");
const linkBlock = { title: linkTitle, url: linkUrl, note: linkNote };
const { title: videoTitle, url: videoUrl, note: videoNote } = blockOf("video");
const videoBlock = { title: videoTitle, url: videoUrl, note: videoNote };
const theoryMarkdown = blockOf("theory").markdown;
const calloutMarkdown = blockOf("callout").markdown;
const quizQuestions = quiz.questions;
const {
  id: exerciseId,
  prompt: exercisePrompt,
  hints: exerciseHints,
  solution: exerciseSolution,
} = exercise;
const grillPrompt = sampleQuestions[10]!.prompt;
const reviewCards = sampleReviews.slice(0, 2);
const boxCounts = sampleBoxes.map((b) => b.count);
const quizOpen = ref<(number | undefined)[]>([1]);
const quizDone = ref<(number | undefined)[]>(quiz.questions.map((q, i) => (i ? 0 : q.correct)));
const quizResult: QuizResult = {
  perQuestion: quiz.questions.map((q, i) => quizDone.value[i] === q.correct),
  feedback: quiz.questions.map((q) => ({ correctIndex: q.correct, explanation: q.explanation })),
};
const solution = ref<string>();
const lessons = sampleTopicLessons.map((l, i) => ({
  id: l.tag,
  title: l.title,
  blocks: l.blocks,
  minutes: l.minutes,
  read: i < 2,
  to: screenPath("lesson"),
}));

const pads = sampleQuestions.map((q, i) => ({
  id: q.tag,
  state: i < 9 ? q.verdict : i === 9 ? ("pending" as const) : ("none" as const),
}));
const pad = ref(5);
const draft = ref("");
const week = sampleWeek.map((d) => ({
  label: d.day,
  date: String(d.date),
  count: d.count,
  today: d.today,
}));
const forked = ref(false);

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
        <UiButton href="https://github.com/startodel/startodel" icon="github" icon-right="external"
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
      <ShowcaseSpecimen
        label="Field and Input"
        note="A Field wires its label, hint and error to the control inside it"
        layout="grid"
      >
        <UiField label="Stack" hint="Languages and tools you use at work.">
          <UiInput v-model="text" />
        </UiField>
        <UiField label="Search topics" optional>
          <UiInput v-model="empty" type="search" icon="search" placeholder="Event loop" />
        </UiField>
        <UiField label="Token name" error="Enter a name so you can tell tokens apart.">
          <UiInput v-model="empty" placeholder="Laptop" />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Input · states" layout="grid">
        <UiField label="Empty" hint="The placeholder is an example, never the label.">
          <UiInput v-model="empty" placeholder="TypeScript, Go, Rust" />
        </UiField>
        <UiField label="Filled">
          <UiInput v-model="text" />
        </UiField>
        <UiField label="Invalid, filled" error="A Track with this Track Slug already exists.">
          <UiInput model-value="postgres-internals" mono />
        </UiField>
        <UiField label="Read only" hint="Can be selected and copied.">
          <UiInput model-value="https://startodel.ru/mcp" mono readonly />
        </UiField>
        <UiField label="Disabled" hint="Set by GitHub.">
          <UiInput model-value="alice" disabled />
        </UiField>
        <UiField label="Disabled, empty">
          <UiInput model-value="" placeholder="Not available yet" disabled />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Input · sizes" layout="grid">
        <UiField label="Small">
          <UiInput v-model="text" size="sm" icon="search" />
        </UiField>
        <UiField label="Medium">
          <UiInput v-model="text" icon="search" />
        </UiField>
        <UiField label="Large">
          <UiInput v-model="text" size="lg" icon="search" />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Input · icon and trailing action"
        note="A click on the icon or the padding lands in the field"
        layout="grid"
      >
        <UiField label="Server URL">
          <UiInput model-value="https://startodel.ru/mcp" icon="link" mono readonly>
            <template #trailing>
              <UiButton size="sm" variant="ghost" icon="copy" label="Copy" />
            </template>
          </UiInput>
        </UiField>
        <UiField label="Add a technology" hint="Enter or a comma adds it.">
          <UiTagInput placeholder="Elixir" @add="notify({ title: 'Added ' + $event.join(', ') })" />
        </UiField>
        <UiField label="Filter" error="Nothing matches. Try a shorter word.">
          <UiInput model-value="evnt loop" icon="search">
            <template #trailing>
              <UiButton size="sm" variant="ghost" icon="x" label="Clear" />
            </template>
          </UiInput>
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Field · long label and long error"
        note="Text wraps. The control never moves sideways"
        layout="grid"
      >
        <UiField
          label="The name other people will see on your Public Profile"
          optional
          hint="Up to 60 characters. Shown next to every Public Track you publish, so pick one you are comfortable with."
        >
          <UiInput v-model="text" />
        </UiField>
        <UiField
          label="Track Slug"
          error="Use lowercase Latin letters, digits and hyphens only. The address must start with a letter and be at most 60 characters long."
        >
          <UiInput model-value="Postgres Internals!" mono />
        </UiField>
        <UiField label="Without a note">
          <UiInput v-model="text" />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Form row"
        note="Fields with and without notes share a baseline"
        layout="block"
      >
        <form class="s-form-row" @submit.prevent>
          <UiField label="Token name" hint="For example, the machine it lives on.">
            <UiInput v-model="text" name="token-name" autocomplete="off" />
          </UiField>
          <UiField label="Grade">
            <UiSelect v-model="grade" :options="grades" />
          </UiField>
          <UiButton class="s-form-row__action" variant="primary" icon="plus">Create token</UiButton>
        </form>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Textarea" note="Answers are written in Literata" layout="grid">
        <UiField label="Your answer" hint="Explain it as you would to a colleague.">
          <UiTextarea v-model="answer" :rows="4" />
        </UiField>
        <UiField label="Empty">
          <UiTextarea v-model="empty" :rows="4" placeholder="Start with the short version." />
        </UiField>
        <UiField label="Invalid" error="Write an answer before you submit.">
          <UiTextarea v-model="empty" :rows="4" />
        </UiField>
        <UiField label="Read only" hint="Submitted answers cannot be edited.">
          <UiTextarea :model-value="answer" :rows="4" readonly />
        </UiField>
        <UiField label="Disabled">
          <UiTextarea :model-value="answer" :rows="4" disabled />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Select" note="Typeahead, arrow keys, Home and End" layout="grid">
        <UiField label="Grade" hint="Sets the depth of new Lessons.">
          <UiSelect v-model="grade" :options="grades" />
        </UiField>
        <UiField label="Nothing chosen">
          <UiSelect v-model="none" :options="grades" placeholder="Choose a grade" />
        </UiField>
        <UiField label="Invalid" error="Choose a grade to continue.">
          <UiSelect v-model="none" :options="grades" placeholder="Choose a grade" />
        </UiField>
        <UiField label="Disabled">
          <UiSelect v-model="grade" :options="grades" disabled />
        </UiField>
        <UiField label="Small">
          <UiSelect v-model="grade" size="sm" :options="grades" />
        </UiField>
        <UiField label="Large">
          <UiSelect v-model="grade" size="lg" :options="grades" />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Combobox" note="Filters as you type" layout="grid">
        <UiField label="Main language" hint="Pick one or type to filter.">
          <UiCombobox v-model="language" :options="languages" placeholder="TypeScript" />
        </UiField>
        <UiField label="Invalid" error="Choose a language from the list.">
          <UiCombobox v-model="noLanguage" :options="languages" placeholder="TypeScript" />
        </UiField>
        <UiField label="Disabled">
          <UiCombobox v-model="language" :options="languages" disabled />
        </UiField>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Checkbox, Switch" layout="grid">
        <div class="s-stack">
          <UiCheckbox v-model="agreed">I accept the terms for Public Tracks</UiCheckbox>
          <UiCheckbox :model-value="false" invalid>Required and not ticked</UiCheckbox>
          <UiCheckbox :model-value="true" disabled>Ticked and disabled</UiCheckbox>
          <UiCheckbox :model-value="false" disabled>Disabled</UiCheckbox>
        </div>
        <div class="s-stack">
          <UiSwitch v-model="publicTrack">Public Track</UiSwitch>
          <UiSwitch :model-value="false">Show my Public Profile</UiSwitch>
          <UiSwitch :model-value="true" disabled>Disabled, on</UiSwitch>
        </div>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Radio group" layout="grid">
        <UiRadioGroup v-model="grade" label="Grade" :options="grades" />
        <UiRadioGroup v-model="grade" label="Grade" variant="cards" :options="gradeCards" />
        <UiRadioGroup v-model="grade" label="Grade" :options="grades" disabled />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Form error summary"
        note="Shown above a form after a failed submit. Each line jumps to its field"
        layout="stack"
      >
        <UiFormErrors
          :errors="[
            { field: 'f-summary-name', message: 'Enter a name so you can tell tokens apart.' },
            { field: 'f-summary-grade', message: 'Choose a grade to continue.' },
          ]"
        />
        <div class="s-columns">
          <UiField
            label="Token name"
            for="f-summary-name"
            error="Enter a name so you can tell tokens apart."
          >
            <UiInput v-model="empty" />
          </UiField>
          <UiField label="Grade" for="f-summary-grade" error="Choose a grade to continue.">
            <UiSelect v-model="none" :options="grades" placeholder="Choose a grade" />
          </UiField>
        </div>
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
          description="Topics come back on a schedule. A correct answer moves a Topic to a longer interval."
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
          Review these Topics today.
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
        note="Focus is trapped, Escape closes it and focus returns to the trigger"
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
      <ShowcaseSpecimen label="Tooltip" note="On hover and on keyboard focus">
        <UiTooltip text="Copy the prompt"><UiButton icon="copy" label="Copy" /></UiTooltip>
        <UiTooltip text="Submit the answer" kbd="Ctrl Enter" side="right"
          ><UiButton variant="primary">Submit</UiButton></UiTooltip
        >
        <UiTooltip text="Mastery 2 of 4: you can apply it" side="bottom"
          ><button type="button" class="plain"><UiMastery :level="2" /></button
        ></UiTooltip>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Popover" note="Detail that would crowd the page">
        <UiPopover title="Your agent starts a Grill" align="start">
          <template #trigger><UiButton icon="plus">New Grill</UiButton></template>
          <div class="s-stack" style="--s-gap: var(--s-3)">
            <p>Startodel has no model of its own. Ask your agent to open a GrillSession.</p>
            <UiAgentPrompt
              compact
              text="Start a GrillSession of 15 questions on my Track Node.js runtime internals."
              tool="start_grill"
            />
          </div>
        </UiPopover>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Collapsible" layout="stack">
        <UiCollapsible v-model:open="hintOpen" title="Hint 1" icon="info">
          <p>Measure the gap between the tick you asked for and the tick you got.</p>
        </UiCollapsible>
        <UiCollapsible title="T04 · Timers and scheduling">
          <template #meta>3 Lessons</template>
          <UiLessonList :lessons="lessons" />
        </UiCollapsible>
        <UiCollapsible title="Solution" icon="lock" disabled>
          <p>Hidden until you ask.</p>
        </UiCollapsible>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Skeleton list"
        note="Match the shape of what will arrive"
        layout="grid"
      >
        <UiSkeletonList :rows="3" label="Loading Tracks" />
        <UiSkeletonList variant="cards" :rows="2" label="Loading Public Tracks" />
        <UiSkeletonList variant="table" :rows="4" label="Loading reviews" />
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="navigation" title="Navigation" :index="6">
      <ShowcaseSpecimen label="Tabs" note="Arrow keys move between tabs" layout="stack">
        <UiTabs
          v-model="tab"
          label="Topic sections"
          :tabs="[
            { id: 'lessons', label: 'Lessons', count: 4 },
            { id: 'grills', label: 'Grills', count: 2 },
            { id: 'history', label: 'History' },
            { id: 'notes', label: 'Notes', disabled: true },
          ]"
        >
          <template #lessons><p class="s-muted">Four Lessons, two read.</p></template>
          <template #grills
            ><p class="s-muted">Two Grills, the last one 9 strong of 15.</p></template
          >
          <template #history
            ><p class="s-muted">Every change of Mastery, newest first.</p></template
          >
        </UiTabs>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Segmented" note="A view switch with no panels">
        <UiSegmented
          v-model="segment"
          label="Track view"
          :options="[
            { id: 'board', label: 'Board', icon: 'track' },
            { id: 'list', label: 'List', icon: 'list' },
          ]"
        />
        <UiThemeToggle />
        <UiLanguageSwitcher variant="inline" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Menu" note="Opens on click, Enter or the down arrow">
        <UiMenu
          label="Track"
          align="start"
          :items="[
            { id: 'publish', label: 'Publish', icon: 'globe' },
            { id: 'copy', label: 'Copy link', icon: 'link', hint: 'L' },
            { id: 'archive', label: 'Archive', icon: 'box', disabled: true },
            { id: 'delete', label: 'Delete Track', icon: 'trash', danger: true, separated: true },
          ]"
          @select="notify({ title: 'Menu: ' + $event })"
        >
          <UiButton icon="more">Track actions</UiButton>
        </UiMenu>
        <UiLanguageSwitcher />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Pagination" layout="stack">
        <UiPagination v-model:page="page" :total="240" :per-page="20" label="Forks" />
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
      <ShowcaseSpecimen
        label="Stepper"
        note="Completed steps can be revisited. Steps ahead cannot be pressed"
        layout="stack"
      >
        <UiStepper v-model="step" :steps="steps" label="Onboarding steps" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Site header · signed out and signed in" layout="block" flush>
        <UiSiteHeader
          :home="{ hash: '#navigation' }"
          sign-in="#navigation"
          :dashboard="{ hash: '#navigation' }"
          :links="[
            { label: 'How it works', to: { hash: '#navigation' } },
            { label: 'Public Tracks', to: { hash: '#navigation' } },
            { label: 'GitHub', href: 'https://github.com/startodel/startodel' },
          ]"
        />
        <UiSiteHeader
          :home="{ hash: '#navigation' }"
          sign-in="#navigation"
          :dashboard="{ hash: '#navigation' }"
          :user="{ name: 'Alice Petrova', login: 'alice' }"
          :links="[{ label: 'Public Tracks', to: { hash: '#navigation' } }]"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Footer" layout="block" flush>
        <UiFooter
          :links="[
            { label: 'Terms of Use', to: { hash: '#navigation' } },
            { label: 'Publishing rules', to: { hash: '#navigation' } },
            { label: 'Source', href: 'https://github.com/startodel/startodel' },
          ]"
        />
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="data" title="Data" :index="7">
      <ShowcaseSpecimen label="Table" note="Click a header to sort" layout="block" flush>
        <UiTable
          v-model:sort="sort"
          :columns="columns"
          :rows="tableRows"
          :row-key="(r) => r.id"
          caption="Topics by Mastery"
        >
          <template #cell-tag="{ row }"><span class="s-label">{{ row.tag }}</span></template>
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
            title="Structural typing moved to a 35-day review interval"
            time="Yesterday"
            icon="review"
          />
          <UiTimelineItem
            kind="Review"
            title="Variance returned to a 1-day review interval"
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

    <ShowcaseSection id="board" title="Track board" :index="10">
      <template #lead
        >A Track is a board. A Topic is a part, a TopicEdge is a trace, and Mastery is the signal a
        part carries. A Topic is complete at Mastery 2, and blocked while a prerequisite is below
        it.</template
      >
      <ShowcaseSpecimen label="Topic part · states" note="Shape and word first, colour second">
        <div class="part"><UiTopicPart :topic="partOf(4)" state="complete" readonly /></div>
        <div class="part"><UiTopicPart :topic="partOf(2)" state="complete" readonly /></div>
        <div class="part"><UiTopicPart :topic="readyTopic" state="ready" readonly /></div>
        <div class="part"><UiTopicPart :topic="blockedTopic" state="blocked" readonly /></div>
        <div class="part"><UiTopicPart :topic="partOf(3)" state="complete" selected /></div>
        <div class="part"><UiTopicPart :topic="partOf(1)" state="outline" readonly /></div>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Track board"
        note="Pan, zoom, select. The minimap appears once part of the board is out of view. A narrow container gets the list"
        layout="block"
      >
        <UiTrackBoard
          v-model:selected="selectedTopic"
          :topics="sampleTopics"
          :edges="sampleEdges"
          label="Node.js runtime internals board"
          height="24rem"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Track map"
        note="A still board rendered on the server, here in outline for a Public Track"
        layout="block"
        surface="grid"
      >
        <UiTrackMap
          :topics="boardTopics"
          :edges="boardEdges"
          label="The first eight Topics of a Public Track"
          :flow="false"
          compact
          outline
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Track list and legend" layout="stack">
        <UiTrackList
          v-model:selected="selectedTopic"
          :topics="boardTopics"
          :edges="boardEdges"
          label="Topics in study order"
        />
        <UiTrackLegend :topics="sampleTopics" :edges="sampleEdges" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Topic card" layout="grid">
        <UiTopicCard
          title="Timers and scheduling"
          tag="T04"
          slug="node/timers"
          :level="2"
          state="complete"
          :lessons="{ read: 3, total: 3 }"
          due="Review in 2 days"
          :after="['T02']"
        />
        <UiTopicCard
          title="Streams and backpressure"
          tag="T06"
          :level="0"
          state="ready"
          :lessons="{ read: 0, total: 0 }"
          :after="['T02', 'T05']"
          :to="{ hash: '#board' }"
        />
        <UiTopicCard
          title="Profiling in production"
          tag="T12"
          :level="0"
          state="blocked"
          :after="['T09', 'T11']"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Topic details" layout="stack">
        <UiTopicDetails
          :details="{
            topic: {
              title: 'Timers and scheduling',
              slug: 'node/timers',
              summary: 'When the event loop runs a timer.',
            },
            mastery: { level: 1 },
            lessons: [],
            prerequisites: [{ id: 'loop', title: 'Event loop' }],
            dependents: [{ id: 'delay', title: 'Measuring delay' }],
          }"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Track strip" note="One cell per Topic" layout="stack">
        <UiTrackStrip
          language="en"
          v-for="t in sampleTracks"
          :key="t.id"
          :title="t.title"
          :levels="t.levels"
          :note="'Updated ' + t.updated"
          :to="{ hash: '#board' }"
        />
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="lesson" title="Lesson" :index="11">
      <template #lead
        >A Lesson is a column of Blocks. Each of the seven Block types has one renderer. Content
        written by an agent is untrusted: Markdown is escaped, links are HTTP(S) only, and a video
        loads nothing until it is played.</template
      >
      <ShowcaseSpecimen
        label="Lesson block · theory and callout"
        layout="stack"
        class="lesson-blocks"
      >
        <UiLessonBlock :index="1" :block="blockOf('theory')">
          <UiProse :markdown="theoryMarkdown" />
        </UiLessonBlock>
        <UiLessonBlock :index="3" :block="blockOf('callout')">
          <UiProse :markdown="calloutMarkdown" size="sm" />
        </UiLessonBlock>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Callout · kinds" layout="stack">
        <UiCallout kind="tip"
          ><p>Measure before you tune. The loop is rarely the bottleneck.</p></UiCallout
        >
        <UiCallout kind="gotcha"
          ><p>A zero timeout is not zero. Node.js raises it to 1 ms.</p></UiCallout
        >
        <UiCallout kind="production"
          ><p>Alert on event loop lag at the 99th percentile, not on the mean.</p></UiCallout
        >
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Link and video" layout="grid">
        <UiResourceLink v-bind="linkBlock" />
        <UiVideoEmbed v-bind="videoBlock" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Quiz · answering"
        note="The correct option arrives with the result, never with the questions"
        layout="block"
      >
        <UiQuiz v-model="quizOpen" name="specimen-open" :questions="quizQuestions" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Quiz · judged" note="One right, one wrong" layout="block">
        <UiQuiz
          v-model="quizDone"
          name="specimen-done"
          :questions="quizQuestions"
          :result="quizResult"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Exercise"
        note="Hints open one at a time. The solution is fetched on request"
        layout="block"
      >
        <UiExercise
          lesson-id="design-components"
          :block-id="exerciseId"
          :prompt="exercisePrompt"
          :hints="exerciseHints"
          :solution="solution"
          @reveal="solution = exerciseSolution"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Lesson list" layout="stack">
        <UiLessonList :lessons="lessons" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen
        label="Agent prompt"
        note="How work passes to the learner's own agent"
        layout="grid"
      >
        <UiAgentPrompt :text="prompt" tool="create_track" label="Prompt for your agent" />
        <UiAgentPrompt
          compact
          text="Write the first Lesson for the Topic node/streams-backpressure in Startodel."
          tool="create_lesson"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Next up" note="The only live plate on a page" layout="stack">
        <UiNextUp
          kind="Continue Lesson"
          title="When does a timer actually run?"
          why="You read four of seven Blocks. The Quiz at the end raises Timers and scheduling to Mastery 2."
        >
          <template #actions>
            <UiButton variant="primary" icon-right="arrow-right">Continue Lesson</UiButton>
          </template>
        </UiNextUp>
        <UiNextUp
          kind="Study"
          title="Streams and backpressure"
          why="Both prerequisites are complete. The Topic has no Lessons yet, so the next step is your agent's."
          prompt="Write the first Lesson for the Topic node/streams-backpressure. Include a Quiz and one Exercise."
          tool="create_lesson"
        />
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="grill" title="Grill and review" :index="12">
      <template #lead
        >A GrillSession is a row of test pads. The learner answers on the page. An external agent
        judges, so an answer waits for its Verdict.</template
      >
      <ShowcaseSpecimen label="Grill strip" note="Arrow keys move between pads" layout="stack">
        <UiGrillStrip v-model:current="pad" :questions="pads" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Grill question and answer" layout="block">
        <UiGrillQuestion
          :number="11"
          :total="15"
          :prompt="grillPrompt"
          :topic="{ tag: 'T06', title: 'Streams and backpressure' }"
        >
          <UiGrillAnswer id="specimen-answer" v-model="draft" @submit="draft = ''" />
        </UiGrillQuestion>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Judgment · awaiting, strong, weak" layout="stack">
        <UiGrillJudgment
          answer="Most likely the loop was busy: a long synchronous task or a burst of promise jobs."
          source="ui"
          answered-at="Today, 14:02"
        >
          <UiAgentPrompt
            compact
            text="Judge my open GrillSession in Startodel and record the Verdicts."
            tool="judge_grill_answer"
          />
        </UiGrillJudgment>
        <UiGrillJudgment
          answer="Most likely the loop was busy: a long synchronous task or a burst of promise jobs. Next, a garbage collection pause."
          source="ui"
          answered-at="Today, 14:02"
          verdict="strong"
          feedback="Right order, and you named the mechanism each time."
          judged-at="Today, 14:20"
        />
        <UiGrillJudgment
          answer="The timer is inaccurate."
          source="mcp"
          answered-at="Yesterday, 19:40"
          verdict="weak"
          feedback="That restates the symptom. Name what keeps the loop from reaching the timers phase."
          judged-at="Yesterday, 19:41"
        />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Verdict tally" layout="grid">
        <UiVerdictTally :strong="9" :partial="4" :weak="2" />
        <UiVerdictTally :strong="6" :partial="2" :weak="1" :pending="3" :unanswered="3" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Review card" layout="stack">
        <UiReviewCard
          v-for="r in reviewCards"
          :key="r.tag"
          :title="r.title"
          :tag="r.tag"
          :track="r.track"
          :level="r.level"
          :box="r.box"
          :due="r.due"
          :overdue="r.overdue"
          last-result="partial"
        >
          <template #actions>
            <UiButton variant="primary" icon="quiz">Practice Quiz</UiButton>
            <UiButton variant="ghost">Lessons</UiButton>
          </template>
        </UiReviewCard>
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Review intervals and the week" layout="grid">
        <UiLeitnerRack :counts="boxCounts" :current="1" />
        <UiLeitnerRack :counts="boxCounts" compact />
        <UiWeekStrip :days="week" />
      </ShowcaseSpecimen>
    </ShowcaseSection>

    <ShowcaseSection id="public" title="Progress and public" :index="13">
      <ShowcaseSpecimen label="Mastery histogram" layout="grid">
        <UiMasteryHistogram :counts="sampleMasteryCounts" />
        <UiMasteryHistogram :counts="[0, 0, 0, 0, 0]" label="No Topics yet" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Forked from" note="Plain text once the source is no longer public">
        <UiForkedFrom login="mkarpov" slug="node-internals" :to="{ hash: '#public' }" />
        <UiForkedFrom login="mkarpov" slug="node-internals" />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Fork button" note="A Public Track can be forked once">
        <UiForkButton
          :count="14 + (forked ? 1 : 0)"
          :forked="forked ? { hash: '#public' } : undefined"
          :count-to="{ hash: '#public' }"
          @fork="forked = true"
        />
        <UiForkButton :count="0" busy />
        <UiForkButton :count="3" disabled />
      </ShowcaseSpecimen>
      <ShowcaseSpecimen label="Track card" layout="grid">
        <UiTrackCard
          language="en"
          title="Node.js runtime internals"
          :to="{ hash: '#public' }"
          description="From the call stack to production profiling: how Node.js spends time and memory."
          :topics="12"
          :lessons="31"
          :forks="14"
          updated="3 days ago"
        />
        <UiTrackCard
          language="en"
          title="Node.js internals for SRE"
          :to="{ hash: '#public' }"
          :owner="{ login: 'lena', name: 'Lena Orlova' }"
          :forks="0"
          updated="last week"
        />
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
.part {
  width: 184px;
  height: 66px;
}
.plain {
  display: inline-flex;
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
.lesson-blocks {
  container: s-main / inline-size;
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
