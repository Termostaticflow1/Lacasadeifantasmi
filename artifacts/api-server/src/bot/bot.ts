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
import { logger } from "../lib/logger.js";

const CHECKOUT_STEPS: CheckoutStep[] = [
  "nome",
  "cognome",
  "cap",
  "citta",
  "indirizzo",
  "email",
  "telefono",
];

const STEP_PROMPTS: Record<CheckoutStep, string> = {
  nome: "👤 Inserisci il tuo *Nome:*",
  cognome: "👤 Inserisci il tuo *Cognome:*",
  cap: "📮 Inserisci il tuo *CAP:*",
  citta: "🏙️ Inserisci la tua *Citta:*",
  indirizzo: "🏠 Inserisci la tua *Via/Indirizzo:*",
  email: "📧 Inserisci il tuo *Indirizzo e-mail:*",
  telefono: "📱 Inserisci il tuo *Numero di telefono:*\n_(facoltativo — invia /skip per saltare)_",
  confirm: "",
};

export function createBot(token: string, adminChatId: string): TelegramBot {
  const bot = new TelegramBot(token, { polling: true });

  async function sendMainMenu(chatId: number, text?: string) {
    await bot.sendMessage(
      chatId,
      text ||
        "🇮🇹 *SHIP ITA-ITA* 🇮🇹\n\nBenvenuto! Scegli una categoria dal menu qui sotto:",
      { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() }
    );
  }

  async function sendCart(chatId: number, userId: number) {
    const state = getState(userId);
    const summary = cartSummary(userId);
    await bot.sendMessage(chatId, summary, {
      parse_mode: "Markdown",
      reply_markup: cartKeyboard(state.cart.length),
    });
  }

  async function startCheckout(chatId: number, userId: number) {
    const state = getState(userId);
    if (state.cart.length === 0) {
      await bot.sendMessage(chatId, "Il carrello e' vuoto!", {
        reply_markup: backToMainKeyboard(),
      });
      return;
    }
    resetCheckout(userId);
    state.checkoutStep = "nome";
    await bot.sendMessage(
      chatId,
      "📋 *Compilazione Ordine*\n\nInserisci i tuoi dati per completare l'ordine.\n\n" +
        STEP_PROMPTS["nome"],
      { parse_mode: "Markdown" }
    );
  }

  async function nextCheckoutStep(chatId: number, userId: number, value: string) {
    const state = getState(userId);
    const currentStep = state.checkoutStep;
    if (!currentStep || currentStep === "confirm") return;

    switch (currentStep) {
      case "nome":
        state.checkoutData.nome = value;
        break;
      case "cognome":
        state.checkoutData.cognome = value;
        break;
      case "cap":
        state.checkoutData.cap = value;
        break;
      case "citta":
        state.checkoutData.citta = value;
        break;
      case "indirizzo":
        state.checkoutData.indirizzo = value;
        break;
      case "email":
        state.checkoutData.email = value;
        break;
      case "telefono":
        state.checkoutData.telefono = value === "/skip" ? "(non fornito)" : value;
        break;
    }

    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);
    const nextStep = CHECKOUT_STEPS[currentIndex + 1];

    if (!nextStep) {
      state.checkoutStep = "confirm";
      await sendOrderConfirmation(chatId, userId);
    } else {
      state.checkoutStep = nextStep;
      await bot.sendMessage(chatId, STEP_PROMPTS[nextStep], {
        parse_mode: "Markdown",
      });
    }
  }

  async function sendOrderConfirmation(chatId: number, userId: number) {
    const state = getState(userId);
    const d = state.checkoutData;
    const summary = cartSummary(userId);

    const confirmText =
      `${summary}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📋 *Dati di consegna:*\n\n` +
      `👤 Nome: *${d.nome} ${d.cognome}*\n` +
      `📮 CAP: *${d.cap}*\n` +
      `🏙️ Citta: *${d.citta}*\n` +
      `🏠 Indirizzo: *${d.indirizzo}*\n` +
      `📧 Email: *${d.email}*\n` +
      `📱 Telefono: *${d.telefono || "(non fornito)"}*\n\n` +
      `Confermi l'ordine?`;

    await bot.sendMessage(chatId, confirmText, {
      parse_mode: "Markdown",
      reply_markup: checkoutConfirmKeyboard(),
    });
  }

  async function confirmOrder(chatId: number, userId: number, username?: string) {
    const state = getState(userId);
    const d = state.checkoutData;

    let orderMsg = `🛍️ *NUOVO ORDINE*\n\n`;
    orderMsg += `👤 Da: ${username ? `@${username}` : `ID: ${userId}`}\n`;
    orderMsg += `━━━━━━━━━━━━━━━\n\n`;
    orderMsg += `📦 *Prodotti:*\n\n`;

    state.cart.forEach((item, idx) => {
      orderMsg += `${idx + 1}. ${item.emoji} *${item.productName}* — ${item.weight}\n`;
      orderMsg += `   Qty: ${item.quantity} × €${item.price} = *€${item.price * item.quantity}*\n\n`;
    });

    orderMsg += `━━━━━━━━━━━━━━━\n`;
    orderMsg += `💰 *Totale: €${getCartTotal(userId)}*\n\n`;
    orderMsg += `━━━━━━━━━━━━━━━\n`;
    orderMsg += `📋 *Dati di consegna:*\n\n`;
    orderMsg += `👤 Nome: ${d.nome} ${d.cognome}\n`;
    orderMsg += `📮 CAP: ${d.cap}\n`;
    orderMsg += `🏙️ Citta: ${d.citta}\n`;
    orderMsg += `🏠 Indirizzo: ${d.indirizzo}\n`;
    orderMsg += `📧 Email: ${d.email}\n`;
    orderMsg += `📱 Telefono: ${d.telefono || "(non fornito)"}`;

    try {
      await bot.sendMessage(adminChatId, orderMsg, { parse_mode: "Markdown" });
    } catch (err) {
      logger.error({ err }, "Failed to send order to admin");
    }

    clearCart(userId);
    resetCheckout(userId);

    await bot.sendMessage(
      chatId,
      "✅ *Ordine inviato con successo!*\n\nIl tuo ordine e' stato ricevuto da @songoh4sh.\nVerrai contattato a breve per confermare i dettagli.\n\nGrazie! 🙏",
      { parse_mode: "Markdown", reply_markup: backToMainKeyboard() }
    );
  }

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || "ciao";
    await bot.sendMessage(
      chatId,
      `Ciao *${firstName}*! 👋\n\nBenvenuto su *SHIP* 🇮🇹ITA-ITA🇮🇹\n\nQui trovi il nostro menu completo. Naviga le categorie, aggiungi prodotti al carrello e completa il tuo ordine!`,
      { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() }
    );
  });

  bot.onText(/\/menu/, async (msg) => {
    await sendMainMenu(msg.chat.id);
  });

  bot.onText(/\/carrello/, async (msg) => {
    await sendCart(msg.chat.id, msg.from!.id);
  });

  bot.onText(/\/skip/, async (msg) => {
    const userId = msg.from!.id;
    const state = getState(userId);
    if (state.checkoutStep === "telefono") {
      await nextCheckoutStep(msg.chat.id, userId, "/skip");
    }
  });

  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    const state = getState(userId);

    if (state.checkoutStep && state.checkoutStep !== "confirm") {
      await nextCheckoutStep(chatId, userId, msg.text);
    }
  });

  bot.on("callback_query", async (query) => {
    if (!query.message || !query.from) return;

    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data || "";
    const state = getState(userId);

    await bot.answerCallbackQuery(query.id);

    if (data === "main_menu") {
      state.currentCategory = null;
      state.currentSubCategory = null;
      state.currentProduct = null;
      await bot.sendMessage(
        chatId,
        "🇮🇹 *SHIP ITA-ITA* 🇮🇹\n\nScegli una categoria:",
        { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() }
      );
      return;
    }

    if (data.startsWith("cat:")) {
      const catId = data.split(":")[1];
      const category = MENU.find((c) => c.id === catId);
      if (!category) return;
      state.currentCategory = catId;
      await bot.sendMessage(
        chatId,
        `${category.emoji} *${category.name}*\n\nScegli una sottocategoria:`,
        { parse_mode: "Markdown", reply_markup: categoryKeyboard(category) }
      );
      return;
    }

    if (data.startsWith("sub:")) {
      const [, catId, subId] = data.split(":");
      const category = MENU.find((c) => c.id === catId);
      const subCategory = category?.subCategories.find((s) => s.id === subId);
      if (!category || !subCategory) return;
      state.currentSubCategory = subId;

      let text = `${category.emoji} *${category.name}* › *${subCategory.name}*\n\nScegli un prodotto:`;
      await bot.sendMessage(chatId, text, {
        parse_mode: "Markdown",
        reply_markup: subCategoryKeyboard(category, subCategory),
      });
      return;
    }

    if (data.startsWith("prod:")) {
      const productId = data.split(":")[1];
      const found = findProduct(productId);
      if (!found) return;
      const { product, category, subCategory } = found;
      state.currentProduct = productId;

      let text = `${product.emoji} *${product.name}*\n\n`;
      text += `📋 *Varianti disponibili:*\n\n`;
      product.variants.forEach((v) => {
        text += `• ${v.weight} — *€${v.price}*\n`;
      });
      text += `\nSeleziona la quantita' desiderata:`;

      await bot.sendMessage(chatId, text, {
        parse_mode: "Markdown",
        reply_markup: productKeyboard(product),
      });
      return;
    }

    if (data.startsWith("add:")) {
      const [, productId, variantIndexStr] = data.split(":");
      const variantIndex = parseInt(variantIndexStr);
      const found = findProduct(productId);
      const variant = findVariant(productId, variantIndex);
      if (!found || !variant) return;

      addToCart(userId, {
        productId,
        productName: found.product.name,
        emoji: found.product.emoji,
        variantIndex,
        weight: variant.weight,
        price: variant.price,
        quantity: 1,
      });

      await bot.sendMessage(
        chatId,
        `✅ *${found.product.emoji} ${found.product.name}* — ${variant.weight}\nAggiunto al carrello!`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🛒 Vedi Carrello", callback_data: "view_cart" },
                { text: "🏠 Continua", callback_data: "main_menu" },
              ],
            ],
          },
        }
      );
      return;
    }

    if (data === "view_cart") {
      await sendCart(chatId, userId);
      return;
    }

    if (data.startsWith("remove:")) {
      const index = parseInt(data.split(":")[1]);
      removeFromCart(userId, index);
      await bot.sendMessage(chatId, "🗑️ Prodotto rimosso dal carrello.", {
        reply_markup: { inline_keyboard: [[{ text: "🛒 Vedi Carrello", callback_data: "view_cart" }]] },
      });
      return;
    }

    if (data === "clear_cart") {
      clearCart(userId);
      await bot.sendMessage(chatId, "🗑️ Carrello svuotato.", {
        reply_markup: backToMainKeyboard(),
      });
      return;
    }

    if (data === "checkout") {
      await startCheckout(chatId, userId);
      return;
    }

    if (data === "confirm_order") {
      await confirmOrder(chatId, userId, query.from.username);
      return;
    }

    if (data === "cancel_checkout") {
      resetCheckout(userId);
      await bot.sendMessage(chatId, "❌ Checkout annullato.", {
        reply_markup: backToMainKeyboard(),
      });
      return;
    }

    if (data === "back_to_sub") {
      if (state.currentCategory && state.currentSubCategory) {
        const category = MENU.find((c) => c.id === state.currentCategory);
        const subCategory = category?.subCategories.find((s) => s.id === state.currentSubCategory);
        if (category && subCategory) {
          await bot.sendMessage(
            chatId,
            `${category.emoji} *${category.name}* › *${subCategory.name}*\n\nScegli un prodotto:`,
            { parse_mode: "Markdown", reply_markup: subCategoryKeyboard(category, subCategory) }
          );
          return;
        }
      }
      await sendMainMenu(chatId);
      return;
    }
  });

  bot.on("polling_error", (err) => {
    logger.error({ err }, "Telegram polling error");
  });

  logger.info("Telegram bot started");
  return bot;
}
