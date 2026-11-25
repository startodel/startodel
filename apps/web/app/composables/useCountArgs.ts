// Keep the numeric count for plural selection and format the displayed number in the active locale.
export function useCountArgs() {
  const { n } = useI18n();
  return (count: number) => ({ count, n: n(count) });
}
