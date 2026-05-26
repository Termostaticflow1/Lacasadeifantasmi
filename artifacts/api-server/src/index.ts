import app from "./app.js";
import { logger } from "./lib/logger.js";
import { createBot } from "./bot/bot.js";

// ── Global crash guards ─────────────────────────────────────────────────────
// No error of any kind should ever be able to kill this process.
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaughtException — recovered, process continues");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandledRejection — recovered, process continues");
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

// ── Bot launcher with crash recovery ─────────────────────────────────────────
let botRestartAttempts = 0;

function launchBot(delayMs = 0): void {
  if (delayMs > 0) {
    setTimeout(() => launchBot(0), delayMs);
    return;
  }

  try {
    createBot(botToken, adminChatId, (code?: number) => {
      botRestartAttempts++;

      // 409 = another instance is still running on Telegram side (happens on
      // quick restarts). Wait longer to let the old session expire.
      // 404 = bad token — no point retrying.
      if (code === 404) {
        logger.error("Bot token is invalid (404). Not restarting — check TELEGRAM_BOT_TOKEN.");
        return;
      }

      const delay = code === 409
        ? 30_000  // 30 s — wait for Telegram to drop the other session
        : Math.min(5_000 * botRestartAttempts, 60_000); // exponential backoff, max 60 s

      logger.warn({ code, delay, attempt: botRestartAttempts }, `Bot will restart in ${delay / 1000}s`);
      launchBot(delay);
    });

    botRestartAttempts = 0; // reset on successful start
  } catch (err) {
    botRestartAttempts++;
    const delay = Math.min(5_000 * botRestartAttempts, 60_000);
    logger.error({ err, delay }, `Bot failed to start — retrying in ${delay / 1000}s`);
    launchBot(delay);
  }
}

launchBot();

// ── HTTP server ───────────────────────────────────────────────────────────────
app.listen(port, (err) => {
  if (err) { logger.error({ err }, "Error listening"); process.exit(1); }
  logger.info({ port }, "Server listening");
});

// ── Keep-alive self-ping every 4 minutes ─────────────────────────────────────
// Prevents the Replit container from going to sleep due to inactivity.
const HEALTH_URL = `http://localhost:${port}/api/healthz`;
setInterval(async () => {
  try {
    const res = await fetch(HEALTH_URL);
    if (res.status !== 200) logger.warn({ status: res.status }, "keep-alive ping non-200");
  } catch (err: any) {
    logger.warn({ err: err?.message }, "keep-alive ping failed");
  }
}, 4 * 60 * 1000);
