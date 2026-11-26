import { randomInt } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

// Only the provider's token and identity endpoints are replaced. The app handles
// OAuth state and issues its own sealed Session cookie through /auth/github.
export async function localGitHub() {
  const id = -randomInt(1, 2 ** 44) * 16;
  const users = [
    { id, login: "alice", name: "Alice", avatar_url: "https://example.org/alice.png" },
    { id: id - 1, login: "bob", name: "Bob", avatar_url: null },
    ...[
      "practice",
      "reader",
      "guide",
      "schedule",
      "publisher",
      "forker",
      "learning-pages",
      "slug-owner",
      "slug-reader",
      "dashboard",
      "hero",
      "hero-schedule",
    ].map((login, i) => ({
      id: id - 2 - i,
      login,
      name: login,
      avatar_url: null,
    })),
  ];
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/token" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const code = new URLSearchParams(body).get("code");
      res.end(JSON.stringify({ access_token: code, token_type: "bearer" }));
      return;
    }
    const user = users.find(({ login }) => req.headers.authorization === `token ${login}`);
    if (req.url !== "/user" || !user) res.writeHead(404);
    res.end(JSON.stringify(user ?? {}));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { users, origin, close: () => server.close() };
}
