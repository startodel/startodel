import { defineHandler, getCookie, useRuntimeConfig, type RequestEvent } from "nuxt/server";
import { z } from "zod";
import { authenticateOAuthClient } from "@startodel/db";
import { database } from "./pool";
import { OAuthError, parameters } from "./oauth-policy";
import { languageCookie, localizedPath } from "../../shared/locale";

export function publicOrigin(event: RequestEvent) {
  const callback = useRuntimeConfig().oauth.github.redirectURL;
  const url = new URL(callback || event.req.url);
  if (
    !callback &&
    process.env.NODE_ENV === "production" &&
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  )
    throw new Error("Configure the public GitHub callback URL");
  return url.origin;
}
export function localized(event: RequestEvent, path: string) {
  return localizedPath(path, getCookie(event, languageCookie) === "ru" ? "ru" : "en");
}
export function consentPath(id: string) {
  return "/consent?request=" + encodeURIComponent(id);
}
export function pendingRequest(session: {
  secure?: { oauthPending?: { id: string; expires: number } | null };
}) {
  const pending = session.secure?.oauthPending;
  return pending && pending.expires > Date.now() ? pending : undefined;
}
export function oauthEndpoint(
  method: "GET" | "POST",
  cors: boolean,
  handle: (event: RequestEvent) => unknown,
) {
  return defineHandler(async (event) => {
    const headers = event.res.headers;
    headers.set("cache-control", "no-store");
    headers.set("referrer-policy", "no-referrer");
    if (cors) {
      headers.set("access-control-allow-origin", "*");
      headers.set("access-control-allow-methods", method + ", OPTIONS");
      headers.set(
        "access-control-allow-headers",
        "Authorization, Content-Type, MCP-Protocol-Version",
      );
      if (event.req.method === "OPTIONS") return new Response(null, { status: 204 });
    }
    if (event.req.method !== method)
      return new Response(null, { status: 405, headers: { Allow: method } });
    try {
      return await handle(event);
    } catch (e) {
      if (e instanceof OAuthError) return e.response();
      throw e;
    }
  });
}
export async function bodyText(event: RequestEvent, media: string) {
  if (event.req.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== media)
    throw new OAuthError("invalid_request", 415);
  const reader = event.req.body?.getReader();
  if (!reader) throw new OAuthError("invalid_request");
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      throw new OAuthError("invalid_request", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function form(event: RequestEvent) {
  return parameters(
    new URLSearchParams(await bodyText(event, "application/x-www-form-urlencoded")),
  );
}
export async function clientAuthentication(
  event: RequestEvent,
  input: Record<string, string | undefined>,
) {
  let id = input.client_id;
  let secret = input.client_secret;
  const header = event.req.headers.get("authorization");
  let method: "none" | "client_secret_basic" | "client_secret_post" =
    secret === undefined ? "none" : "client_secret_post";
  if (header !== null) {
    const encoded = /^Basic ([A-Za-z0-9+/]+=*)$/i.exec(header)?.[1];
    if (!encoded || secret !== undefined) throw new OAuthError("invalid_client", 401);
    const match = /^([^:]*):(.*)$/.exec(Buffer.from(encoded, "base64").toString());
    if (!match) throw new OAuthError("invalid_client", 401);
    try {
      const decode = (s: string) => decodeURIComponent(s.replaceAll("+", " "));
      const basicId = decode(match[1]!);
      if (id !== undefined && basicId !== id) throw new Error();
      id = basicId;
      secret = decode(match[2]!);
    } catch {
      throw new OAuthError("invalid_client", 401);
    }
    method = "client_secret_basic";
  }
  if (
    !id ||
    !z.uuid().safeParse(id).success ||
    !(await authenticateOAuthClient(database(), id, method, secret))
  )
    throw new OAuthError("invalid_client", 401);
  return id;
}
