/** Follow changes made by the learner's MCP client until their first Track arrives. */
export function useEmptyDashboardRefresh(
  trackCount: () => number | undefined,
  refresh: () => Promise<void>,
) {
  const empty = computed((previous: boolean = false) => {
    const count = trackCount();
    return count === undefined ? previous : count === 0;
  });
  onMounted(() => {
    let pending = false;
    watch(
      empty,
      (waiting, _, onCleanup) => {
        if (!waiting) return;
        let timer: number | undefined;
        async function refreshVisible() {
          if (document.visibilityState !== "visible" || pending) return;
          pending = true;
          try {
            await refresh();
          } finally {
            pending = false;
          }
        }
        function schedule() {
          window.clearInterval(timer);
          if (document.visibilityState === "visible")
            timer = window.setInterval(refreshVisible, 5000);
        }
        function visibilityChanged() {
          schedule();
          void refreshVisible();
        }
        schedule();
        document.addEventListener("visibilitychange", visibilityChanged);
        window.addEventListener("focus", refreshVisible);
        onCleanup(() => {
          window.clearInterval(timer);
          document.removeEventListener("visibilitychange", visibilityChanged);
          window.removeEventListener("focus", refreshVisible);
        });
      },
      { immediate: true },
    );
  });
}
