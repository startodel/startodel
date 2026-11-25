/** Copy text to the clipboard and report the outcome for about two seconds. */
export function useCopy() {
  const state = ref<"idle" | "copied" | "failed">("idle");
  let timer: ReturnType<typeof setTimeout> | undefined;
  async function copy(text: string) {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(text);
      state.value = "copied";
    } catch {
      state.value = "failed";
    }
    timer = setTimeout(() => (state.value = "idle"), 2200);
  }
  onScopeDispose(() => clearTimeout(timer));
  return { state, copy };
}
