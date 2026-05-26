import app from "./app.js";
import { logger } from "./lib/logger.js";
import { createBot } from "./bot/bot.js";

// ── Global crash guards ────────────────────────────────────────────────────
// These stop ANY unhandled error from killing the process.
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaughtException — recovered");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandledRejection — recovered");
});

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const botToken = process.env["TELEGRAM_BOT_TOKEN"];
const adminChatId = process.env["ADMIN_CHAT_ID"];
if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is required.");
if (!adminChatId) throw new Error("ADMIN_CHAT_ID is required.");

// ── Start bot with auto-restart ────────────────────────────────────────────
function launchBot() {
  try {
    createBot(botToken!, adminChatId!, () => {
      // Called when polling crashes — restart after 5 s
      logger.warn("Bot polling stopped — restarting in 5 s...");
      setTimeout(launchBot, 5000);
    });
  } catch (err) {
    logger.error({ err }, "Bot failed to start — retrying in 10 s");
    setTimeout(launchBot, 10000);
  }
}
launchBot();

// ── HTTP server ────────────────────────────────────────────────────────────
app.listen(port, (err) => {
  if (err) { logger.error({ err }, "Error listening"); process.exit(1); }
  logger.info({ port }, "Server listening");
});

// ── Keep-alive self-ping every 4 minutes ──────────────────────────────────
// Prevents Replit from sleeping the container.
const selfUrl = `http://localhost:${port}/api/health`;
setInterval(async () => {
  try {
    const res = await fetch(selfUrl);
    logger.debug({ status: res.status }, "keep-alive ping");
  } catch {
    // silence — server might be briefly restarting
  }
}, 4 * 60 * 1000);
