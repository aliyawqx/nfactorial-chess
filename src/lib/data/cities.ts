// Топ-20 городов Казахстана (по населению).
// Используется как фиксированный список для dropdown в /settings/profile
// чтобы избежать разнобоя ("Алматы" / "almaty" / "Алмата" / "Алматинская обл").

export const KZ_CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Атырау",
  "Костанай",
  "Кызылорда",
  "Уральск",
  "Петропавловск",
  "Актау",
  "Темиртау",
  "Туркестан",
  "Кокшетау",
  "Талдыкорган",
  "Экибастуз",
] as const;

export type KzCity = (typeof KZ_CITIES)[number];

export function isKzCity(value: string | null | undefined): value is KzCity {
  return !!value && (KZ_CITIES as readonly string[]).includes(value);
}
