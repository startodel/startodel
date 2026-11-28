import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { checkCascade } from "./cascade.mjs";

export async function checkSignIn({ page, visit, context, directory, cascade, mail, db, signIn }) {
  const origin = new URL(page.url()).origin;
  const address = "learner+" + randomBytes(4).toString("hex") + "@example.test";
  const shot = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name);
    await page.screenshot({ path: directory + "/" + name + ".png", animations: "disabled" });
  };
  try {
    await signIn("email-link");
    const saved = await context.request.put(origin + "/api/profile/questionnaire", {
      data: { experience: "middle", stack: ["SQL"], goals: ["Learn SQL"] },
    });
    assert.equal(saved.status(), 200);
    for (const locale of ["en", "ru"]) {
      const prefix = locale === "ru" ? "/ru" : "";
      const settings = prefix + "/settings";
      await signIn("email-link");
      await visit(settings);
      await page.locator("#sign-in-settings").waitFor();
      if (cascade) await checkCascade(page, settings);
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await shot("settings-signin-" + locale + "-" + width);
      }
      await context.clearCookies();
      await visit(prefix + "/design/screens/signin?chrome=0");
      if (cascade) await checkCascade(page);
      await shot("signin-specimen-" + locale + "-1440");
      if (cascade) {
        await visit(prefix + "/design/screens/signin?chrome=0&state=unavailable");
        assert.equal(await page.locator("input[type=email]").count(), 0);
        await checkCascade(page);
      }
      await visit(prefix + "/signin");
      if (cascade) await checkCascade(page);
      const email = page.locator("input[type=email]");
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await shot("signin-email-" + locale + "-" + width);
      }
      await email.fill(address);
      await page
        .getByRole("button", { name: locale === "ru" ? "Получить код" : "Send code" })
        .click();
      const code = page.locator('[autocomplete="one-time-code"]');
      await code.waitFor();
      if (cascade) await checkCascade(page);
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await shot("signin-code-" + locale + "-" + width);
      }
      if (!cascade) {
        const message = mail.get(address);
        assert.ok(message, "the built server rendered a captured message");
        mail.delete(address);
        await writeFile(directory + "/email-" + locale + ".html", message.html);
        const preview = await context.newPage();
        try {
          await preview.setContent(message.html);
          for (const width of locale === "ru" ? [390, 600] : [600]) {
            const height = await preview
              .locator("body > table")
              .evaluate((el) => Math.ceil(el.getBoundingClientRect().height));
            await preview.setViewportSize({ width, height: Math.max(450, height + 25) });
            await preview.screenshot({
              path: directory + "/email-" + locale + "-" + width + ".png",
              fullPage: true,
            });
          }
        } finally {
          await preview.close();
        }
        if (locale === "ru") {
          await page.goto(message.text.match(/http:\/\/\S+/)[0]);
        } else {
          const digits = message.subject.match(/\d{6}$/)[0];
          await code.fill(digits === "000000" ? "000001" : "000000");
          await page.locator(".s-challenge button[type=submit]").click();
          await page.getByRole("alert").getByText("Incorrect code. Attempts left: 4.").waitFor();
          await code.fill(digits);
          await page.locator(".s-challenge button[type=submit]").click();
        }
        await page.waitForURL(origin + prefix + "/onboarding");
      }
    }
  } finally {
    await db.$client.query("delete from email_challenges where email=$1", [address]);
    await db.$client.query("delete from users where email=$1", [address]);
    await context.clearCookies();
  }
}

export async function checkUnavailableSignIn(browser, origin, directory) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    assert.deepEqual(await (await page.request.get(origin + "/api/auth/email/status")).json(), {
      available: false,
    });
    await page.goto(origin + "/ru/signin");
    await page.waitForFunction(() => window.useNuxtApp?.().isHydrating === false);
    const github = page.getByRole("link", { name: "Войти через GitHub" });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      await github.waitFor();
      assert.equal(await page.locator("input[type=email]").count(), 0);
      assert.equal(await page.getByRole("button", { name: "Получить код" }).count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.screenshot({
      path: directory + "/signin-unavailable-ru-1440.png",
      animations: "disabled",
    });
  } finally {
    await page.close();
  }
}
