export interface Toast {
  id: number;
  tone: "neutral" | "success" | "warning" | "danger";
  title: string;
  text?: string;
  /** Milliseconds before the message leaves. 0 keeps it until the learner dismisses it. */
  timeout: number;
}

/** A small queue of transient messages rendered by UiToaster. */
export function useToast() {
  const toasts = useState<Toast[]>("s-toasts", () => []);
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }
  function push(toast: Pick<Toast, "title" | "text"> & Partial<Pick<Toast, "tone" | "timeout">>) {
    const id = Date.now() + Math.random();
    toasts.value = [...toasts.value.slice(-3), { tone: "neutral", timeout: 5000, ...toast, id }];
    return id;
  }
  return { toasts, push, dismiss };
}
