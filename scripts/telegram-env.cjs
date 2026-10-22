const required = {
  TELEGRAM_BOT_TOKEN: (v) => /^\d{5,16}:[A-Za-z0-9_-]{20,}$/.test(v),
  TELEGRAM_WEBHOOK_SECRET: (v) => /^[A-Za-z0-9_-]{32,256}$/.test(v),
  TELEGRAM_BOT_USERNAME: (v) =>
    /^[A-Za-z0-9_]{5,32}$/.test(v) && /bot$/i.test(v),
  NEXT_PUBLIC_APP_URL: (v) => {
    const u = new URL(v);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      u.pathname === "/" &&
      !u.search &&
      !u.hash
    );
  },
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: (v) =>
    /^\d+$/.test(v) && +v >= 1 && +v <= 86400,
  TELEGRAM_MINIAPP_SESSION_TTL_SECONDS: (v) =>
    /^\d+$/.test(v) && +v >= 60 && +v <= 604800,
  CRON_SECRET: (v) => /^[A-Za-z0-9_-]{32,256}$/.test(v),
  DATABASE_URL: (v) => {
    const u = new URL(v);
    return (
      ["postgres:", "postgresql:"].includes(u.protocol) &&
      !!u.hostname &&
      !!u.pathname
    );
  },
  NEXT_PUBLIC_SUPABASE_URL: (v) => {
    const u = new URL(v);
    return (
      u.protocol === "https:" && !!u.hostname && !u.username && !u.password
    );
  },
  SUPABASE_SERVICE_ROLE_KEY: (v) => v.length >= 32,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: (v) =>
    v.startsWith("pk_live_") && v.length > 20,
  CLERK_SECRET_KEY: (v) => v.startsWith("sk_live_") && v.length > 20,
  CLERK_WEBHOOK_SECRET: (v) => v.startsWith("whsec_") && v.length > 16,
};
function checkEnvironment(env) {
  return Object.entries(required).map(([name, validate]) => {
    const present = typeof env[name] === "string" && !!env[name];
    let valid = false;
    try {
      valid = present && !!validate(env[name]);
    } catch {}
    return { name, present, valid };
  });
}
module.exports = { checkEnvironment };
