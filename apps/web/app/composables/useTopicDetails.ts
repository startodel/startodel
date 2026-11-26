/** Loads the same private Topic for its page and the selected part on a Track board. */
export function useTopicDetails(id: Ref<string | undefined>) {
  const request = useRequestFetch();
  return useAsyncData(
    () => "topic-details:" + (id.value ?? ""),
    () => (id.value ? request(`/api/topics/${id.value}`) : Promise.resolve(null)),
  );
}
