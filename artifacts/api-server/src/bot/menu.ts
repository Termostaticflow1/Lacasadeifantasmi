export interface ProductVariant {
  weight: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  emoji: string;
  variants: ProductVariant[];
}

export interface SubCategory {
  id: string;
  name: string;
  products: Product[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  subCategories: SubCategory[];
}

export const MENU: Category[] = [
  {
    id: "choco",
    name: "CHOCO",
    emoji: "🍫",
    subCategories: [
      {
        id: "choco_mousse",
        name: "MOUSSE",
        products: [
          {
            id: "mousse",
            name: "MOUSSE",
            emoji: "🍞",
            variants: [
              { weight: "50g", price: 150 },
              { weight: "100g", price: 270 },
              { weight: "500g", price: 1100 },
              { weight: "1000g", price: 1900 },
            ],
          },
          {
            id: "mousse_aplus",
            name: "MOUSSE A+",
            emoji: "🍞",
            variants: [
              { weight: "100g", price: 350 },
              { weight: "500g", price: 1200 },
              { weight: "1000g", price: 2200 },
            ],
          },
        ],
      },
      {
        id: "choco_dry",
        name: "DRY",
        products: [
          {
            id: "work_1010",
            name: "WORK 10/10",
            emoji: "🏅",
            variants: [
              { weight: "5g", price: 40 },
              { weight: "10g", price: 70 },
              { weight: "50g", price: 220 },
              { weight: "100g", price: 400 },
              { weight: "500g", price: 1600 },
              { weight: "1000g", price: 2850 },
            ],
          },
          {
            id: "dry_sift",
            name: "DRY SIFT",
            emoji: "🍫",
            variants: [
              { weight: "100g", price: 420 },
              { weight: "500g", price: 1700 },
              { weight: "1000g", price: 3000 },
            ],
          },
          {
            id: "dry_mimosa",
            name: "DRY MIMOSA",
            emoji: "🪻",
            variants: [
              { weight: "100g", price: 460 },
              { weight: "500g", price: 1800 },
              { weight: "1000g", price: 3200 },
            ],
          },
          {
            id: "top_filtrato",
            name: "TOP FILTRATO",
            emoji: "🍫🔝",
            variants: [
              { weight: "100g", price: 500 },
              { weight: "500g", price: 2000 },
              { weight: "1000g", price: 3500 },
            ],
          },
          {
            id: "wonka_premium",
            name: "WONKA PREMIUM",
            emoji: "🎖️",
            variants: [
              { weight: "25g", price: 160 },
              { weight: "50g", price: 250 },
              { weight: "100g", price: 500 },
              { weight: "400g", price: 1900 },
              { weight: "1000g", price: 3650 },
            ],
          },
        ],
      },
      {
        id: "choco_frozen",
        name: "FROZEN",
        products: [
          {
            id: "bufalo_frozen_mid",
            name: "BUFALO PLEIN FROZEN MID",
            emoji: "🥶",
            variants: [
              { weight: "100g", price: 750 },
              { weight: "500g", price: 3000 },
              { weight: "1000g", price: 5600 },
            ],
          },
          {
            id: "mountainbrother_frozen",
            name: "MOUNTAINBROTHER FROZEN SIFT",
            emoji: "❄️",
            variants: [
              { weight: "10g", price: 170 },
              { weight: "25g", price: 300 },
              { weight: "50g", price: 490 },
              { weight: "100g", price: 800 },
              { weight: "500g", price: 3350 },
            ],
          },
          {
            id: "bled_farmerz_frozen",
            name: "BLED FARMERZ PREMIUM FROZEN",
            emoji: "🥶",
            variants: [
              { weight: "10g", price: 170 },
              { weight: "25g", price: 300 },
              { weight: "50g", price: 500 },
              { weight: "100g", price: 850 },
              { weight: "500g", price: 3500 },
              { weight: "1000g", price: 6400 },
            ],
          },
          {
            id: "fresh_frozen",
            name: "FRESH FROZEN",
            emoji: "🥶",
            variants: [
              { weight: "25g", price: 300 },
              { weight: "50g", price: 450 },
              { weight: "100g", price: 900 },
              { weight: "200g", price: 1700 },
            ],
          },
          {
            id: "bubble_fresh_frozen",
            name: "BUBBLE FRESH FROZEN",
            emoji: "🫧",
            variants: [
              { weight: "10g", price: 180 },
              { weight: "25g", price: 320 },
              { weight: "50g", price: 500 },
              { weight: "100g", price: 950 },
            ],
          },
        ],
      },
      {
        id: "choco_static",
        name: "STATIC",
        products: [
          {
            id: "mocroshark_static",
            name: "MOCROSHARK STATIC SIFT",
            emoji: "⚡️🇲🇦",
            variants: [
              { weight: "50g", price: 470 },
              { weight: "100g", price: 900 },
              { weight: "500g", price: 4000 },
            ],
          },
          {
            id: "golden_boys_static",
            name: "GOLDEN BOYS STATIC SIFT",
            emoji: "⚡️",
            variants: [
              { weight: "50g", price: 550 },
              { weight: "100g", price: 1000 },
              { weight: "500g", price: 4500 },
            ],
          },
          {
            id: "mountain_terps_static",
            name: "MOUNTAIN TERPS STATIC SIFT",
            emoji: "⛰️⚡️",
            variants: [
              { weight: "50g", price: 600 },
              { weight: "100g", price: 1100 },
              { weight: "500g", price: 4750 },
            ],
          },
          {
            id: "hidden_farm_plasma",
            name: "HIDDEN FARM PLASMA STATIC",
            emoji: "⚡️",
            variants: [
              { weight: "25g", price: 400 },
              { weight: "50g", price: 580 },
              { weight: "100g", price: 1100 },
              { weight: "500g", price: 4750 },
            ],
          },
          {
            id: "golden_boys_plasma",
            name: "GOLDEN BOYS PLASMA STATIC",
            emoji: "⚡️",
            variants: [
              { weight: "50g", price: 600 },
              { weight: "100g", price: 1150 },
              { weight: "500g", price: 5000 },
            ],
          },
          {
            id: "looney_farm_plasma",
            name: "LOONEY FARM PLASMA STATIC",
            emoji: "🌟",
            variants: [
              { weight: "50g", price: 650 },
              { weight: "100g", price: 1200 },
              { weight: "500g", price: 5500 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "plants",
    name: "PLANTS",
    emoji: "🌿",
    subCategories: [
      {
        id: "plants_spain",
        name: "SPAIN",
        products: [
          {
            id: "amnesia_haze",
            name: "AMNESIA HAZE",
            emoji: "🪬",
            variants: [
              { weight: "100g", price: 450 },
              { weight: "500g", price: 1700 },
              { weight: "1000g", price: 3150 },
            ],
          },
          {
            id: "super_silver_haze",
            name: "SUPER SILVER HAZE",
            emoji: "🪙",
            variants: [
              { weight: "100g", price: 500 },
              { weight: "200g", price: 950 },
              { weight: "300g", price: 1400 },
              { weight: "500g", price: 1950 },
              { weight: "1000g", price: 3700 },
            ],
          },
        ],
      },
      {
        id: "plants_spali",
        name: "SPALI",
        products: [
          {
            id: "spali",
            name: "SPALI",
            emoji: "🇺🇸🇪🇸",
            variants: [
              { weight: "25g", price: 250 },
              { weight: "50g", price: 420 },
              { weight: "100g", price: 650 },
              { weight: "500g", price: 2500 },
              { weight: "1000g", price: 4800 },
            ],
          },
          {
            id: "spali_top",
            name: "SPALI TOP SHELF",
            emoji: "🇺🇸🇪🇸",
            variants: [
              { weight: "25g", price: 250 },
              { weight: "50g", price: 420 },
              { weight: "100g", price: 700 },
              { weight: "500g", price: 2700 },
              { weight: "1000g", price: 5000 },
            ],
          },
        ],
      },
      {
        id: "plants_cali",
        name: "CALI",
        products: [
          {
            id: "cali_canada",
            name: "CALI CANADA",
            emoji: "🇺🇸🇨🇦",
            variants: [
              { weight: "25g", price: 270 },
              { weight: "50g", price: 400 },
              { weight: "100g", price: 750 },
              { weight: "500g", price: 3000 },
              { weight: "1000g", price: 5500 },
            ],
          },
          {
            id: "cali_usa_top",
            name: "CALI USA TOP SHELF",
            emoji: "🇺🇸",
            variants: [
              { weight: "25g", price: 300 },
              { weight: "50g", price: 450 },
              { weight: "100g", price: 850 },
              { weight: "500g", price: 3200 },
              { weight: "1000g", price: 5700 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "extracts",
    name: "EXTRACTS",
    emoji: "💧",
    subCategories: [
      {
        id: "extracts_all",
        name: "EXTRACTS",
        products: [
          {
            id: "ice",
            name: "ICE",
            emoji: "🧊",
            variants: [
              { weight: "10g", price: 290 },
              { weight: "25g", price: 530 },
              { weight: "50g", price: 900 },
              { weight: "100g", price: 1600 },
            ],
          },
          {
            id: "ice_full_melt",
            name: "ICE FULL MELT",
            emoji: "🧊",
            variants: [
              { weight: "10g", price: 330 },
              { weight: "20g", price: 570 },
              { weight: "50g", price: 1100 },
              { weight: "100g", price: 1800 },
            ],
          },
          {
            id: "wax",
            name: "WAX",
            emoji: "🍯",
            variants: [
              { weight: "10g", price: 350 },
              { weight: "25g", price: 750 },
              { weight: "50g", price: 1400 },
              { weight: "100g", price: 2300 },
            ],
          },
          {
            id: "wax_gum",
            name: "WAX GUM",
            emoji: "🍡",
            variants: [
              { weight: "5g", price: 250 },
              { weight: "10g", price: 420 },
              { weight: "20g", price: 750 },
              { weight: "50g", price: 1500 },
              { weight: "100g", price: 2700 },
            ],
          },
          {
            id: "badder",
            name: "BADDER",
            emoji: "🫙",
            variants: [
              { weight: "10g", price: 300 },
              { weight: "25g", price: 700 },
              { weight: "50g", price: 1200 },
              { weight: "100g", price: 2100 },
            ],
          },
          {
            id: "badder_ope",
            name: "BADDER OPE",
            emoji: "🥞",
            variants: [
              { weight: "5g", price: 200 },
              { weight: "10g", price: 350 },
              { weight: "20g", price: 650 },
              { weight: "50g", price: 1300 },
              { weight: "100g", price: 2220 },
            ],
          },
          {
            id: "crumble",
            name: "CRUMBLE",
            emoji: "🧀",
            variants: [
              { weight: "5g", price: 220 },
              { weight: "10g", price: 350 },
              { weight: "20g", price: 650 },
              { weight: "50g", price: 1250 },
              { weight: "100g", price: 2100 },
            ],
          },
          {
            id: "sugar_crumble",
            name: "SUGAR CRUMBLE",
            emoji: "🧇",
            variants: [
              { weight: "10g", price: 370 },
              { weight: "25g", price: 730 },
              { weight: "50g", price: 1450 },
              { weight: "100g", price: 2500 },
            ],
          },
          {
            id: "wpff",
            name: "WPFF",
            emoji: "💎",
            variants: [
              { weight: "25g", price: 750 },
              { weight: "50g", price: 1500 },
              { weight: "100g", price: 2700 },
            ],
          },
          {
            id: "wpff_full_melt",
            name: "WPFF FULL MELT",
            emoji: "💎",
            variants: [
              { weight: "10g", price: 380 },
              { weight: "25g", price: 750 },
              { weight: "50g", price: 1500 },
              { weight: "100g", price: 2900 },
            ],
          },
          {
            id: "wpff_single_purple",
            name: "WPFF SINGLE SOURCE PURPLE",
            emoji: "😈",
            variants: [
              { weight: "50g", price: 1750 },
              { weight: "100g", price: 3300 },
            ],
          },
          {
            id: "piattella_skittles",
            name: "PIATTELLA SKITTLES",
            emoji: "🧈🍬",
            variants: [
              { weight: "1g", price: 90 },
              { weight: "5g", price: 400 },
              { weight: "10g", price: 700 },
              { weight: "20g", price: 1200 },
              { weight: "50g", price: 2500 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "others",
    name: "OTHERS",
    emoji: "✨",
    subCategories: [
      {
        id: "others_all",
        name: "OTHERS",
        products: [
          {
            id: "vape_pen",
            name: "VAPE PEN",
            emoji: "🖊️",
            variants: [
              { weight: "1pz (test)", price: 75 },
              { weight: "5pz", price: 300 },
              { weight: "10pz", price: 540 },
              { weight: "50pz", price: 1500 },
              { weight: "100pz", price: 2700 },
            ],
          },
          {
            id: "edibles",
            name: "EDIBLES",
            emoji: "🍭",
            variants: [
              { weight: "10pz", price: 250 },
              { weight: "20pz", price: 450 },
              { weight: "50pz", price: 1000 },
            ],
          },
        ],
      },
    ],
  },
];

export function findProduct(productId: string): { product: Product; category: Category; subCategory: SubCategory } | null {
  for (const category of MENU) {
    for (const subCategory of category.subCategories) {
      for (const product of subCategory.products) {
        if (product.id === productId) {
          return { product, category, subCategory };
        }
      }
    }
  }
  return null;
}

export function findVariant(productId: string, variantIndex: number): ProductVariant | null {
  const found = findProduct(productId);
  if (!found) return null;
  return found.product.variants[variantIndex] ?? null;
}
