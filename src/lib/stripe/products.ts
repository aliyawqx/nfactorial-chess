export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
}

export const PRO_PRODUCT: Product = {
  id: "voicechess_pro",
  name: "VoiceChess Pro",
  description:
    "Кастомные скины фигур, расширенный AI Coach (скоро) и поддержка проекта.",
  priceCents: 499,
  currency: "usd",
};

export const PRODUCTS: Record<string, Product> = {
  [PRO_PRODUCT.id]: PRO_PRODUCT,
};
