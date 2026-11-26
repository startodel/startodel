import { fileURLToPath } from "node:url";
import { renderAsync } from "@resvg/resvg-js";
import { artwork, fontUrls } from "virtual:og-assets";
import { escapeXml } from "./xml";

const font = { loadSystemFonts: false, fontFiles: fontUrls.map((url) => fileURLToPath(url)) };

function lines(value: string, columns: number, limit: number) {
  // Bound the work even for long unbroken titles. Preserve code points when wrapping.
  const chars = Array.from(
    value
      .slice(0, 512)
      .toWellFormed()
      .replace(/[^\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
  const result = [];
  while (chars.length > columns && result.length < limit - 1) {
    const space = chars.lastIndexOf(" ", columns);
    const chunk = chars.splice(0, space > 0 ? space + 1 : columns);
    result.push(chunk.join("").trimEnd());
  }
  if (chars.length > columns) {
    result.push(
      chars
        .slice(0, columns - 1)
        .join("")
        .trimEnd() + "…",
    );
  } else {
    result.push(chars.join(""));
  }
  return result.map(escapeXml);
}

export async function ogImage(title: string, kicker: string, subtitle = "") {
  const size = title.length > 36 ? 54 : 68;
  const titleLines = lines(title, size === 54 ? 17 : 13, 4);
  const top = 340 - ((titleLines.length - 1) * size) / 2;
  // Keep the Signal specimen's wordmark, circuit board and footer. Its copy
  // area uses the same 16px dot grid underneath the localized text.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      width="1200" height="630" font-family="Martian Mono">
    <defs><pattern id="grid" x="-1" y="-1" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#0b100f"/><rect width="2" height="2" fill="#26302d"/>
    </pattern></defs>
    <image width="1200" height="630" xlink:href="${artwork}"/>
    <rect x="48" y="128" width="563" height="400" fill="url(#grid)"/>
    <g transform="translate(72 0) scale(.78 1)">
      <text y="${top - size - 12}" font-size="19" letter-spacing="1.5" fill="#f0935a">${lines(kicker.toUpperCase(), 40, 1)[0]}</text>
      ${titleLines.map((line, i) => `<text y="${top + i * size}" font-size="${size}" fill="#e8ebe5" stroke="#e8ebe5" stroke-width="1">${line}</text>`).join("")}
      <text y="${top + (titleLines.length - 1) * size + 43}" font-size="23" fill="#aab5ae">${lines(subtitle, 39, 1)[0]}</text>
    </g>
  </svg>`;
  const rendered = await renderAsync(svg, { font });
  return new Response(new Uint8Array(rendered.asPng()), {
    headers: { "content-type": "image/png" },
  });
}
