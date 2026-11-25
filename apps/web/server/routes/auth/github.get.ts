import { sendRedirect } from "nuxt/server";
import { signIn } from "../../lib/database";

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    const account = await signIn({
      githubId: BigInt(user.id),
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
    });
    await replaceUserSession(event, { user: account });
    return sendRedirect(event, "/");
  },
  onError(event) {
    return sendRedirect(event, "/login");
  },
});
