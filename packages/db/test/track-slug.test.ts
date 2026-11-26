import { expect, test } from "vite-plus/test";
import { trackSlugFromTitle } from "../src/track-slug.ts";

test.each([
  ["Основы сетей", "osnovy-setey"],
  ["HTTP: Хэш, ёж, щука, юг и якорь!", "http-khesh-yozh-shchuka-yug-i-yakor"],
  ["Объекты, функции и задачи", "obekty-funktsii-i-zadachi"],
  [" --C++ / SQL 101! ", "c-sql-101"],
  ["?! ✨", "track"],
])("generates the Track Slug for %s", (title, slug) => {
  expect(trackSlugFromTitle(title)).toBe(slug);
});
