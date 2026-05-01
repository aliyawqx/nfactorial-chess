export type Square =
  | `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${
      | "1"
      | "2"
      | "3"
      | "4"
      | "5"
      | "6"
      | "7"
      | "8"}`;

export type PieceColor = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface ParsedMove {
  piece?: PieceType;
  from?: Square;
  to: Square;
  promotion?: PieceType;
  capture?: boolean;
  castle?: "kingside" | "queenside";
  check?: boolean;
}

export type GameMode = "ai" | "online" | "local";
export type GameResult = "1-0" | "0-1" | "1/2-1/2" | "*";

export type Termination =
  | "checkmate"
  | "resignation"
  | "timeout"
  | "stalemate"
  | "draw_agreed"
  | "insufficient_material"
  | "threefold"
  | "fifty_move"
  | "abandoned";

export interface GameOver {
  result: GameResult;
  termination: Termination;
  winner?: PieceColor;
}
