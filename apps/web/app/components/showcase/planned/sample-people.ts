import type { AccessGrant, AccessPending, SyllabusTopic } from "../../ui/access";
import type { AgentFitSignal, AgentFitState } from "../../ui/agent";
import type {
  CohortLearner,
  CohortSummary,
  DropOffItem,
  FunnelStep,
  LearnerChange,
  LearnerCounts,
  MasteryTopic,
} from "../../ui/analytics";
import type { BlockComment, FeedbackLesson } from "../../ui/comments";
import { screenPath } from "../sample";

/**
 * Sample data for the planned components about people: the connected agent, comments, access,
 * analytics and points. One Track about PostgreSQL runs through all of it. Nothing here is read
 * from or written to the database.
 */
type Localized<T> = { ru: T; en: T };

function usePick() {
  const { locale } = useI18n();
  return <T>(value: Localized<T>): T => (locale.value === "ru" ? value.ru : value.en);
}

/** Dates count back from the day the page is rendered, so the sample never looks stale. */
function useDaysAgo() {
  const today = useState("planned-people-day", () => new Date().toISOString().slice(0, 10));
  return (days: number, hour = 9) =>
    new Date(Date.parse(today.value) - days * 86400000 + hour * 3600000).toISOString();
}

export function useSampleAgents() {
  const pick = usePick();
  const daysAgo = useDaysAgo();
  return computed(() => [
    {
      id: "claude",
      name: "Claude Code",
      version: "2.1.4",
      via: "oauth" as const,
      status: "active" as const,
      lastActiveAt: daysAgo(0),
    },
    {
      id: "cursor",
      name: "Cursor",
      version: "1.9",
      via: "token" as const,
      tokenName: pick({ ru: "Рабочий ноутбук", en: "Work laptop" }),
      status: "idle" as const,
      lastActiveAt: daysAgo(3),
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      via: "oauth" as const,
      status: "idle" as const,
      lastActiveAt: daysAgo(12),
    },
    {
      id: "unknown",
      name: null,
      via: "token" as const,
      tokenName: pick({ ru: "Домашний сервер", en: "Home server" }),
      status: "unused" as const,
    },
  ]);
}

export const sampleAgentFit: Record<
  AgentFitState,
  { result: AgentFitState; signals?: Partial<Record<AgentFitSignal, AgentFitState>> }
> = {
  good: {
    result: "good",
    signals: { guide: "good", tools: "good", variety: "good", evidence: "good" },
  },
  attention: {
    result: "attention",
    signals: { guide: "good", tools: "good", variety: "attention", evidence: "attention" },
  },
  poor: {
    result: "poor",
    signals: { guide: "poor", tools: "attention", variety: "poor", evidence: "unknown" },
  },
  unknown: { result: "unknown" },
};

const track = {
  title: { ru: "PostgreSQL для бэкенд-разработчиков", en: "PostgreSQL for backend engineers" },
  author: "sergey-p",
  topics: [
    {
      title: { ru: "Как PostgreSQL выполняет запрос", en: "How PostgreSQL runs a query" },
      lessons: [
        { ru: "Путь запроса: от текста до плана", en: "From SQL text to a plan" },
        { ru: "Последовательное чтение и стоимость", en: "Sequential scans and cost" },
        { ru: "Что планировщик знает о таблице", en: "What the planner knows about a table" },
      ],
    },
    {
      title: { ru: "Чтение EXPLAIN", en: "Reading EXPLAIN" },
      lessons: [
        { ru: "Как читать дерево плана", en: "Reading a plan tree" },
        { ru: "EXPLAIN ANALYZE и реальное время", en: "EXPLAIN ANALYZE and actual time" },
        { ru: "Оценки строк и реальность", en: "Row estimates versus reality" },
      ],
    },
    {
      title: { ru: "Индексы B-дерева", en: "B-tree indexes" },
      lessons: [
        { ru: "Как устроено B-дерево", en: "Inside a B-tree" },
        { ru: "Index Scan и Index Only Scan", en: "Index Scan and Index Only Scan" },
        { ru: "Когда индекс не помогает", en: "When an index does not help" },
      ],
    },
    {
      title: { ru: "Составные и частичные индексы", en: "Composite and partial indexes" },
      lessons: [
        { ru: "Порядок столбцов в составном индексе", en: "Column order in a composite index" },
        { ru: "Частичные индексы", en: "Partial indexes" },
      ],
    },
    {
      title: { ru: "Соединения таблиц", en: "Join strategies" },
      lessons: [
        { ru: "Nested Loop", en: "Nested Loop" },
        { ru: "Hash Join и work_mem", en: "Hash Join and work_mem" },
        { ru: "Merge Join", en: "Merge Join" },
      ],
    },
    {
      title: { ru: "Транзакции и MVCC", en: "Transactions and MVCC" },
      lessons: [
        { ru: "Снимки и версии строк", en: "Snapshots and row versions" },
        { ru: "Долгие транзакции и раздувание таблиц", en: "Long transactions and table bloat" },
      ],
    },
  ],
};
const lessonPath = screenPath("lesson");

export function useSampleComments() {
  const pick = usePick();
  const daysAgo = useDaysAgo();
  const unclear = {
    ru: "Не понял, почему actual time у вложенного узла больше, чем у родителя. Это время на одну итерацию?",
    en: "I don't see why the inner node's actual time is larger than its parent's. Is it per loop?",
  };
  const outdated = {
    ru: "В PostgreSQL 17 в выводе появилась строка про буферы, пример выглядит иначе.",
    en: "PostgreSQL 17 adds a buffers line to this output, so the example looks different.",
  };
  const suggestion = {
    ru: "Покажите тот же запрос после ANALYZE, чтобы было видно, как меняются оценки.",
    en: "Show the same query after ANALYZE, so the change in estimates is visible.",
  };
  const thread = computed<BlockComment[]>(() => [
    {
      id: "c1",
      kind: "unclear",
      text: pick(unclear),
      createdAt: daysAgo(6),
      author: { handle: "mira" },
      resolved: true,
      reply: {
        text: pick({
          ru: "Да, время указано на одну итерацию. Умножьте его на loops. Добавил пояснение под примером.",
          en: "Yes, it is per loop. Multiply it by loops. I added a note under the example.",
        }),
        createdAt: daysAgo(5),
        author: { handle: track.author },
      },
    },
    {
      id: "c2",
      kind: "outdated",
      text: pick(outdated),
      createdAt: daysAgo(2),
      author: { handle: "dkim" },
    },
    {
      id: "c3",
      kind: "suggestion",
      text: pick(suggestion),
      createdAt: daysAgo(1),
      author: { handle: "nastya-v" },
    },
  ]);
  const inbox = computed<FeedbackLesson[]>(() => [
    {
      id: "explain-analyze",
      track: pick(track.title),
      topic: { ordinal: 2, title: pick(track.topics[1]!.title) },
      lesson: { ordinal: 2, title: pick(track.topics[1]!.lessons[1]!), to: lessonPath },
      comments: [
        {
          id: "c3",
          kind: "suggestion",
          text: pick(suggestion),
          block: 5,
          author: { handle: "nastya-v" },
          createdAt: daysAgo(1),
        },
        {
          id: "c2",
          kind: "outdated",
          text: pick(outdated),
          block: 5,
          author: { handle: "dkim" },
          createdAt: daysAgo(2),
        },
        {
          id: "c4",
          kind: "broken-link",
          text: pick({
            ru: "Ссылка на документацию pg_stat_statements ведёт на страницу 404.",
            en: "The link to the pg_stat_statements docs leads to a 404 page.",
          }),
          block: 7,
          author: { handle: "lev" },
          createdAt: daysAgo(3),
        },
        {
          id: "c1",
          kind: "unclear",
          text: pick(unclear),
          block: 5,
          author: { handle: "mira" },
          createdAt: daysAgo(6),
          resolved: true,
        },
      ],
    },
    {
      id: "column-order",
      track: pick(track.title),
      topic: { ordinal: 4, title: pick(track.topics[3]!.title) },
      lesson: { ordinal: 1, title: pick(track.topics[3]!.lessons[0]!), to: lessonPath },
      comments: [
        {
          id: "c5",
          kind: "unclear",
          text: pick({
            ru: "Не понял, почему индекс (a, b) не помогает запросу с условием только по b.",
            en: "I don't get why an index on (a, b) does not help a query that filters only on b.",
          }),
          block: 3,
          author: { handle: "tim-r" },
          createdAt: daysAgo(4),
        },
        {
          id: "c6",
          kind: "suggestion",
          text: pick({
            ru: "Добавьте пример с ORDER BY по второму столбцу.",
            en: "Add an example with ORDER BY on the second column.",
          }),
          block: 6,
          author: { handle: "ilya-k" },
          createdAt: daysAgo(8),
          resolved: true,
        },
      ],
    },
  ]);
  const draft = computed(() =>
    pick({
      ru: "В примере нет единиц измерения. Это миллисекунды?",
      en: "The example shows no units. Are these milliseconds?",
    }),
  );
  const block = computed(() =>
    pick({
      ru: "Строка actual time показывает два числа: время до первой строки и время до последней. Оба числа относятся к одной итерации узла.",
      en: "The actual time line shows two numbers: the time to the first row and the time to the last. Both describe one loop of the node.",
    }),
  );
  return { thread, inbox, draft, block };
}

export function useSampleAccess() {
  const pick = usePick();
  const daysAgo = useDaysAgo();
  const title = computed(() => pick(track.title));
  const previews = new Set(["1-1", "1-2", "2-1"]);
  const syllabus = (granted: boolean) =>
    track.topics.map<SyllabusTopic>((topic, i) => ({
      id: String(i + 1),
      title: pick(topic.title),
      lessons: topic.lessons.map((lesson, j) => {
        const id = `${i + 1}-${j + 1}`;
        const open = granted || previews.has(id);
        return {
          id,
          title: pick(lesson),
          to: open ? lessonPath : undefined,
          locked: !open,
          preview: !granted && open,
          // A learner with access has read the first Topic and a half.
          read: granted ? i * 3 + j < 5 : undefined,
        };
      }),
    }));
  const visitor = computed(() => syllabus(false));
  const learner = computed(() => syllabus(true));
  const requests = computed<AccessPending[]>(() => [
    {
      id: "r1",
      learner: { handle: "anna-b" },
      message: pick({
        ru: "Два года пишу бэкенд на Go. Хочу наконец понимать планы запросов, а не гадать по ним.",
        en: "Two years of backend work in Go. I want to read query plans instead of guessing at them.",
      }),
      requestedAt: daysAgo(1),
    },
    {
      id: "r2",
      learner: { handle: "oleg-s" },
      message: pick({
        ru: "Готовлюсь к собеседованию, нужен системный разбор индексов.",
        en: "Preparing for an interview and need a systematic walk through indexes.",
      }),
      requestedAt: daysAgo(2),
    },
    { id: "r3", learner: { handle: "pavel-z" }, requestedAt: daysAgo(4) },
  ]);
  const grants = computed<AccessGrant[]>(() => [
    { id: "g1", learner: { handle: "mira" }, grantedAt: daysAgo(21), lastActiveAt: daysAgo(0) },
    { id: "g2", learner: { handle: "dkim" }, grantedAt: daysAgo(18), lastActiveAt: daysAgo(2) },
    { id: "g3", learner: { handle: "nastya-v" }, grantedAt: daysAgo(14), lastActiveAt: daysAgo(1) },
    { id: "g4", learner: { handle: "lev" }, grantedAt: daysAgo(9), lastActiveAt: daysAgo(3) },
    { id: "g5", learner: { handle: "tim-r" }, grantedAt: daysAgo(6), lastActiveAt: null },
  ]);
  const message = computed(() =>
    pick({
      ru: "Перехожу с MySQL, хочу разобраться с планировщиком.",
      en: "Moving over from MySQL and want to understand the planner.",
    }),
  );
  return { title, visitor, learner, requests, grants, message, daysAgo };
}

/** 128 learners started the sample Track. Every number below is drawn from that cohort. */
const cohort = {
  reached: [128, 112, 97, 62, 51, 38],
  mastery: [
    [6, 22, 48, 37, 15],
    [18, 26, 44, 30, 10],
    [34, 31, 37, 20, 6],
    [67, 24, 22, 11, 4],
    [78, 19, 19, 9, 3],
    [91, 14, 14, 7, 2],
  ],
  median: [2, 2, 1, 0, 0, 0],
  quiz: [0.86, 0.74, 0.69, 0.41, 0.63, 0.58],
  exercise: [0.72, 0.61, 0.55, 0.29, 0.38, null],
};

export function useSampleAnalytics() {
  const pick = usePick();
  const daysAgo = useDaysAgo();
  const trackPath = screenPath("track");
  const counts: LearnerCounts = { started: 128, active7: 41, active30: 86, completed: 29 };
  const change: LearnerChange = { started: 14, active7: 5, active30: -3, completion: 2 };
  const funnel = computed<FunnelStep[]>(() =>
    track.topics.map((topic, i) => ({
      id: String(i + 1),
      title: pick(topic.title),
      learners: cohort.reached[i]!,
      to: trackPath,
    })),
  );
  const mastery = computed<MasteryTopic[]>(() =>
    track.topics.map((topic, i) => ({
      id: String(i + 1),
      title: pick(topic.title),
      counts: cohort.mastery[i]!,
      median: cohort.median[i]!,
      quizAccuracy: cohort.quiz[i]!,
      exerciseCompletion: cohort.exercise[i]!,
      to: trackPath,
    })),
  );
  const weakSpots = computed<DropOffItem[]>(() => [
    {
      id: "4-1",
      ref: { topic: 4, lesson: 1 },
      title: pick(track.topics[3]!.lessons[0]!),
      to: lessonPath,
      signals: [
        { type: "dropoff", value: 0.34 },
        { type: "accuracy", value: 0.41 },
        { type: "comments", value: 9 },
      ],
      reading: pick({
        ru: "Треть учеников бросает трек на этом уроке, а в тесте ошибается больше половины.",
        en: "A third of the learners leave the Track at this Lesson, and more than half fail its Quiz.",
      }),
    },
    {
      id: "2-3",
      ref: { topic: 2, lesson: 3 },
      title: pick(track.topics[1]!.lessons[2]!),
      to: lessonPath,
      signals: [{ type: "accuracy", value: 0.48 }],
      reading: pick({
        ru: "Урок дочитывают, но тест после него проходит только половина.",
        en: "Learners finish the Lesson, but only half of them pass the Quiz after it.",
      }),
    },
    {
      id: "5-2",
      ref: { topic: 5, lesson: 2 },
      title: pick(track.topics[4]!.lessons[1]!),
      to: lessonPath,
      signals: [
        { type: "dropoff", value: 0.21 },
        { type: "comments", value: 7 },
      ],
      reading: pick({
        ru: "Каждый пятый останавливается здесь. В комментариях просят пример с work_mem.",
        en: "One learner in five stops here. The comments ask for an example with work_mem.",
      }),
    },
  ]);
  const learner = (handle: string, read: number, level: number, days: number): CohortLearner => ({
    id: handle,
    handle,
    read,
    lessons: 16,
    mastery: level,
    lastActiveAt: daysAgo(days),
  });
  const learners = computed(() => [
    learner("mira", 16, 3, 0),
    learner("dkim", 14, 3, 2),
    learner("nastya-v", 12, 2, 1),
    learner("lev", 9, 2, 3),
    learner("tim-r", 9, 1, 6),
    learner("ilya-k", 7, 1, 4),
    learner("anna-b", 5, 1, 9),
    learner("oleg-s", 3, 0, 12),
    learner("vera-m", 2, 0, 20),
    learner("pavel-z", 1, 0, 31),
  ]);
  const summary: CohortSummary = { learners: 128, progress: 0.46, mastery: 1 };
  return { counts, change, funnel, mastery, weakSpots, learners, summary };
}
