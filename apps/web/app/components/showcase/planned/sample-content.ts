/**
 * Sample content for the planned-component specimens, in Russian and English.
 * Nothing here is read from or written to the database.
 */
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
};

export function usePlannedSample() {
  const { locale } = useI18n();
  return computed(() => (locale.value === "ru" ? ru : en));
}
