import {
  createError,
  defineHandler,
  getCookie,
  getQuery,
  sendRedirect,
  type RequestEvent,
} from "nuxt/server";
import { SignInConflict } from "@startodel/db";
import { signIn } from "../../lib/database";
import { requireUser } from "../../utils/require-user";
import { languageCookie, localizedPath } from "../../../shared/locale";

function destination(event: RequestEvent, path: string) {
  return localizedPath(path, getCookie(event, languageCookie) === "ru" ? "ru" : "en");
}

async function verifiedPrimaryEmail(token: string) {
  const api = useRuntimeConfig().oauth.github.apiURL;
  for (let page = 1; ; page++) {
    const emails = await $fetch<{ email: string; verified: boolean; primary: boolean }[]>(
      api + "/user/emails",
      {
        query: { per_page: 100, page },
        headers: { Authorization: "token " + token, "User-Agent": "Startodel" },
        retry: 0,
        timeout: 10000,
      },
    );
    const primary = emails.find((entry) => entry.primary === true);
    if (primary || emails.length < 100)
      return primary?.verified === true ? primary.email : undefined;
  }
}

const oauth = defineOAuthGitHubEventHandler({
  config: { scope: ["user:email"] },
  async onSuccess(event, { user, tokens }) {
    const session = await getUserSession(event);
    const linkOwner =
      session.secure?.githubLinkState === getQuery(event).state ? session.user?.id : undefined;
    try {
      const account = await signIn(
        {
          githubId: BigInt(user.id),
          login: user.login,
          name: user.name,
          avatarUrl: user.avatar_url,
          verifiedPrimaryEmail: await verifiedPrimaryEmail(tokens.access_token),
        },
        linkOwner,
      );
      await replaceUserSession(event, { user: account });
      return sendRedirect(event, destination(event, linkOwner ? "/settings" : "/dashboard"));
    } catch (error) {
      return sendRedirect(
        event,
        destination(event, linkOwner ? "/settings" : "/signin") +
          (error instanceof SignInConflict ? "?error=conflict" : "?error=oauth"),
      );
    }
  },
  async onError(event) {
    const session = await getUserSession(event);
    const state = getQuery(event).state;
    const linking = state && session.secure?.githubLinkState === state;
    return sendRedirect(event, destination(event, linking ? "/settings" : "/") + "?error=oauth");
  },
});

export default defineHandler(async (event) => {
  if (event.req.method === "GET") return oauth(event);
  if (event.req.method !== "POST") throw createError({ status: 405 });
  await requireUser(event);
  const origin = new URL(useRuntimeConfig().oauth.github.redirectURL || event.req.url).origin;
  if (event.req.headers.get("origin") !== origin || new URL(event.req.url).search)
    throw createError({ status: 403 });
  const redirect = await oauth(event);
  const location = event.res.headers.get("location");
  const state = location && new URL(location, origin).searchParams.get("state");
  if (state) await setUserSession(event, { secure: { githubLinkState: state } });
  return redirect;
});
