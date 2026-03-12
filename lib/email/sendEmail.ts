// lib/email/sendEmail.ts
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY не задан");

  const from =
    process.env.EMAIL_FROM || "Menora Center <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      ...(replyTo ? { replyTo } : {}),
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(
      json?.message || json?.error || "Ошибка отправки email (Resend)",
    );

  return json as { id: string };
}
