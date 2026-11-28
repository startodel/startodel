/**
 * Sample content for the planned-component specimens, in Russian and English.
 * Nothing here is read from or written to the database.
 */
import type { TestCase } from "../../ui/practice";

const code = {
  sequential: `export async function loadDashboard(userId: string) {
  const user = await fetchUser(userId);
  const tracks = await fetchTracks(userId);
  const reviews = await fetchReviews(userId);
  return { user, tracks, reviews };
}
`,
  parallel: `export async function loadDashboard(userId: string) {
  const [user, tracks, reviews] = await Promise.all([
    fetchUser(userId),
    fetchTracks(userId),
    fetchReviews(userId),
  ]);
  return { user, tracks, reviews };
}
`,
  leak: `onMounted(() => {
  window.addEventListener("resize", onResize);
});
`,
  cleanup: `onMounted(() => {
  window.addEventListener("resize", onResize);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});
`,
  queryBefore: `select id, title
from lessons
where topic_id = $1
order by created_at;
`,
  queryAfter: `select id, title
from lessons
where topic_id = $1
  and user_id = $2
order by position;
`,
  lifecycle: `stateDiagram-v2
  [*] --> setup
  setup --> mounted: mount
  mounted --> updated: state changed
  updated --> mounted: DOM patched
  mounted --> unmounted: unmount
`,
};

const ru = {
  diff: {
    refactor: {
      before: code.sequential,
      after: code.parallel,
      beforeTitle: "по очереди",
      afterTitle: "одновременно",
      explanation:
        "Три запроса не зависят друг от друга. `Promise.all` запускает их вместе, и ответ приходит за время самого долгого запроса, а не за сумму трёх.",
    },
    listener: {
      before: code.leak,
      after: code.cleanup,
      explanation:
        "Обработчик на `window` переживает компонент. Если его не снять, каждое новое монтирование добавит ещё один.",
    },
    query: {
      before: code.queryBefore,
      after: code.queryAfter,
      explanation:
        "Запрос читает уроки одного владельца и сортирует их по позиции в теме, а не по дате создания.",
    },
    prose: {
      before: `Таймер не срабатывает раньше срока. Его колбэк попадает в очередь, когда задержка истекла, и ждёт, пока цикл событий дойдёт до фазы таймеров.
Задержка 0 мс означает «как можно скорее».
Микрозадачи выполняются после каждой задачи, до следующего таймера.`,
      after: `Таймер не срабатывает раньше срока. Его колбэк попадает в очередь, когда задержка истекла, и ждёт, пока цикл событий дойдёт до фазы таймеров.
Задержка 0 мс не равна нулю: Node.js поднимает её до 1 мс.
Микрозадачи выполняются после каждой задачи, до следующего таймера.`,
    },
  },
  diagram: {
    lifecycle: {
      title: "Жизненный цикл компонента Vue",
      description:
        "Компонент проходит setup, монтируется и в конце размонтируется: это сплошная линия. Пока он в DOM, каждое изменение состояния ведёт к onUpdated и возвращает его в смонтированное состояние: это пунктир.",
      source: code.lifecycle,
      parts: {
        setup: "создание",
        mounted: "в DOM",
        updated: "обновление",
        unmounted: "удалён",
      },
      traces: {
        mount: "монтирование",
        unmount: "размонтирование",
        change: "состояние изменилось",
        patch: "DOM обновлён",
      },
    },
    flow: {
      title: "Два входа, один слой данных",
      description:
        "Запрос агента идёт через MCP в forUser и дальше в PostgreSQL: это сплошная линия. Запрос из браузера идёт через API сессии и попадает в тот же forUser: это пунктир. Мимо forUser в базу не ходит никто.",
      source: `flowchart LR
  agent[Агент] --> mcp[MCP]
  browser[Браузер] --> session[API сессии]
  mcp --> scope["forUser(db, userId)"]
  session --> scope
  scope --> pg[(PostgreSQL)]
`,
      parts: {
        agent: ["клиент", "Агент"],
        mcp: ["по токену", "MCP"],
        browser: ["клиент", "Браузер"],
        session: ["по сессии", "API сессии"],
        scope: ["владелец", "forUser()"],
        pg: ["данные", "PostgreSQL"],
      },
    },
    loading: {
      title: "Фазы цикла событий",
      description:
        "Шесть фаз цикла событий Node.js по порядку: таймеры, отложенные колбэки, подготовка, опрос, check и колбэки закрытия.",
    },
    failed: {
      title: "Как коммит попадает на прод",
      description:
        "Коммит запускает сборку. Сборка публикует образ. Образ выкатывается сначала на стенд, потом на прод.",
      source: `flowchart LR
  commit[Коммит] --> build[Сборка]
  build --> image[(Образ)]
  image --> staging[Стенд] --> prod[Прод
`,
    },
  },
  practice: {
    runtime: "JavaScript · Web Worker",
    sqlRuntime: "SQL · SQLite",
    actions: {
      run: "Запустить тесты",
      again: "Запустить снова",
      reset: "Сбросить к заготовке",
      save: "Сохранить попытку",
    },
    states: {
      label: "Состояние прогона",
      idle: "Нет прогона",
      running: "Идёт",
      passed: "Пройден",
      failed: "Не пройден",
      error: "Ошибка",
    },
    starter: `// Верните элементы без повторов по ключу. Из одинаковых остаётся первый.
export function uniqueBy(items, key) {
  return items;
}
`,
    attempt: `export function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => !seen.has(item[key]) && seen.add(item[key]));
}
`,
    tests: [
      {
        id: "empty",
        name: "возвращает пустой массив для пустого входа",
        result: "passed",
        durationMs: 2,
      },
      {
        id: "first",
        name: "оставляет первый элемент из одинаковых по ключу",
        result: "failed",
        durationMs: 4,
        expected: `[
  { id: 1, name: "Ada" },
  { id: 2, name: "Lin" },
]`,
        received: `[
  { id: 1, name: "Ada" },
  { id: 2, name: "Lin" },
  { id: 1, name: "Ada L." },
]`,
      },
      { id: "order", name: "сохраняет исходный порядок", result: "passed", durationMs: 1 },
      { id: "pure", name: "не меняет исходный массив", result: "passed", durationMs: 1 },
      {
        id: "fn",
        name: "принимает функцию вместо имени поля",
        result: "failed",
        durationMs: 3,
        message: "AssertionError: expected [ …(4) ] to deeply equal [ …(2) ]",
        expected: `["ada@example.com", "lin@example.com"]`,
        received: `["ada@example.com", "ADA@example.com", "lin@example.com", "Lin@example.com"]`,
      },
    ] satisfies TestCase[],
    syntaxError: `SyntaxError: Unexpected token '}'
    at solution.js:4:1`,
    sqlTests: [
      { id: "owner", name: "возвращает уроки только одного владельца" },
      { id: "order", name: "сортирует уроки по позиции в теме" },
    ],
    timeout: "Запрос остановлен: он выполнялся дольше 5 секунд.",
  },
  media: {
    formats: "MP4, PNG, PDF, ZIP",
    videoFormats: "MP4, WebM",
    quotaFull: "Хранилище заполнено. Удалите ненужные файлы, чтобы загрузить новые.",
    kinds: { video: "Видео", files: "Файлы" },
    failed: "Соединение прервалось на 41%.",
    files: {
      uploading: "event-loop-phases.mp4",
      processing: "explain-analyze-walkthrough.mp4",
      image: "nested-loop-plan.png",
      document: "index-types-cheatsheet.pdf",
      failed: "exercise-fixtures.zip",
      overQuota: "conference-talk-full-recording.mp4",
    },
    video: {
      ready: "Читаем план запроса с EXPLAIN ANALYZE",
      processing: "Шесть фаз цикла событий Node.js",
      expired: "Покрывающие индексы на живой таблице",
      locked: "Разбор задачи про дедлок",
    },
  },
  proposals: {
    lesson: "Покрывающие индексы",
    people: {
      lin: { name: "Линь Вэй", login: "linwei" },
      sofia: { name: "София Маркетти", login: "sofia-m" },
      timur: { name: "Тимур Ахметов", login: "timur" },
      dana: { login: "dana_k" },
    },
    index: {
      note: "Запрос из этого блока сортирует по position и читает title. С таким индексом хватит index-only scan, в таблицу ходить не придётся.",
      before: `create index lessons_topic_idx
  on lessons (topic_id);
`,
      after: `create index lessons_topic_idx
  on lessons (topic_id, position)
  include (title);
`,
    },
    like: {
      note: "Уточнила про LIKE: с шаблоном '%abc' B-tree не поможет.",
      before: `Индекс B-tree ускоряет запросы с LIKE.
Проверьте план через EXPLAIN.
`,
      after: `Индекс B-tree ускоряет LIKE только с закреплённым началом шаблона: 'abc%'.
Для поиска по середине строки нужен триграммный индекс.
Проверьте план через EXPLAIN.
`,
    },
    typo: {
      note: "Опечатка в имени колонки.",
      before: `select id, title from lessons where topik_id = $1;
`,
      after: `select id, title from lessons where topic_id = $1;
`,
    },
    lessons: {
      covering: "Покрывающие индексы",
      plans: "Как читать план запроса",
      joins: "Стратегии соединения",
      vacuum: "Что делает VACUUM",
    },
  },
  versions: {
    list: [
      {
        number: 3,
        publishedAt: "2026-11-26T10:00:00Z",
        note: "Добавил тему про покрывающие индексы и переписал урок про EXPLAIN: теперь в нём планы из PostgreSQL 17.",
        changes: { lessonsAdded: 2, blocksChanged: 5 },
      },
      {
        number: 2,
        publishedAt: "2026-11-02T10:00:00Z",
        note: "Исправил примеры в теме про соединения и убрал устаревший урок про hash-индексы.",
        changes: { lessonsRemoved: 1, blocksChanged: 12 },
      },
      { number: 1, publishedAt: "2026-10-14T10:00:00Z", note: "Первая версия трека." },
    ],
    published: "Добавил задачу на чтение плана с Bitmap Heap Scan.",
    fileName: "postgres-query-planning.startodel.json",
    folderName: "postgres-query-planning.startodel.zip",
    title: "Планирование запросов в PostgreSQL",
    brokenName: "rust-ownership.startodel.zip",
    errors: [
      {
        path: "topics[3].lessons[0].blocks[2].type",
        message: "Неизвестный тип блока: diagram. Формат 1.0 такого не знает.",
      },
      {
        path: "topics[1].prerequisites[0]",
        message: "Тема ссылается на тему borrowing, которой нет в файле.",
      },
      {
        path: "topics[4].lessons[2].blocks[5].options",
        message: "В вопросе теста нет ни одного верного варианта.",
      },
    ],
  },
};

const en: typeof ru = {
  diff: {
    refactor: {
      before: code.sequential,
      after: code.parallel,
      beforeTitle: "one by one",
      afterTitle: "all at once",
      explanation:
        "The three requests do not depend on each other. `Promise.all` starts them together, so the response takes as long as the slowest request, not the sum of all three.",
    },
    listener: {
      before: code.leak,
      after: code.cleanup,
      explanation:
        "A listener on `window` outlives the component. Without the cleanup, every new mount adds one more.",
    },
    query: {
      before: code.queryBefore,
      after: code.queryAfter,
      explanation:
        "The query reads the Lessons of one Owner and orders them by position in the Topic, not by creation date.",
    },
    prose: {
      before: `A timer never fires early. Its callback is queued once the delay has passed and waits until the event loop reaches the timers phase.
A delay of 0 ms means "as soon as possible".
Microtasks run after every task, before the next timer.`,
      after: `A timer never fires early. Its callback is queued once the delay has passed and waits until the event loop reaches the timers phase.
A delay of 0 ms is not zero: Node.js raises it to 1 ms.
Microtasks run after every task, before the next timer.`,
    },
  },
  diagram: {
    lifecycle: {
      title: "The lifecycle of a Vue component",
      description:
        "A component runs setup, mounts and is unmounted at the end: the solid line. While it is in the DOM, every state change leads to onUpdated and back to the mounted state: the dashed line.",
      source: code.lifecycle,
      parts: {
        setup: "creation",
        mounted: "in the DOM",
        updated: "update",
        unmounted: "removed",
      },
      traces: {
        mount: "mount",
        unmount: "unmount",
        change: "state changed",
        patch: "DOM patched",
      },
    },
    flow: {
      title: "Two entrances, one data layer",
      description:
        "An agent's request goes through MCP into forUser and on to PostgreSQL: the solid line. A browser request goes through the Session API and reaches the same forUser: the dashed line. Nothing gets to the database around forUser.",
      source: `flowchart LR
  agent[Agent] --> mcp[MCP]
  browser[Browser] --> session[Session API]
  mcp --> scope["forUser(db, userId)"]
  session --> scope
  scope --> pg[(PostgreSQL)]
`,
      parts: {
        agent: ["client", "Agent"],
        mcp: ["by token", "MCP"],
        browser: ["client", "Browser"],
        session: ["by Session", "Session API"],
        scope: ["Owner", "forUser()"],
        pg: ["data", "PostgreSQL"],
      },
    },
    loading: {
      title: "Event loop phases",
      description:
        "The six phases of the Node.js event loop in order: timers, pending callbacks, prepare, poll, check and close callbacks.",
    },
    failed: {
      title: "How a commit reaches production",
      description:
        "A commit starts a build. The build publishes an image. The image is rolled out to staging first, then to production.",
      source: `flowchart LR
  commit[Commit] --> build[Build]
  build --> image[(Image)]
  image --> staging[Staging] --> prod[Production
`,
    },
  },
  practice: {
    runtime: "JavaScript · Web Worker",
    sqlRuntime: "SQL · SQLite",
    actions: {
      run: "Run tests",
      again: "Run again",
      reset: "Reset to starter",
      save: "Save attempt",
    },
    states: {
      label: "State of the run",
      idle: "Idle",
      running: "Running",
      passed: "Passed",
      failed: "Failed",
      error: "Error",
    },
    starter: `// Return the items without repeats by key. The first of each stays.
export function uniqueBy(items, key) {
  return items;
}
`,
    attempt: `export function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => !seen.has(item[key]) && seen.add(item[key]));
}
`,
    tests: [
      {
        id: "empty",
        name: "returns an empty array for an empty input",
        result: "passed",
        durationMs: 2,
      },
      {
        id: "first",
        name: "keeps the first of the items that share a key",
        result: "failed",
        durationMs: 4,
        expected: `[
  { id: 1, name: "Ada" },
  { id: 2, name: "Lin" },
]`,
        received: `[
  { id: 1, name: "Ada" },
  { id: 2, name: "Lin" },
  { id: 1, name: "Ada L." },
]`,
      },
      { id: "order", name: "keeps the original order", result: "passed", durationMs: 1 },
      { id: "pure", name: "does not change the input array", result: "passed", durationMs: 1 },
      {
        id: "fn",
        name: "takes a function in place of a field name",
        result: "failed",
        durationMs: 3,
        message: "AssertionError: expected [ …(4) ] to deeply equal [ …(2) ]",
        expected: `["ada@example.com", "lin@example.com"]`,
        received: `["ada@example.com", "ADA@example.com", "lin@example.com", "Lin@example.com"]`,
      },
    ] satisfies TestCase[],
    syntaxError: `SyntaxError: Unexpected token '}'
    at solution.js:4:1`,
    sqlTests: [
      { id: "owner", name: "returns the Lessons of one Owner only" },
      { id: "order", name: "sorts the Lessons by their position in the Topic" },
    ],
    timeout: "The query was stopped: it ran longer than 5 seconds.",
  },
  media: {
    formats: "MP4, PNG, PDF, ZIP",
    videoFormats: "MP4, WebM",
    quotaFull: "The storage is full. Remove the files you no longer need to upload new ones.",
    kinds: { video: "Video", files: "Files" },
    failed: "The connection dropped at 41%.",
    files: {
      uploading: "event-loop-phases.mp4",
      processing: "explain-analyze-walkthrough.mp4",
      image: "nested-loop-plan.png",
      document: "index-types-cheatsheet.pdf",
      failed: "exercise-fixtures.zip",
      overQuota: "conference-talk-full-recording.mp4",
    },
    video: {
      ready: "Reading a query plan with EXPLAIN ANALYZE",
      processing: "The six phases of the Node.js event loop",
      expired: "Covering indexes on a live table",
      locked: "A deadlock, taken apart",
    },
  },
  proposals: {
    lesson: "Covering indexes",
    people: {
      lin: { name: "Lin Wei", login: "linwei" },
      sofia: { name: "Sofia Marchetti", login: "sofia-m" },
      timur: { name: "Timur Akhmetov", login: "timur" },
      dana: { login: "dana_k" },
    },
    index: {
      note: "The query in this Block sorts by position and reads title. With this index an index-only scan is enough, with no trip to the table.",
      before: `create index lessons_topic_idx
  on lessons (topic_id);
`,
      after: `create index lessons_topic_idx
  on lessons (topic_id, position)
  include (title);
`,
    },
    like: {
      note: "Made the LIKE claim precise: a B-tree does not help with a '%abc' pattern.",
      before: `A B-tree index speeds up queries with LIKE.
Check the plan with EXPLAIN.
`,
      after: `A B-tree index speeds up LIKE only when the pattern is anchored at the start: 'abc%'.
A search in the middle of a string needs a trigram index.
Check the plan with EXPLAIN.
`,
    },
    typo: {
      note: "A typo in the column name.",
      before: `select id, title from lessons where topik_id = $1;
`,
      after: `select id, title from lessons where topic_id = $1;
`,
    },
    lessons: {
      covering: "Covering indexes",
      plans: "How to read a query plan",
      joins: "Join strategies",
      vacuum: "What VACUUM does",
    },
  },
  versions: {
    list: [
      {
        number: 3,
        publishedAt: "2026-11-26T10:00:00Z",
        note: "Added a Topic on covering indexes and rewrote the EXPLAIN Lesson: it now shows plans from PostgreSQL 17.",
        changes: { lessonsAdded: 2, blocksChanged: 5 },
      },
      {
        number: 2,
        publishedAt: "2026-11-02T10:00:00Z",
        note: "Fixed the examples in the Topic on joins and removed the dated Lesson on hash indexes.",
        changes: { lessonsRemoved: 1, blocksChanged: 12 },
      },
      { number: 1, publishedAt: "2026-10-14T10:00:00Z", note: "The first version of the Track." },
    ],
    published: "Added an Exercise on reading a plan with a Bitmap Heap Scan.",
    fileName: "postgres-query-planning.startodel.json",
    folderName: "postgres-query-planning.startodel.zip",
    title: "Query planning in PostgreSQL",
    brokenName: "rust-ownership.startodel.zip",
    errors: [
      {
        path: "topics[3].lessons[0].blocks[2].type",
        message: "Unknown Block type: diagram. Format 1.0 does not know it.",
      },
      {
        path: "topics[1].prerequisites[0]",
        message: "The Topic refers to the Topic borrowing, which is not in the file.",
      },
      {
        path: "topics[4].lessons[2].blocks[5].options",
        message: "The Quiz question has no correct option.",
      },
    ],
  },
};

export function usePlannedSample() {
  const { locale } = useI18n();
  return computed(() => (locale.value === "ru" ? ru : en));
}
