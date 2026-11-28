import { env } from "node:process";
import { channel } from "node:diagnostics_channel";
import nodemailer from "nodemailer";

export function mailTransportMode() {
  if (env.NODE_ENV === "test" || env.NODE_ENV === "development" || env.MAIL_TRANSPORT === "capture")
    return "capture";
  return env.SMTP_HOST ? "smtp" : "unavailable";
}

export async function sendMail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const mode = mailTransportMode();
  if (mode === "unavailable") throw new Error("SMTP_HOST is required");
  const from = env.MAIL_FROM;
  if (mode === "capture") {
    const captured = { ...message, from: from || "Startodel <test@example.invalid>" };
    await nodemailer.createTransport({ jsonTransport: true }).sendMail(captured);
    channel("startodel.test.mail").publish(captured);
    return;
  }
  if (!from) throw new Error("MAIL_FROM is required");
  await nodemailer
    .createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 465),
      secure: env.SMTP_SECURE === "true",
      ...(env.SMTP_USER && { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }),
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })
    .sendMail({ ...message, from });
}
