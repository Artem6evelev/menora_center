/* Future rollout only. check is read-only; apply requires explicit production confirmation. */
async function configure(mode, env = process.env, fetcher = fetch) {
  if (!["check", "apply"].includes(mode))
    throw new Error(
      "Usage: configure-telegram.cjs check|apply --confirm-production",
    );
  const token = env.TELEGRAM_BOT_TOKEN,
    secret = env.TELEGRAM_WEBHOOK_SECRET,
    username = env.TELEGRAM_BOT_USERNAME;
  if (!/^\d{5,16}:[A-Za-z0-9_-]{20,}$/.test(token || "") || !username)
    throw new Error("Bot environment missing/invalid");
  const app = new URL(env.NEXT_PUBLIC_APP_URL || "");
  if (
    app.protocol !== "https:" ||
    app.username ||
    app.password ||
    app.pathname !== "/" ||
    app.search ||
    app.hash
  )
    throw new Error("Production APP URL invalid");
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(secret || ""))
    throw new Error("Webhook secret missing/invalid");
  async function api(method, body = {}) {
    let data;
    try {
      const response = await fetcher(
        `https://api.telegram.org/bot${token}/${method}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(7000),
        },
      );
      data = await response.json();
    } catch {
      throw new Error("Telegram API unavailable; details omitted");
    }
    if (data?.ok !== true)
      throw new Error("Telegram API rejected operation; details omitted");
    return data.result;
  }
  const me = await api("getMe");
  if (me.username !== username || me.is_bot !== true)
    throw new Error("Bot username mismatch; nothing changed");
  const webhookUrl = new URL("/api/telegram/webhook", app).toString(),
    miniappUrl = new URL("/miniapp", app).toString();
  if (mode === "check") {
    const webhook = await api("getWebhookInfo"),
      menu = await api("getChatMenuButton");
    return {
      botMatches: true,
      webhookMatches: webhook.url === webhookUrl,
      webhookErrorPresent: !!webhook.last_error_date,
      menuMatches: menu.type === "web_app" && menu.web_app?.url === miniappUrl,
      secretTokenReadable: false,
      mutated: false,
    };
  }
  await api("setWebhook", {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  });
  await api("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Menorah Center",
      web_app: { url: miniappUrl },
    },
  });
  await api("setMyCommands", {
    commands: [
      { command: "start", description: "Открыть Menorah Center" },
      { command: "subscribe", description: "Получать анонсы" },
      { command: "unsubscribe", description: "Отключить анонсы" },
    ],
  });
  return { applied: true, pendingUpdatesDropped: false };
}
module.exports = { configure };
if (require.main === module) {
  const mode = process.argv[2];
  if (mode === "apply" && !process.argv.includes("--confirm-production")) {
    console.error("apply requires --confirm-production");
    process.exitCode = 1;
  } else
    configure(mode)
      .then((result) => console.log(JSON.stringify(result)))
      .catch(() => {
        console.error(
          "Telegram configuration failed. Check environment and private provider dashboard; values omitted.",
        );
        process.exitCode = 1;
      });
}
