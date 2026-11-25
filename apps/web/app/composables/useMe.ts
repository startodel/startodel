export function fetchMe() {
  return useRequestFetch()("/api/me");
}
export function useMe() {
  return useState<Awaited<ReturnType<typeof fetchMe>> | undefined>("me");
}
