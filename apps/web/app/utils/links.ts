export function httpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    /* Legacy content may contain an invalid URL. */
  }
}
export function youtubeEmbed(value: string) {
  const href = httpUrl(value);
  if (!href) return;
  const url = new URL(href);
  let id: string | null | undefined;
  if (url.hostname === "youtu.be") id = /^\/([\w-]{11})\/?$/.exec(url.pathname)?.[1];
  if (["youtube.com", "www.youtube.com"].includes(url.hostname)) {
    id =
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : /^\/shorts\/([\w-]{11})\/?$/.exec(url.pathname)?.[1];
  }
  if (id && /^[\w-]{11}$/.test(id)) return "https://www.youtube-nocookie.com/embed/" + id;
}
