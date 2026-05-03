import type { CSSProperties, ReactElement } from "react";

export type SkinId = "cburnett" | "merida" | "pixel";

export interface SkinDef {
  id: SkinId;
  name: string;
  description: string;
  proOnly: boolean;
}

export const SKINS: Record<SkinId, SkinDef> = {
  cburnett: {
    id: "cburnett",
    name: "Classic Cburnett",
    description: "Стандартный набор Lichess — чистый и узнаваемый.",
    proOnly: false,
  },
  merida: {
    id: "merida",
    name: "Merida",
    description: "Классическая шахматная гарнитура. Premium look.",
    proOnly: true,
  },
  pixel: {
    id: "pixel",
    name: "Pixel",
    description: "Ретро 8-bit. Для любителей пиксель-арта.",
    proOnly: true,
  },
};

export const ALL_SKIN_IDS: SkinId[] = ["cburnett", "merida", "pixel"];

export function isValidSkin(id: string | null | undefined): id is SkinId {
  return !!id && id in SKINS;
}

export type PieceCode =
  | "wK" | "wQ" | "wR" | "wB" | "wN" | "wP"
  | "bK" | "bQ" | "bR" | "bB" | "bN" | "bP";

export const PIECE_CODES: PieceCode[] = [
  "wK", "wQ", "wR", "wB", "wN", "wP",
  "bK", "bQ", "bR", "bB", "bN", "bP",
];

const imgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  userSelect: "none",
};

export function pieceRenderObject(
  skin: SkinId,
): Record<PieceCode, () => ReactElement> {
  const result: Record<string, () => ReactElement> = {};
  for (const code of PIECE_CODES) {
    const src = `/pieces/${skin}/${code}.svg`;
    result[code] = () => (
      <img
        src={src}
        alt=""
        draggable={false}
        style={imgStyle}
      />
    );
  }
  return result as Record<PieceCode, () => ReactElement>;
}
