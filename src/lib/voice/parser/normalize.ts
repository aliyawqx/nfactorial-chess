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
  // \b не работает с кириллицей — поэтому split-by-whitespace
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

  s = s.replace(/[.,!?:;'"«»()]/g, " ");

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

  // склейки кириллической буквы-файла с цифрой: "е4" (кир) → "e4" (lat)
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

  s = s.replace(/([a-h])\s+([1-8])/gi, "$1$2");

  // казахские падежи: "f3-ке", "e4-ге", "a1-да" → "f3"
  s = s.replace(
    /([a-h][1-8])-(?:ке|ге|да|де|нан|нен|тан|тен)/gi,
    "$1",
  );

  s = s.replace(/\s+/g, " ").trim();

  return s;
}
