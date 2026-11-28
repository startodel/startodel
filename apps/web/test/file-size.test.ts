import { describe, expect, test } from "vite-plus/test";

import { createFileSize, fileUnit } from "../app/components/ui/files";

describe("file sizes", () => {
  test("picks the largest unit that keeps the number at one or above", () => {
    expect(fileUnit(0)).toBe("kilobyte");
    expect(fileUnit(999)).toBe("kilobyte");
    expect(fileUnit(348_000)).toBe("kilobyte");
    expect(fileUnit(1_000_000)).toBe("megabyte");
    expect(fileUnit(4_200_000_000)).toBe("gigabyte");
    expect(fileUnit(3_000_000_000_000)).toBe("terabyte");
    expect(fileUnit(5e18)).toBe("terabyte");
  });

  test("writes the size in the locale", () => {
    const ru = createFileSize("ru");
    const en = createFileSize("en");
    expect(ru(4_200_000_000).replace(/\s/g, " ")).toBe("4,2 ГБ");
    expect(en(4_200_000_000)).toBe("4.2 GB");
    expect(ru(184_300_000).replace(/\s/g, " ")).toBe("184 МБ");
    expect(en(348_000)).toBe("348 kB");
  });

  test("pins the unit and leaves it out on request", () => {
    const ru = createFileSize("ru");
    expect(ru(4_200_000_000, "gigabyte", true)).toBe("4,2");
    expect(ru(600_000_000, "gigabyte").replace(/\s/g, " ")).toBe("0,6 ГБ");
  });
});
