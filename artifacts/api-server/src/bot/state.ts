export interface CartItem {
  productId: string;
  productName: string;
  emoji: string;
  variantIndex: number;
  weight: string;
  price: number;
  quantity: number;
}

export interface CheckoutData {
  nome?: string;
  cognome?: string;
  cap?: string;
  citta?: string;
  indirizzo?: string;
  email?: string;
  telefono?: string;
}

export type CheckoutStep =
  | "nome"
  | "cognome"
  | "cap"
  | "citta"
  | "indirizzo"
  | "email"
  | "telefono"
  | "confirm";

export interface UserState {
  cart: CartItem[];
  checkoutData: CheckoutData;
  checkoutStep: CheckoutStep | null;
  currentCategory: string | null;
  currentSubCategory: string | null;
  currentProduct: string | null;
}

const userStates = new Map<number, UserState>();

export function getState(userId: number): UserState {
  if (!userStates.has(userId)) {
    userStates.set(userId, {
      cart: [],
      checkoutData: {},
      checkoutStep: null,
      currentCategory: null,
      currentSubCategory: null,
      currentProduct: null,
    });
  }
  return userStates.get(userId)!;
}

export function resetCheckout(userId: number): void {
  const state = getState(userId);
  state.checkoutData = {};
  state.checkoutStep = null;
}

export function clearCart(userId: number): void {
  const state = getState(userId);
  state.cart = [];
}

export function addToCart(userId: number, item: CartItem): void {
  const state = getState(userId);
  const existing = state.cart.find(
    (i) => i.productId === item.productId && i.variantIndex === item.variantIndex
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    state.cart.push({ ...item });
  }
}

export function removeFromCart(userId: number, index: number): void {
  const state = getState(userId);
  state.cart.splice(index, 1);
}

export function getCartTotal(userId: number): number {
  const state = getState(userId);
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartSummary(userId: number): string {
  const state = getState(userId);
  if (state.cart.length === 0) return "Il tuo carrello e' vuoto.";
  let text = "🛒 *Carrello:*\n\n";
  state.cart.forEach((item, idx) => {
    text += `${idx + 1}. ${item.emoji} *${item.productName}* — ${item.weight}\n`;
    text += `   Qty: ${item.quantity} × €${item.price} = *€${item.price * item.quantity}*\n\n`;
  });
  text += `━━━━━━━━━━━━━━━\n`;
  text += `💰 *Totale: €${getCartTotal(userId)}*`;
  return text;
}
