import cron from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "../lib/logger.js";

// process.cwd() = artifacts/api-server/ when running `node dist/index.mjs`
// This stays correct even after esbuild bundles everything into dist/index.mjs
const DATA_DIR = join(process.cwd(), "data");
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
      const parsed = JSON.parse(raw);
      // Validate shape
      if (Array.isArray(parsed.channels) && typeof parsed.hour === "number") {
        return parsed;
      }
    }
  } catch (err) {
    logger.warn({ err }, "Could not load scheduler config, using defaults");
  }
  return { channels: [], hour: 12, minute: 0 };
}

function saveConfig(cfg: SchedulerConfig): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
  } catch (err) {
    logger.error({ err }, "Could not save scheduler config");
  }
}

let config = loadConfig();
let currentTask: cron.ScheduledTask | null = null;

export function getChannels(): string[] { return config.channels; }
export function getScheduleTime(): { hour: number; minute: number } {
  return { hour: config.hour, minute: config.minute };
}

export function addChannel(channel: string): boolean {
  const norm = channel.startsWith("@") || channel.startsWith("-") ? channel : `@${channel}`;
  if (config.channels.includes(norm)) return false;
  config.channels.push(norm);
  saveConfig(config);
  return true;
}

export function removeChannel(channel: string): boolean {
  const norm = channel.startsWith("@") || channel.startsWith("-") ? channel : `@${channel}`;
  const idx = config.channels.indexOf(norm);
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
    } catch (err: any) {
      fail.push(channel);
      logger.warn({ channel, err: err?.message }, "Failed to send promo to channel");
    }
  }
  return { ok, fail };
}

export function startScheduler(bot: TelegramBot): void {
  // Destroy previous task fully before creating a new one
  if (currentTask) {
    try { currentTask.stop(); } catch {}
    currentTask = null;
  }

  const { hour, minute } = config;
  const cronExpr = `${minute} ${hour} * * *`;

  currentTask = cron.schedule(
    cronExpr,
    async () => {
      logger.info({ channels: config.channels }, "Scheduled promo triggered");
      if (config.channels.length === 0) return;
      await sendPromoToAll(bot);
    },
    { timezone: "UTC" }   // Always UTC — user uses /orario with UTC times
  );

  logger.info({ cronExpr }, "Scheduler (re)started");
}
