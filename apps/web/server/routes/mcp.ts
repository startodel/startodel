import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { defineHandler, useRuntimeConfig } from "nuxt/server";
import { mcpData } from "../lib/database";
import { createToolServer } from "../mcp/tools";

export default defineHandler(async (event) => {
  const { req } = event;
  const publicOrigin = new URL(useRuntimeConfig().oauth.github.redirectURL || req.url).origin;
  const token = /^Bearer +([^\s]+)$/i.exec(req.headers.get("authorization") ?? "")?.[1];
  const data = token && (await mcpData(token, publicOrigin));
  if (!data)
    return new Response(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${publicOrigin}/.well-known/oauth-protected-resource/mcp"`,
      },
    });
  const origin = req.headers.get("origin");
  if (origin !== null) {
    if (origin !== publicOrigin) return new Response(null, { status: 403 });
  }
  if (req.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });

  const server = createToolServer(data, publicOrigin);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    return await transport.handleRequest(req);
  } finally {
    await server.close();
  }
});
