import { getCookie, sendRedirect, type RequestEvent } from "nuxt/server";
import { signIn } from "../../lib/database";
import { languageCookie, localizedPath } from "../../../shared/locale";

function destination(event: RequestEvent, path: string) {
  return localizedPath(path, getCookie(event, languageCookie) === "en" ? "en" : "ru");
}

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    const account = await signIn({
      githubId: BigInt(user.id),
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
    });
    await replaceUserSession(event, { user: account });
    return sendRedirect(event, destination(event, "/dashboard"));
  },
  onError(event) {
    return sendRedirect(event, destination(event, "/") + "?error=oauth");
  },
});
