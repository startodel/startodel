export interface Toast {
  id: number;
  tone: "neutral" | "success" | "warning" | "danger";
  title: string;
  text?: string;
}

/** A small queue of transient messages rendered by UiToaster. */
export function useToast() {
  const toasts = useState<Toast[]>("s-toasts", () => []);
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }
  function push(toast: Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"]; timeout?: number }) {
    const id = Date.now() + Math.random();
    const { timeout = 5000, tone = "neutral", ...rest } = toast;
    toasts.value = [...toasts.value.slice(-3), { id, tone, ...rest }];
    if (timeout > 0 && import.meta.client) setTimeout(() => dismiss(id), timeout);
    return id;
  }
  return { toasts, push, dismiss };
}
