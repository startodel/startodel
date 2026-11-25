import { expect, test } from "vite-plus/test";
import { renderMarkdown } from "../app/utils/markdown";
import { httpUrl, youtubeEmbed } from "../app/utils/links";

test("Lesson Markdown escapes HTML and admits only HTTP(S) links", () => {
  const html = renderMarkdown(
    "<b>example</b> [bad](javascript:alert) [relative](/here) https://example.org/path",
    "Image:",
  );
  expect(html).toContain("&lt;b&gt;example&lt;/b&gt;");
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain('href="/here"');
  expect(html).toContain('href="https://example.org/path"');
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('target="_blank"');
  for (const url of [
    "data:text/html,hello",
    "//example.org",
    "mailto:a@example.org",
    "javascript:alert",
  ])
    expect(httpUrl(url)).toBeUndefined();
});
test("Video Blocks embed only exact YouTube video IDs on the privacy-enhanced host", () => {
  for (const url of [
    "https://youtu.be/8aGhZQkoFbQ",
    "https://youtube.com/shorts/8aGhZQkoFbQ",
    "https://www.youtube.com/watch?v=8aGhZQkoFbQ&t=20",
  ])
    expect(youtubeEmbed(url)).toBe("https://www.youtube-nocookie.com/embed/8aGhZQkoFbQ");
  for (const url of [
    "https://youtube.com.example/watch?v=8aGhZQkoFbQ",
    "https://youtu.be/short",
    "https://youtu.be/8aGhZQkoFbQ/extra",
    "https://youtube.com/watch?v=8aGhZQkoFbQx",
    "ftp://youtu.be/8aGhZQkoFbQ",
  ])
    expect(youtubeEmbed(url)).toBeUndefined();
});
test("Markdown images show escaped alt text as a safe outbound link", () => {
  const html = renderMarkdown(
    "![<diagram>](https://example.org/p.png) ![x](data:image/png;base64,AA) ![x](javascript:alert)",
    "Изображение:",
  );
  expect(html).toContain('href="https://example.org/p.png"');
  expect(html).toContain("Изображение: &lt;diagram&gt;");
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('target="_blank"');
  expect(html).not.toMatch(/<img|href="(?:javascript|data):/i);
});
