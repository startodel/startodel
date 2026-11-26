import documents from "../utils/legal.generated.json";

export function useLegalDocument(name: keyof typeof documents) {
  const { locale } = useI18n();
  const doc = computed(() => documents[name][locale.value]);
  usePublicHead(doc.value.title, doc.value.body.split("\n\n")[1] ?? doc.value.title, "/" + name);
  return doc;
}
