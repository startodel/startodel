// Finds style declarations that win only by source order.
//
// A development server injects one stylesheet per component, in the order the components load. A
// production build merges them into chunks in another order. When two rules from different files
// set the same property on the same element with the same specificity, the winner differs between
// the two, so a page can look right in development and wrong once deployed.
//
// Run against a development server, from the workspace root:
//   pnpm dev
//   node apps/web/test/cascade.mjs http://localhost:3000 /design/components /design/screens/track
// PLAYWRIGHT_MODULE may point to a local installation. CHROME may point to a browser binary.
// The script exits with 1 when it finds a tie.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

/** Runs in the page. Returns the pairs of rules that tie, each with the properties both set. */
function findTies() {
  const states = /:(hover|focus-visible|focus-within|focus|active|autofill)(?![\w-])/g;
  const legacyPseudoElements = new Set(["before", "after", "first-line", "first-letter"]);

  function splitTop(list) {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < list.length; i++) {
      const ch = list[i];
      if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth--;
      else if (ch === "," && depth === 0) {
        parts.push(list.slice(start, i));
        start = i + 1;
      }
    }
    parts.push(list.slice(start));
    return parts.map((part) => part.trim()).filter(Boolean);
  }
  function closing(text, open) {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
      if (text[i] === "(") depth++;
      else if (text[i] === ")" && --depth === 0) return i;
    }
    return text.length - 1;
  }
  function identEnd(text, from) {
    let i = from;
    while (i < text.length && /[\w-]/.test(text[i])) i++;
    return i;
  }
  const most = (list) =>
    splitTop(list)
      .map(specificity)
      .reduce((a, b) => (compare(a, b) >= 0 ? a : b), [0, 0, 0]);
  const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

  function specificity(selector) {
    const total = [0, 0, 0];
    const add = (s) => s.forEach((n, i) => (total[i] += n));
    let i = 0;
    while (i < selector.length) {
      const ch = selector[i];
      if (ch === "#") {
        total[0]++;
        i = identEnd(selector, i + 1);
      } else if (ch === ".") {
        total[1]++;
        i = identEnd(selector, i + 1);
      } else if (ch === "[") {
        total[1]++;
        i = selector.indexOf("]", i) + 1 || selector.length;
      } else if (ch === ":") {
        const element = selector[i + 1] === ":";
        const nameStart = i + (element ? 2 : 1);
        const nameEnd = identEnd(selector, nameStart);
        const name = selector.slice(nameStart, nameEnd).toLowerCase();
        let inner = null;
        i = nameEnd;
        if (selector[i] === "(") {
          const end = closing(selector, i);
          inner = selector.slice(i + 1, end);
          i = end + 1;
        }
        if (element || legacyPseudoElements.has(name)) total[2]++;
        else if (name === "where") continue;
        else if (name === "is" || name === "not" || name === "has") add(most(inner ?? ""));
        else {
          total[1]++;
          const of = inner?.split(/\sof\s/)[1];
          if (of && name.startsWith("nth-")) add(most(of));
        }
      } else if (/[a-zA-Z]/.test(ch)) {
        total[2]++;
        i = identEnd(selector, i);
      } else i++;
    }
    return total;
  }

  // One entry per selector of every style rule, with the file it came from.
  const entries = [];
  const sheets = new Map();
  function walk(rules, source, condition) {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        const properties = [...rule.style];
        for (const selector of splitTop(rule.selectorText)) {
          // A state is assumed to hold: ":hover" alone becomes "*", ".a:hover" becomes ".a".
          const relaxed = selector
            .replace(new RegExp("(^|[\\s>+~(,])" + states.source, "g"), "$1*")
            .replace(states, "");
          try {
            document.querySelector(relaxed);
          } catch {
            continue;
          }
          entries.push({
            selector,
            relaxed,
            source,
            specificity: specificity(selector),
            conditional: Boolean(condition) || relaxed !== selector,
            properties,
            style: rule.style,
          });
        }
        if (rule.cssRules?.length) walk(rule.cssRules, source, condition);
      } else if (rule.cssRules) {
        const text = rule.conditionText ?? rule.name ?? "";
        walk(
          rule.cssRules,
          source,
          (condition ? condition + " " : "") + rule.constructor.name + text,
        );
      }
    }
  }
  for (const sheet of document.styleSheets) {
    const node = sheet.ownerNode;
    const id = node?.dataset?.viteDevId ?? sheet.href ?? "inline-" + sheets.size;
    const source = id.replace(/^.*\/apps\/web\//, "").replace(/\?.*?(scoped=\w+)?.*$/, "");
    if (sheets.has(id)) continue;
    sheets.set(id, source);
    try {
      walk(sheet.cssRules, source, "");
    } catch {
      // A cross-origin sheet cannot be read.
    }
  }

  const ties = new Map();
  const roots = document.querySelectorAll(".s-root, .s-root *");
  for (const element of roots) {
    const byProperty = new Map();
    for (const entry of entries) {
      let matches = false;
      try {
        matches = element.matches(entry.relaxed);
      } catch {
        // An unsupported selector matches nothing.
      }
      if (!matches) continue;
      for (const property of entry.properties) {
        if (!byProperty.has(property)) byProperty.set(property, []);
        byProperty.get(property).push(entry);
      }
    }
    for (const [property, list] of byProperty) {
      if (list.length < 2) continue;
      const value = (entry) =>
        entry.style.getPropertyValue(property) + entry.style.getPropertyPriority(property);
      const plain = list.filter((entry) => !entry.conditional);
      const top = plain.reduce(
        (best, entry) => (compare(entry.specificity, best) > 0 ? entry.specificity : best),
        [0, 0, 0],
      );
      // A rule matters when nothing unconditional out-ranks it.
      const contenders = list.filter((entry) => compare(entry.specificity, top) >= 0);
      for (const a of contenders) {
        for (const b of contenders) {
          if (a.source >= b.source) continue;
          if (compare(a.specificity, b.specificity) !== 0) continue;
          if (value(a) === value(b)) continue;
          const key = `${a.source} :: ${a.selector}\n    ${b.source} :: ${b.selector}`;
          if (!ties.has(key)) ties.set(key, new Set());
          ties.get(key).add(property);
        }
      }
    }
  }
  return [...ties].map(([key, properties]) => [key, [...properties]]);
}

/** Check the rendered route in its existing browser Session, including interactive states. */
export async function checkCascade(page, path = new URL(page.url()).pathname) {
  const previous = page.viewportSize();
  const widths = (process.env.WIDTHS || "390,1440").split(",").map(Number);
  try {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      assert.equal(
        new URL(page.url()).pathname,
        path,
        "unexpected redirect while checking " + path,
      );
      await page.locator(".s-root").first().waitFor();
      const ties = await page.evaluate(findTies);
      assert.deepEqual(ties, [], path + " at " + width + "px: " + JSON.stringify(ties));
    }
    console.log(path + " · " + widths.join(" / ") + "px · 0 order-dependent rules");
  } finally {
    if (previous) await page.setViewportSize(previous);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , origin, ...paths] = process.argv;
  assert.ok(origin && paths.length, "usage: node apps/web/test/cascade.mjs <origin> <path>...");
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  try {
    const page = await browser.newPage();
    for (const path of paths) {
      const url = new URL(path, origin);
      const response = await page.goto(url.href, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200);
      await checkCascade(page, url.pathname);
    }
  } finally {
    await browser.close();
  }
}
