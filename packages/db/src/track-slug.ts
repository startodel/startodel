import { isUuid } from "@startodel/core";

const russian: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function trackSlugFromTitle(title: string) {
  const latin = title.replace(/[а-яё]/gi, (letter) => russian[letter.toLowerCase()]!);
  return (
    latin
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase()
      .replace(/^-/, "")
      .slice(0, 120)
      .replace(/-$/, "") || "track"
  );
}

const reserved = new Set(["new", "edit", "fork"]);
export function reservedTrackSlug(slug: string) {
  return reserved.has(slug) || isUuid(slug);
}
