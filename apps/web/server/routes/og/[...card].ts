import { createError, defineHandler, getRequestURL } from "nuxt/server";
import en from "../../../i18n/locales/en.json";
import ru from "../../../i18n/locales/ru.json";
import { ogImage } from "../../lib/og-image";
import { publicData } from "../../lib/public-reader";
import { found, parseRowId } from "../../utils/input";

export default defineHandler(async (event) => {
  if (event.req.method !== "GET" && event.req.method !== "HEAD")
    return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  const { pathname, searchParams } = getRequestURL(event);
  const copy = searchParams.get("lang") === "en" ? en : ru;
  if (pathname === "/og/site.png") return ogImage(copy.login.heading, copy.login.audience);

  const match = /^\/og\/u\/([^/]+?)(?:\/([^/]+?)(?:\/lessons\/([^/]+))?)?\.png$/.exec(pathname);
  if (!match) throw createError({ status: 404, message: "Not found" });
  const [, login, slug, id] = match;
  if (!slug) {
    const profile = found(await publicData().profile(login!));
    return ogImage(
      profile.name || "@" + profile.login,
      copy.public.tracks + " · " + profile.tracks.length,
      "@" + profile.login,
    );
  }
  if (!id) {
    const track = found(await publicData().track(login!, slug));
    return ogImage(
      track.title,
      copy.track.topics + " · " + track.topics.length,
      "@" + track.author.login,
    );
  }
  const lesson = found(await publicData().lesson(login!, slug, parseRowId(id)));
  return ogImage(lesson.title, "@" + login, lesson.trackTitle);
});
