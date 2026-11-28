import { createHash, randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { checkCascade } from "./cascade.mjs";

export async function checkOAuth({ page, visit, request, origin, directory, cascade, db }) {
  const redirect = "https://chatgpt.com/connector_platform_oauth_redirect";
  const response = await request.post(origin + "/oauth/register", {
    data: { client_name: "ChatGPT", redirect_uris: [redirect], token_endpoint_auth_method: "none" },
  });
  assert.equal(response.status(), 201);
  const { client_id } = await response.json();
  try {
    const verifier = randomBytes(32).toString("base64url");
    const authorization = new URLSearchParams({
      client_id,
      redirect_uri: redirect,
      response_type: "code",
      resource: origin + "/mcp",
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
      state: "screen",
    });
    const begin = async () => {
      const r = await request.get(origin + "/oauth/authorize?" + authorization, {
        maxRedirects: 0,
      });
      assert.equal(r.status(), 302);
      return new URL(r.headers().location, origin).search;
    };
    const screenshots = async (stem, locator) => {
      if (cascade) {
        await checkCascade(page);
        return;
      }
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        if (locator) await locator.scrollIntoViewIfNeeded();
        if (stem.startsWith("consent-specimen") && width === 390) continue;
        await page.screenshot({
          path: directory + "/" + stem + "-" + width + ".png",
          animations: "disabled",
        });
      }
    };
    const pending = await begin();
    for (const locale of ["en", "ru"]) {
      const prefix = locale === "en" ? "" : "/ru";
      await visit(prefix + "/consent" + pending);
      await page
        .getByRole("button", { name: locale === "en" ? "Allow" : "Разрешить", exact: true })
        .waitFor();
      await screenshots("consent-" + locale);
      await visit(prefix + "/design/screens/consent?chrome=0");
      await page.getByRole("heading", { name: /ChatGPT/ }).waitFor();
      await screenshots("consent-specimen-" + locale);
    }
    // Inspect the actual form POST and end navigation locally before following the callback.
    let location;
    await page.route(origin + "/oauth/decision", async (route) => {
      const response = await route.fetch({ maxRedirects: 0 });
      location = response.headers().location;
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: String(response.status()),
      });
    });
    await visit("/consent" + pending);
    await page.getByRole("button", { name: "Allow", exact: true }).click();
    await page.waitForURL(origin + "/oauth/decision", { timeout: 10000 });
    assert.equal(await page.locator("body").innerText(), "303", "consent form response");
    const callback = new URL(location);
    assert.equal(callback.origin + callback.pathname, redirect);
    const code = callback.searchParams.get("code");
    assert.ok(code);
    assert.equal(
      (
        await request.post(origin + "/oauth/token", {
          form: {
            client_id,
            resource: origin + "/mcp",
            grant_type: "authorization_code",
            redirect_uri: redirect,
            code_verifier: verifier,
            code,
          },
        })
      ).status(),
      200,
    );
    for (const locale of ["en", "ru"]) {
      await visit((locale === "ru" ? "/ru" : "") + "/settings");
      const group = page.locator("#connected-apps");
      await group.getByText("ChatGPT", { exact: true }).waitFor();
      await screenshots("settings-connections-" + locale, group);
    }
    await page.getByRole("button", { name: "Отключить", exact: true }).click();
    await page.getByText("Подключений пока нет", { exact: true }).waitFor();
  } finally {
    for (const table of ["oauth_connections", "oauth_requests", "oauth_clients"]) {
      const key = table === "oauth_clients" ? "id" : "client_id";
      await db.$client.query(`delete from ${table} where ${key}=$1`, [client_id]);
    }
  }
}
