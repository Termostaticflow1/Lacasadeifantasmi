import app from "./app.js";
import { logger } from "./lib/logger.js";
import { createBot } from "./bot/bot.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const botToken = process.env["TELEGRAM_BOT_TOKEN"];
const adminChatId = process.env["ADMIN_CHAT_ID"];

if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN environment variable is required.");
}

if (!adminChatId) {
  throw new Error("ADMIN_CHAT_ID environment variable is required.");
}

createBot(botToken, adminChatId);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
