import TelegramBot from "node-telegram-bot-api";
import { MENU, findProduct, findVariant } from "./menu.js";
import {
  getState,
  addToCart,
  removeFromCart,
  clearCart,
  resetCheckout,
  cartSummary,
  getCartTotal,
  CheckoutStep,
} from "./state.js";
import {
  mainMenuKeyboard,
  categoryKeyboard,
  subCategoryKeyboard,
  productKeyboard,
  cartKeyboard,
  checkoutConfirmKeyboard,
  backToMainKeyboard,
} from "./keyboards.js";
import {
  addChannel,
  removeChannel,
  getChannels,
  getScheduleTime,
  setScheduleTime,
  sendPromoToAll,
  startScheduler,
  PROMO_MESSAGE,
} from "./scheduler.js";
import { logger } from "../lib/logger.js";

const CHECKOUT_STEPS: CheckoutStep[] = [
  "nome", "cognome", "cap", "citta", "indirizzo", "email", "telefono",
];

const STEP_PROMPTS: Record<CheckoutStep, string> = {
  nome:      "👤 Inserisci il tuo *Nome:*",
  cognome:   "👤 Inserisci il tuo *Cognome:*",
  cap:       "📮 Inserisci il tuo *CAP:*",
  citta:     "🏙️ Inserisci la tua *Citta:*",
  indirizzo: "🏠 Inserisci la tua *Via/Indirizzo:*",
  email:     "📧 Inserisci il tuo *Indirizzo e-mail:*",
  telefono:  "📱 Inserisci il tuo *Numero di telefono:*\n_(facoltativo — invia /skip per saltare)_",
  confirm:   "",
};

// Safe send — never throws, never crashes the process
async function safeSend(
  bot: TelegramBot,
  chatId: number | string,
  text: string,
  opts?: TelegramBot.SendMessageOptions
): Promise<void> {
  try {
    await bot.sendMessage(chatId as any, text, opts);
  } catch (err: any) {
    // 403 = user blocked bot, 400 = bad request, etc. — log and ignore
    logger.warn({ err: err?.message, chatId }, "safeSend failed — ignored");
  }
}

export function createBot(
  token: string,
  adminChatId: string,
  onCrash: (code?: number) => void
): TelegramBot {
  // No library polling — we manage getUpdates ourselves via fetch.
  const bot = new TelegramBot(token, { polling: false });

  function isAdmin(userId: number): boolean {
    return String(userId) === String(adminChatId);
  }

  // ── Manual polling loop ───────────────────────────────────────────────────
  // A plain while(true) loop calling the Telegram getUpdates API directly.
  // No library state, no flags, no bugs. On any network error it waits 200ms
  // and retries. The only way it stops is if the token is invalid (404).
  (async () => {
    const api = `https://api.telegram.org/bot${token}`;
    let offset = 0;

    // Flush any stale updates queued while the bot was offline
    try {
      const r = await fetch(`${api}/getUpdates?timeout=0&limit=1&offset=-1`);
      const j = await r.json() as any;
      if (j.ok && j.result?.length > 0) {
        offset = j.result[j.result.length - 1].update_id + 1;
        logger.info({ offset }, "Flushed stale updates, starting fresh");
      }
    } catch { /* ignore, start from 0 */ }

    logger.info("Manual polling loop started");

    while (true) {
      try {
        const r = await fetch(
          `${api}/getUpdates?timeout=30&offset=${offset}&allowed_updates=["message","callback_query"]`,
          { signal: AbortSignal.timeout(40_000) }  // hard timeout beyond Telegram's own
        );

        // 401/404 = invalid token — fatal, do not retry
        if (r.status === 401 || r.status === 404) {
          logger.error({ status: r.status }, "Invalid bot token — stopping polling");
          onCrash(404);
          return;
        }

        if (!r.ok) {
          logger.warn({ status: r.status }, "getUpdates non-ok — retrying in 200ms");
          await new Promise(res => setTimeout(res, 200));
          continue;
        }

        const j = await r.json() as any;
        if (!j.ok || !Array.isArray(j.result)) {
          await new Promise(res => setTimeout(res, 200));
          continue;
        }

        for (const update of j.result) {
          offset = update.update_id + 1;
          try { bot.processUpdate(update); } catch { /* single update error never stops loop */ }
        }
      } catch {
        // Network error / timeout — retry immediately after 200ms
        await new Promise(res => setTimeout(res, 200));
      }
    }
  })();

  // ── Helpers ───────────────────────────────────────────────────────────────

  async function sendMainMenu(chatId: number, text?: string) {
    await safeSend(
      bot, chatId,
      text || "🇮🇹 *SHIP ITA-ITA* 🇮🇹\n\nBenvenuto! Scegli una categoria dal menu qui sotto:",
      { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() }
    );
  }

  async function sendCart(chatId: number, userId: number) {
    const state = getState(userId);
    await safeSend(bot, chatId, cartSummary(userId), {
      parse_mode: "Markdown",
      reply_markup: cartKeyboard(state.cart.length),
    });
  }

  async function startCheckout(chatId: number, userId: number) {
    const state = getState(userId);
    if (state.cart.length === 0) {
      await safeSend(bot, chatId, "Il carrello e' vuoto!", { reply_markup: backToMainKeyboard() });
      return;
    }
    resetCheckout(userId);
    state.checkoutStep = "nome";
    await safeSend(
      bot, chatId,
      "📋 *Compilazione Ordine*\n\nInserisci i tuoi dati per completare l'ordine.\n\n" + STEP_PROMPTS["nome"],
      { parse_mode: "Markdown" }
    );
  }

  async function nextCheckoutStep(chatId: number, userId: number, value: string) {
    const state = getState(userId);
    const currentStep = state.checkoutStep;
    if (!currentStep || currentStep === "confirm") return;

    switch (currentStep) {
      case "nome":      state.checkoutData.nome = value; break;
      case "cognome":   state.checkoutData.cognome = value; break;
      case "cap":       state.checkoutData.cap = value; break;
      case "citta":     state.checkoutData.citta = value; break;
      case "indirizzo": state.checkoutData.indirizzo = value; break;
      case "email":     state.checkoutData.email = value; break;
      case "telefono":  state.checkoutData.telefono = value === "/skip" ? "(non fornito)" : value; break;
    }

    const nextStep = CHECKOUT_STEPS[CHECKOUT_STEPS.indexOf(currentStep) + 1];
    if (!nextStep) {
      state.checkoutStep = "confirm";
      await sendOrderConfirmation(chatId, userId);
    } else {
      state.checkoutStep = nextStep;
      await safeSend(bot, chatId, STEP_PROMPTS[nextStep], { parse_mode: "Markdown" });
    }
  }

  async function sendOrderConfirmation(chatId: number, userId: number) {
    const state = getState(userId);
    const d = state.checkoutData;
    const summary = cartSummary(userId);
    const confirmText =
      `${summary}\n\n━━━━━━━━━━━━━━━\n📋 *Dati di consegna:*\n\n` +
      `👤 Nome: *${d.nome} ${d.cognome}*\n` +
      `📮 CAP: *${d.cap}*\n` +
      `🏙️ Citta: *${d.citta}*\n` +
      `🏠 Indirizzo: *${d.indirizzo}*\n` +
      `📧 Email: *${d.email}*\n` +
      `📱 Telefono: *${d.telefono || "(non fornito)"}*\n\n` +
      `Confermi l'ordine?`;
    await safeSend(bot, chatId, confirmText, { parse_mode: "Markdown", reply_markup: checkoutConfirmKeyboard() });
  }

  async function confirmOrder(chatId: number, userId: number, username?: string) {
    const state = getState(userId);
    const d = state.checkoutData;
    let msg = `🛍️ *NUOVO ORDINE*\n\n`;
    msg += `👤 Da: ${username ? `@${username}` : `ID: ${userId}`}\n`;
    msg += `━━━━━━━━━━━━━━━\n\n📦 *Prodotti:*\n\n`;
    state.cart.forEach((item, i) => {
      msg += `${i + 1}. ${item.emoji} *${item.productName}* — ${item.weight}\n`;
      msg += `   Qty: ${item.quantity} × €${item.price} = *€${item.price * item.quantity}*\n\n`;
    });
    msg += `━━━━━━━━━━━━━━━\n💰 *Totale: €${getCartTotal(userId)}*\n\n`;
    msg += `━━━━━━━━━━━━━━━\n📋 *Dati di consegna:*\n\n`;
    msg += `👤 Nome: ${d.nome} ${d.cognome}\n`;
    msg += `📮 CAP: ${d.cap}\n🏙️ Citta: ${d.citta}\n`;
    msg += `🏠 Indirizzo: ${d.indirizzo}\n`;
    msg += `📧 Email: ${d.email}\n`;
    msg += `📱 Telefono: ${d.telefono || "(non fornito)"}`;

    await safeSend(bot, adminChatId, msg, { parse_mode: "Markdown" });
    clearCart(userId);
    resetCheckout(userId);
    await safeSend(
      bot, chatId,
      "✅ *Ordine inviato con successo!*\n\nIl tuo ordine e' stato ricevuto da @songoh4sh.\nVerrai contattato a breve. Grazie! 🙏",
      { parse_mode: "Markdown", reply_markup: backToMainKeyboard() }
    );
  }

  // ── User commands ─────────────────────────────────────────────────────────

  bot.onText(/\/start/, async (msg) => {
    const firstName = msg.from?.first_name || "ciao";
    await safeSend(
      bot, msg.chat.id,
      `Ciao *${firstName}*! 👋\n\nBenvenuto su *SHIP* 🇮🇹ITA-ITA🇮🇹\n\nNaviga le categorie, aggiungi prodotti al carrello e completa il tuo ordine!`,
      { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() }
    );
  });

  bot.onText(/\/menu/,     async (msg) => { await sendMainMenu(msg.chat.id); });
  bot.onText(/\/carrello/, async (msg) => { await sendCart(msg.chat.id, msg.from!.id); });

  bot.onText(/\/skip/, async (msg) => {
    const state = getState(msg.from!.id);
    if (state.checkoutStep === "telefono") await nextCheckoutStep(msg.chat.id, msg.from!.id, "/skip");
  });

  // ── Admin commands ────────────────────────────────────────────────────────

  bot.onText(/\/admin/, async (msg) => {
    if (!isAdmin(msg.from!.id)) return;
    const { hour, minute } = getScheduleTime();
    const channels = getChannels();
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    const chList = channels.length > 0
      ? channels.map((c, i) => `  ${i + 1}. ${c}`).join("\n")
      : "  (nessun canale configurato)";

    await safeSend(bot, msg.chat.id,
      `⚙️ *Pannello Admin — Invio Programmato*\n\n` +
      `📅 *Orario invio:* ${hh}:${mm} UTC\n\n` +
      `📢 *Canali configurati:*\n${chList}\n\n` +
      `━━━━━━━━━━━━━━━\n*Comandi:*\n\n` +
      `/addcanale @nome — aggiungi canale\n` +
      `/rmcanale @nome — rimuovi canale\n` +
      `/orario HH:MM — imposta orario (UTC)\n` +
      `/invioadesso — invia subito il promo\n` +
      `/anteprima — vedi il messaggio promo\n` +
      `/getid — vedi il tuo ID Telegram`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/addcanale (.+)/, async (msg, match) => {
    if (!isAdmin(msg.from!.id)) return;
    const ch = match![1].trim();
    const added = addChannel(ch);
    await safeSend(bot, msg.chat.id,
      added
        ? `✅ Canale *${ch}* aggiunto!\n\n⚠️ Assicurati che il bot sia *admin* del canale.`
        : `⚠️ Il canale *${ch}* e' gia' nella lista.`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/rmcanale (.+)/, async (msg, match) => {
    if (!isAdmin(msg.from!.id)) return;
    const ch = match![1].trim();
    const removed = removeChannel(ch);
    await safeSend(bot, msg.chat.id,
      removed ? `🗑️ Canale *${ch}* rimosso.` : `⚠️ Canale *${ch}* non trovato.`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/orario (\d{1,2}):(\d{2})/, async (msg, match) => {
    if (!isAdmin(msg.from!.id)) return;
    const hour = parseInt(match![1]);
    const minute = parseInt(match![2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      await safeSend(bot, msg.chat.id, "❌ Orario non valido. Usa /orario HH:MM (es. /orario 09:00)");
      return;
    }
    setScheduleTime(hour, minute);
    startScheduler(bot);
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    await safeSend(bot, msg.chat.id,
      `✅ Orario impostato: *${hh}:${mm} UTC*\n\nItalia estate = UTC+2 → per le 12:00 italiane usa /orario 10:00`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/invioadesso/, async (msg) => {
    if (!isAdmin(msg.from!.id)) return;
    if (getChannels().length === 0) {
      await safeSend(bot, msg.chat.id, "⚠️ Nessun canale configurato. Usa /addcanale @nomecanale");
      return;
    }
    await safeSend(bot, msg.chat.id, `📤 Invio in corso su ${getChannels().length} canale/i...`);
    const { ok, fail } = await sendPromoToAll(bot);
    let result = "";
    if (ok.length)   result += `✅ Inviato a: ${ok.join(", ")}\n`;
    if (fail.length) result += `❌ Fallito: ${fail.join(", ")}\n(verifica che il bot sia admin del canale)`;
    await safeSend(bot, msg.chat.id, result || "Nessun canale.", { parse_mode: "Markdown" });
  });

  bot.onText(/\/anteprima/, async (msg) => {
    if (!isAdmin(msg.from!.id)) return;
    await safeSend(bot, msg.chat.id, PROMO_MESSAGE);
  });

  bot.onText(/\/getid/, async (msg) => {
    await safeSend(bot, msg.chat.id, `🆔 Il tuo ID Telegram e': \`${msg.from!.id}\``, { parse_mode: "Markdown" });
  });

  // ── Messages ──────────────────────────────────────────────────────────────

  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    const userId = msg.from!.id;
    const state = getState(userId);
    if (state.checkoutStep && state.checkoutStep !== "confirm") {
      await nextCheckoutStep(msg.chat.id, userId, msg.text);
    }
  });

  // ── Callback queries ──────────────────────────────────────────────────────

  bot.on("callback_query", async (query) => {
    if (!query.message || !query.from) return;
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data || "";
    const state = getState(userId);

    try { await bot.answerCallbackQuery(query.id); } catch {}

    if (data === "main_menu") {
      state.currentCategory = null;
      state.currentSubCategory = null;
      state.currentProduct = null;
      await safeSend(bot, chatId, "🇮🇹 *SHIP ITA-ITA* 🇮🇹\n\nScegli una categoria:",
        { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() });
      return;
    }

    if (data.startsWith("cat:")) {
      const category = MENU.find((c) => c.id === data.split(":")[1]);
      if (!category) return;
      state.currentCategory = category.id;
      await safeSend(bot, chatId, `${category.emoji} *${category.name}*\n\nScegli una sottocategoria:`,
        { parse_mode: "Markdown", reply_markup: categoryKeyboard(category) });
      return;
    }

    if (data.startsWith("sub:")) {
      const [, catId, subId] = data.split(":");
      const category = MENU.find((c) => c.id === catId);
      const sub = category?.subCategories.find((s) => s.id === subId);
      if (!category || !sub) return;
      state.currentSubCategory = subId;
      await safeSend(bot, chatId,
        `${category.emoji} *${category.name}* › *${sub.name}*\n\nScegli un prodotto:`,
        { parse_mode: "Markdown", reply_markup: subCategoryKeyboard(category, sub) });
      return;
    }

    if (data.startsWith("prod:")) {
      const found = findProduct(data.split(":")[1]);
      if (!found) return;
      const { product } = found;
      state.currentProduct = product.id;
      let text = `${product.emoji} *${product.name}*\n\n📋 *Varianti disponibili:*\n\n`;
      product.variants.forEach((v) => { text += `• ${v.weight} — *€${v.price}*\n`; });
      text += `\nSeleziona la quantita' desiderata:`;
      await safeSend(bot, chatId, text, { parse_mode: "Markdown", reply_markup: productKeyboard(product) });
      return;
    }

    if (data.startsWith("add:")) {
      const [, productId, idxStr] = data.split(":");
      const found = findProduct(productId);
      const variant = findVariant(productId, parseInt(idxStr));
      if (!found || !variant) return;
      addToCart(userId, {
        productId,
        productName: found.product.name,
        emoji: found.product.emoji,
        variantIndex: parseInt(idxStr),
        weight: variant.weight,
        price: variant.price,
        quantity: 1,
      });
      await safeSend(bot, chatId,
        `✅ *${found.product.emoji} ${found.product.name}* — ${variant.weight}\nAggiunto al carrello!`,
        { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[
          { text: "🛒 Vedi Carrello", callback_data: "view_cart" },
          { text: "🏠 Continua", callback_data: "main_menu" },
        ]] } }
      );
      return;
    }

    if (data === "view_cart")    { await sendCart(chatId, userId); return; }
    if (data === "checkout")     { await startCheckout(chatId, userId); return; }
    if (data === "confirm_order"){ await confirmOrder(chatId, userId, query.from.username); return; }

    if (data === "clear_cart") {
      clearCart(userId);
      await safeSend(bot, chatId, "🗑️ Carrello svuotato.", { reply_markup: backToMainKeyboard() });
      return;
    }

    if (data === "cancel_checkout") {
      resetCheckout(userId);
      await safeSend(bot, chatId, "❌ Checkout annullato.", { reply_markup: backToMainKeyboard() });
      return;
    }

    if (data.startsWith("remove:")) {
      removeFromCart(userId, parseInt(data.split(":")[1]));
      await safeSend(bot, chatId, "🗑️ Prodotto rimosso.", {
        reply_markup: { inline_keyboard: [[{ text: "🛒 Vedi Carrello", callback_data: "view_cart" }]] },
      });
      return;
    }

    if (data === "back_to_sub") {
      const category = MENU.find((c) => c.id === state.currentCategory);
      const sub = category?.subCategories.find((s) => s.id === state.currentSubCategory);
      if (category && sub) {
        await safeSend(bot, chatId,
          `${category.emoji} *${category.name}* › *${sub.name}*\n\nScegli un prodotto:`,
          { parse_mode: "Markdown", reply_markup: subCategoryKeyboard(category, sub) });
      } else {
        await sendMainMenu(chatId);
      }
      return;
    }
  });

  startScheduler(bot);
  logger.info("Telegram bot started");
  return bot;
}
