import nodemailer from "nodemailer";
import { Zalo, ThreadType } from "zalo-api-final";

interface ContactPayload {
  name: string;
  phone: string;
  email?: string;
  message: string;
}

// ─── EMAIL via Gmail SMTP ──────────────────────────────────────
export async function sendEmailNotification(contact: ContactPayload) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !NOTIFY_EMAIL) {
    console.warn("[Notification] Email config missing, skipping email notification.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; border: 2px solid #000; border-radius: 16px; overflow: hidden;">
      <div style="background: #ffd34f; padding: 20px 24px; border-bottom: 2px solid #000;">
        <h2 style="margin: 0; font-size: 20px;">🎨 Khách hàng mới liên hệ!</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #333;">Vẽ zì đó nhận được tin nhắn mới từ form liên hệ website</p>
      </div>
      <div style="padding: 24px; background: #fff;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555; width: 110px;">👤 Họ tên:</td>
            <td style="padding: 8px 0; font-weight: 600;">${contact.name}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 4px; font-weight: bold; color: #555;">📞 Điện thoại:</td>
            <td style="padding: 8px 4px; font-weight: 700; color: #0077cc;">${contact.phone}</td>
          </tr>
          ${contact.email ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">📧 Email:</td>
            <td style="padding: 8px 0;">${contact.email}</td>
          </tr>` : ""}
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 4px; font-weight: bold; color: #555; vertical-align: top;">💬 Nội dung:</td>
            <td style="padding: 8px 4px; line-height: 1.5;">${contact.message}</td>
          </tr>
        </table>
      </div>
      <div style="padding: 16px 24px; background: #f0f0f0; border-top: 2px solid #000; font-size: 12px; color: #666;">
        Thời gian: ${new Date().toLocaleString("vi-VN")} — Vẽ zì đó CMS
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Vẽ zì đó Website" <${SMTP_USER}>`,
    to: NOTIFY_EMAIL,
    subject: `📬 Khách hàng mới: ${contact.name} - ${contact.phone}`,
    html,
  });
}

let zaloApiInstance: any = null;

async function getZaloApi() {
  if (zaloApiInstance) return zaloApiInstance;

  const cookieStr = process.env.ZALO_CREDENTIALS_COOKIE;
  if (!cookieStr) {
    throw new Error("ZALO_CREDENTIALS_COOKIE is not defined in environment variables.");
  }

  const cookie = JSON.parse(cookieStr);
  const imei = process.env.ZALO_CREDENTIALS_IMEI || "c0f3c54d-df78-4ea7-8b01-f2d8b4e7a8db";
  const userAgent = process.env.ZALO_CREDENTIALS_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  const zalo = new Zalo();
  zaloApiInstance = await zalo.login({
    cookie,
    imei,
    userAgent,
  });

  return zaloApiInstance;
}

// ─── ZALO via zalo-api-final ───────────────────────────────────
export async function sendZaloNotification(contact: ContactPayload) {
  const threadId = process.env.ZALO_NOTIFY_THREAD_ID || process.env.ZALO_ADMIN_USER_ID;
  const threadTypeStr = process.env.ZALO_THREAD_TYPE || "user";

  if (!threadId) {
    console.warn("[Notification] Zalo config missing (ZALO_NOTIFY_THREAD_ID or ZALO_ADMIN_USER_ID), skipping Zalo notification.");
    return;
  }

  try {
    const text =
      `🎨 [Vẽ zì đó] Khách hàng mới liên hệ!\n` +
      `👤 Họ tên: ${contact.name}\n` +
      `📞 ĐT: ${contact.phone}\n` +
      `${contact.email ? `📧 Email: ${contact.email}\n` : ""}` +
      `💬 Nội dung: ${contact.message}`;

    const type = threadTypeStr.toLowerCase() === "group" ? ThreadType.Group : ThreadType.User;

    const api = await getZaloApi();
    await api.sendMessage(text, threadId, type);
    console.log("[Notification] Zalo notification sent successfully via zalo-api-final.");
  } catch (err) {
    console.error("[Notification] Zalo send failed, retrying once...", err);
    zaloApiInstance = null; // Clear cached instance on error (maybe session expired)
    try {
      const text =
        `🎨 [Vẽ zì đó] Khách hàng mới liên hệ!\n` +
        `👤 Họ tên: ${contact.name}\n` +
        `📞 ĐT: ${contact.phone}\n` +
        `${contact.email ? `📧 Email: ${contact.email}\n` : ""}` +
        `💬 Nội dung: ${contact.message}`;

      const type = threadTypeStr.toLowerCase() === "group" ? ThreadType.Group : ThreadType.User;

      const api = await getZaloApi();
      await api.sendMessage(text, threadId, type);
      console.log("[Notification] Zalo notification sent successfully on retry.");
    } catch (retryErr) {
      console.error("[Notification] Zalo notification failed on retry:", retryErr);
    }
  }
}

// ─── Combined notify (fire-and-forget, non-blocking) ───────────
export function sendNotifications(contact: ContactPayload) {
  sendEmailNotification(contact).catch((err) =>
    console.error("[Notification] Email error:", err)
  );
  sendZaloNotification(contact).catch((err) =>
    console.error("[Notification] Zalo error:", err)
  );
}

