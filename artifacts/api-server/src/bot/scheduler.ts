import cron from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { logger } from "../lib/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const CONFIG_FILE = join(DATA_DIR, "scheduler.json");

export const PROMO_MESSAGE = `🇮🇹-SHIP -🇮🇹
✅ESCROW✅
📮INPOST/UPS📮
📊CRYPTO PAY📊
📲@songoh4sh📲
🤖@lacasadeifantasminew_bot🤖


•🍞MOUSSE🍞
•🍫DRY SIFT🍫
•❄️FROZEN SIFT❄️
•🥶FRESH FROZEN🥶
•⚡️STATIC/PLASMA⚡️
•🧊ICE-O-LATOR🧊
•🧇CRUMBLE🧇
•🧈BUDDER🧈
•💎WPFF💎
•🍯WAX🍯
•🏆PIATTELLA🏆


🌳WEED🌳
•🇪🇸SPAIN🇪🇸
•🇺🇸🇪🇸SPALI🇪🇸🇺🇸
•🇺🇸CALI🇺🇸


🔘OTHERS🔘
•🖊️VAPES🖊️
•🍭EDIBLES🍭`;

interface SchedulerConfig {
  channels: string[];
  hour: number;
  minute: number;
}

function loadConfig(): SchedulerConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return { channels: [], hour: 12, minute: 0 };
}

function saveConfig(config: SchedulerConfig): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

let config = loadConfig();
let currentTask: cron.ScheduledTask | null = null;

export function getChannels(): string[] {
  return config.channels;
}

export function getScheduleTime(): { hour: number; minute: number } {
  return { hour: config.hour, minute: config.minute };
}

export function addChannel(channel: string): boolean {
  const normalized = channel.startsWith("@") || channel.startsWith("-")
    ? channel
    : `@${channel}`;
  if (config.channels.includes(normalized)) return false;
  config.channels.push(normalized);
  saveConfig(config);
  return true;
}

export function removeChannel(channel: string): boolean {
  const normalized = channel.startsWith("@") || channel.startsWith("-")
    ? channel
    : `@${channel}`;
  const idx = config.channels.indexOf(normalized);
  if (idx === -1) return false;
  config.channels.splice(idx, 1);
  saveConfig(config);
  return true;
}

export function setScheduleTime(hour: number, minute: number): void {
  config.hour = hour;
  config.minute = minute;
  saveConfig(config);
}

export async function sendPromoToAll(bot: TelegramBot): Promise<{ ok: string[]; fail: string[] }> {
  const ok: string[] = [];
  const fail: string[] = [];

  for (const channel of config.channels) {
    try {
      await bot.sendMessage(channel, PROMO_MESSAGE);
      ok.push(channel);
      logger.info({ channel }, "Promo sent");
    } catch (err) {
      fail.push(channel);
      logger.error({ err, channel }, "Failed to send promo");
    }
  }
  return { ok, fail };
}

export function startScheduler(bot: TelegramBot): void {
  if (currentTask) {
    currentTask.stop();
  }

  const { hour, minute } = config;
  // Cron runs in UTC — Italy is UTC+2 (CEST) or UTC+1 (CET)
  // We'll use UTC and let the user pick their local time converted to UTC
  const cronExpr = `${minute} ${hour} * * *`;

  currentTask = cron.schedule(cronExpr, async () => {
    logger.info({ channels: config.channels }, "Scheduled promo send triggered");
    await sendPromoToAll(bot);
  });

  logger.info({ cronExpr }, "Scheduler started");
}

export function restartScheduler(bot: TelegramBot): void {
  startScheduler(bot);
}
