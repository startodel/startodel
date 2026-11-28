import type { Ref } from "vue";

/**
 * Whether an element is narrower than `width` pixels. It is false until the element is mounted,
 * so the server renders the wide composition. For a choice that CSS cannot make, such as the
 * columns of a table.
 */
export function useNarrow(target: Readonly<Ref<HTMLElement | null | undefined>>, width: number) {
  const narrow = ref(false);
  onMounted(() => {
    if (!target.value) return;
    const observer = new ResizeObserver(
      ([entry]) => (narrow.value = entry!.contentRect.width < width),
    );
    observer.observe(target.value);
    onBeforeUnmount(() => observer.disconnect());
  });
  return narrow;
}
