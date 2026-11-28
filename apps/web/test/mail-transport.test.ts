import { afterEach, expect, test, vi } from "vite-plus/test";
import nodemailer from "nodemailer";
import { mailTransportMode, sendMail } from "../server/lib/mail-transport";

vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn() } }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

test.each([
  ["production", "", "", "unavailable"],
  ["production", "", "capture", "capture"],
  ["production", "smtp.example.test", "capture", "capture"],
  ["test", "smtp.example.test", "", "capture"],
  ["development", "smtp.example.test", "", "capture"],
])("mail transport in %s with host %j and override %j is %s", (mode, host, override, expected) => {
  vi.stubEnv("NODE_ENV", mode);
  vi.stubEnv("SMTP_HOST", host);
  vi.stubEnv("MAIL_TRANSPORT", override);
  expect(mailTransportMode()).toBe(expected);
});

test("a configured production server selects SMTP and sends through that transport", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("MAIL_TRANSPORT", undefined);
  vi.stubEnv("SMTP_HOST", "smtp.example.test");
  vi.stubEnv("SMTP_PORT", "465");
  vi.stubEnv("SMTP_SECURE", "true");
  vi.stubEnv("MAIL_FROM", "Startodel <sender@example.test>");
  const send = vi.fn().mockResolvedValue({});
  vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: send } as unknown as ReturnType<
    typeof nodemailer.createTransport
  >);
  const message = {
    to: "learner@example.test",
    subject: "Example",
    text: "Hello",
    html: "<p>Hello</p>",
  };
  expect(mailTransportMode()).toBe("smtp");
  await sendMail(message);
  expect(nodemailer.createTransport).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      host: "smtp.example.test",
      port: 465,
      secure: true,
      socketTimeout: 10000,
    }),
  );
  expect(send).toHaveBeenCalledExactlyOnceWith({
    ...message,
    from: "Startodel <sender@example.test>",
  });
});
