// Нормализация распознанного текста: убираем пунктуацию, склейку чисел/букв,
// заменяем словесные представления цифр и букв.

const FILE_WORDS_EN: Record<string, string> = {
  alpha: "a",
  bravo: "b",
  charlie: "c",
  delta: "d",
  echo: "e",
  foxtrot: "f",
  golf: "g",
  hotel: "h",
};

const FILE_WORDS_RU: Record<string, string> = {
  // фонетические алиасы букв
  "а": "a",
  "бэ": "b",
  "бе": "b",
  "це": "c",
  "цэ": "c",
  "де": "d",
  "дэ": "d",
  "е": "e",
  "ё": "e",
  "эф": "f",
  "эфф": "f",
  "же": "g",
  "жэ": "g",
  "аш": "h",
  "ха": "h",
  "ашш": "h",
};

const NUMBER_WORDS_EN: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
};

const NUMBER_WORDS_RU: Record<string, string> = {
  "один": "1",
  "одна": "1",
  "два": "2",
  "две": "2",
  "три": "3",
  "трё": "3",
  "трех": "3",
  "трёх": "3",
  "четыре": "4",
  "четыр": "4",
  "пять": "5",
  "шесть": "6",
  "семь": "7",
  "восемь": "8",
  "восем": "8",
};

const NUMBER_WORDS_KK: Record<string, string> = {
  "бір": "1",
  "бир": "1",
  "екі": "2",
  "еки": "2",
  "үш": "3",
  "уш": "3",
  "төрт": "4",
  "торт": "4",
  "бес": "5",
  "алты": "6",
  "жеті": "7",
  "жети": "7",
  "сегіз": "8",
  "сегиз": "8",
};

function replaceWordMap(input: string, dict: Record<string, string>): string {
  // Используем разбиение по пробелам и пунктуации — \b в JS не работает с кириллицей
  // (кириллические буквы — non-word char без unicode flag, и \b ведёт себя неинтуитивно).
  // Также сохраняем уже нормализованные клетки вида f3 (latin+digit) — их не трогаем.
  return input
    .split(/(\s+|[-,])/)
    .map((token) => {
      const lower = token.toLowerCase();
      return dict[lower] ?? token;
    })
    .join("");
}

export function normalize(input: string, locale: "ru" | "en" | "kk"): string {
  let s = input.toLowerCase().trim();

  // Уберём пунктуацию кроме дефисов и плюсов
  s = s.replace(/[.,!?:;'"«»()]/g, " ");

  // Замена слов-чисел на цифры
  if (locale === "en") {
    s = replaceWordMap(s, NUMBER_WORDS_EN);
    s = replaceWordMap(s, FILE_WORDS_EN);
  } else if (locale === "ru") {
    s = replaceWordMap(s, NUMBER_WORDS_RU);
    s = replaceWordMap(s, FILE_WORDS_RU);
  } else if (locale === "kk") {
    s = replaceWordMap(s, NUMBER_WORDS_KK);
    s = replaceWordMap(s, FILE_WORDS_RU);
    s = replaceWordMap(s, NUMBER_WORDS_RU);
  }

  // Склейки кириллической буквы-файла с цифрой: "е4" (кир) → "e4" (lat)
  // Отдельно — потому что split-by-whitespace не видит границы внутри слитого токена.
  const cyrToLat: Record<string, string> = {
    "а": "a",
    "е": "e",
    "ё": "e",
  };
  s = s.replace(
    /([абвгдеёжзАБВГДЕЁЖЗ])([1-8])/g,
    (m, letter: string, num: string) =>
      cyrToLat[letter.toLowerCase()] ? cyrToLat[letter.toLowerCase()] + num : m,
  );

  // "эф 3" → "f3" (склеить букву + цифру через пробел)
  s = s.replace(/([a-h])\s+([1-8])/gi, "$1$2");

  // "f3-ке", "e4-ге", "a1-да" → "f3", "e4", "a1" (казахские падежи)
  s = s.replace(
    /([a-h][1-8])-(?:ке|ге|да|де|нан|нен|тан|тен)/gi,
    "$1",
  );

  // Множественные пробелы
  s = s.replace(/\s+/g, " ").trim();

  return s;
}
