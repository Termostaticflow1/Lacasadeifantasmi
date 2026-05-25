import TelegramBot from "node-telegram-bot-api";
import { MENU, Category, SubCategory, Product } from "./menu.js";
import { UserState } from "./state.js";

export function mainMenuKeyboard(): TelegramBot.InlineKeyboardMarkup {
  const rows: TelegramBot.InlineKeyboardButton[][] = MENU.map((cat) => [
    { text: `${cat.emoji} ${cat.name}`, callback_data: `cat:${cat.id}` },
  ]);
  rows.push([{ text: "🛒 Carrello", callback_data: "view_cart" }]);
  rows.push([{ text: "📞 Contatta @songoh4sh", url: "https://t.me/songoh4sh" }]);
  return { inline_keyboard: rows };
}

export function categoryKeyboard(category: Category): TelegramBot.InlineKeyboardMarkup {
  const rows: TelegramBot.InlineKeyboardButton[][] = category.subCategories.map((sub) => [
    { text: sub.name, callback_data: `sub:${category.id}:${sub.id}` },
  ]);
  rows.push([{ text: "⬅️ Indietro", callback_data: "main_menu" }]);
  return { inline_keyboard: rows };
}

export function subCategoryKeyboard(
  category: Category,
  subCategory: SubCategory
): TelegramBot.InlineKeyboardMarkup {
  const rows: TelegramBot.InlineKeyboardButton[][] = subCategory.products.map((p) => [
    { text: `${p.emoji} ${p.name}`, callback_data: `prod:${p.id}` },
  ]);
  rows.push([
    { text: "⬅️ Indietro", callback_data: `cat:${category.id}` },
    { text: "🏠 Menu", callback_data: "main_menu" },
  ]);
  return { inline_keyboard: rows };
}

export function productKeyboard(product: Product): TelegramBot.InlineKeyboardMarkup {
  const rows: TelegramBot.InlineKeyboardButton[][] = product.variants.map((v, i) => [
    {
      text: `${v.weight} — €${v.price}`,
      callback_data: `add:${product.id}:${i}`,
    },
  ]);
  rows.push([
    { text: "⬅️ Indietro", callback_data: "back_to_sub" },
    { text: "🛒 Carrello", callback_data: "view_cart" },
  ]);
  return { inline_keyboard: rows };
}

export function cartKeyboard(cartLength: number): TelegramBot.InlineKeyboardMarkup {
  const rows: TelegramBot.InlineKeyboardButton[][] = [];
  if (cartLength > 0) {
    const removeRow: TelegramBot.InlineKeyboardButton[] = [];
    for (let i = 0; i < cartLength; i++) {
      removeRow.push({ text: `🗑️ ${i + 1}`, callback_data: `remove:${i}` });
    }
    rows.push(removeRow);
    rows.push([{ text: "✅ Procedi al Checkout", callback_data: "checkout" }]);
    rows.push([{ text: "🗑️ Svuota Carrello", callback_data: "clear_cart" }]);
  }
  rows.push([{ text: "🏠 Continua lo Shopping", callback_data: "main_menu" }]);
  return { inline_keyboard: rows };
}

export function checkoutConfirmKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "✅ Conferma Ordine", callback_data: "confirm_order" },
        { text: "❌ Annulla", callback_data: "cancel_checkout" },
      ],
    ],
  };
}

export function backToMainKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "🏠 Torna al Menu", callback_data: "main_menu" }],
    ],
  };
}
