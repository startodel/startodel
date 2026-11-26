export function useLogout() {
  const { clear } = useUserSession();
  const me = useMe();
  const localePath = useLocalePath();
  return async () => {
    await clear();
    me.value = undefined;
    clearNuxtData();
    await navigateTo(localePath("/"));
  };
}
