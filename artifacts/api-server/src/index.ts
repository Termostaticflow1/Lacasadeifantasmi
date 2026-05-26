import app from "./app.js";
import { logger } from "./lib/logger.js";
import { createBot } from "./bot/bot.js";

// ── Global crash guards ──────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaughtException — process continues");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandledRejection — process continues");
});

// ── Validate env ─────────────────────────────────────────────────────────────
const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const botToken = process.env["TELEGRAM_BOT_TOKEN"]!;
const adminChatId = process.env["ADMIN_CHAT_ID"]!;
if (!botToken)    throw new Error("TELEGRAM_BOT_TOKEN is required.");
if (!adminChatId) throw new Error("ADMIN_CHAT_ID is required.");

// ── Bot launcher — zero delay, always immediate ──────────────────────────────
// The bot handles all its own polling errors internally and never goes down.
// This outer launcher is only a last-resort safety net.
function launchBot(): void {
  try {
    createBot(botToken, adminChatId, () => {
      // onCrash is only called for truly unrecoverable errors (e.g. bad token).
      // For everything else the bot heals itself. Relaunch immediately.
      logger.warn("Bot onCrash called — relaunching immediately");
      setImmediate(launchBot);
    });
  } catch (err) {
    logger.error({ err }, "Bot failed to start — relaunching immediately");
    setImmediate(launchBot);
  }
}

launchBot();

// ── HTTP server ───────────────────────────────────────────────────────────────
app.listen(port, (err) => {
  if (err) { logger.error({ err }, "Error listening"); process.exit(1); }
  logger.info({ port }, "Server listening");
});

// ── Keep-alive self-ping every 4 minutes ─────────────────────────────────────
const HEALTH_URL = `http://localhost:${port}/api/healthz`;
setInterval(async () => {
  try {
    const res = await fetch(HEALTH_URL);
    if (res.status !== 200) logger.warn({ status: res.status }, "keep-alive ping non-200");
  } catch (err: any) {
    logger.warn({ err: err?.message }, "keep-alive ping failed");
  }
}, 4 * 60 * 1000);
