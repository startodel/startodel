export function useLogout() {
  const { clear } = useUserSession();
  const localePath = useLocalePath();
  return async () => {
    await clear();
    clearNuxtData();
    await navigateTo(localePath("/login"));
  };
}
