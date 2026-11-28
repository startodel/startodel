import {
  OAuthClientMetadataSchema,
  OAuthErrorResponseSchema,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { z } from "zod";

export class OAuthError extends Error {
  constructor(
    readonly error: string,
    readonly status = 400,
  ) {
    super(error);
  }
  response() {
    return Response.json(OAuthErrorResponseSchema.parse({ error: this.error }), {
      status: this.status,
      headers: this.status === 401 ? { "WWW-Authenticate": 'Basic realm="OAuth"' } : {},
    });
  }
}
export const methods = ["none", "client_secret_post", "client_secret_basic"] as const;
export const grantTypes = ["authorization_code", "refresh_token"] as const;
export function scope(value?: string) {
  if (value?.trim() && value.trim() !== "mcp") throw new OAuthError("invalid_scope");
  return "mcp";
}
// The MCP endpoint is the only protected resource, so an omitted indicator means it (RFC 8707).
export function resourceIndicator(issuer: string, value?: string) {
  const resource = issuer + "/mcp";
  if (value !== undefined && value !== "" && value !== resource)
    throw new OAuthError("invalid_target");
  return resource;
}
function safeRedirect(value: string) {
  const url = new URL(value);
  return (
    /^https?:\/\//i.test(value) &&
    !/[\s\\#]/u.test(value) &&
    !url.username &&
    !url.password &&
    (url.protocol === "https:" ||
      (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
  );
}
const clientMetadata = OAuthClientMetadataSchema.extend({
  client_name: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[^\p{Cc}\p{Cf}]+$/u)
    .optional(),
  token_endpoint_auth_method: z.enum(methods).default("client_secret_basic"),
  grant_types: z
    .array(z.enum(grantTypes))
    .min(1)
    .default([...grantTypes]),
  response_types: z.array(z.literal("code")).length(1).default(["code"]),
});
export function registration(input: unknown) {
  const result = clientMetadata.safeParse(input);
  if (!result.success) throw new OAuthError("invalid_client_metadata");
  const { redirect_uris } = result.data;
  if (
    !redirect_uris.length ||
    redirect_uris.length > 16 ||
    redirect_uris.some((uri) => uri.length > 2048 || !safeRedirect(uri))
  )
    throw new OAuthError("invalid_redirect_uri");
  if (!result.data.grant_types.includes("authorization_code"))
    throw new OAuthError("invalid_client_metadata");
  // RFC 7591 returns the metadata actually assigned to this registration.
  return {
    redirect_uris,
    client_name: result.data.client_name,
    token_endpoint_auth_method: result.data.token_endpoint_auth_method,
    response_types: ["code"],
    grant_types: [...grantTypes],
    scope: scope(result.data.scope),
  };
}

export function parameters(params: URLSearchParams): Record<string, string | undefined> {
  const values: Record<string, string> = Object.create(null);
  for (const [key, value] of params) {
    if (Object.hasOwn(values, key)) throw new OAuthError("invalid_request");
    values[key] = value;
  }
  return values;
}

export function redirectResult(
  uri: string,
  issuer: string,
  state: string | null | undefined,
  result: { code: string } | { error: string },
) {
  const url = new URL(uri);
  for (const key of ["state", "error", "code", "iss"]) url.searchParams.delete(key);
  url.searchParams.set("iss", issuer);
  if (state !== undefined && state !== null) url.searchParams.set("state", state);
  for (const [key, value] of Object.entries(result)) url.searchParams.set(key, value);
  return url.href;
}
