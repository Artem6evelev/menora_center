import nodemailer from "nodemailer";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
/** Existing welcome email remains best-effort; delivery never changes profile save success. */
export async function sendCommunityWelcome(email: string, firstName: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    const transport = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
    await transport.sendMail({ from: `"Menorah Rishon" <${process.env.EMAIL_USER}>`, to: email,
      subject: "Добро пожаловать в Menorah Center!",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px"><h1 style="color:#b77900">Menorah Center</h1><p>Здравствуйте, ${escapeHtml(firstName)}!</p><p>Ваша анкета общины сохранена. Спасибо за интерес к Menorah Center!</p><p><a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com")}/dashboard">Личный кабинет</a></p></div>` });
  } catch { console.error("Не удалось доставить приветственное письмо"); }
}
