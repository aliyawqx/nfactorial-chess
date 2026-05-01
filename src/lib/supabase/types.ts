// Минимальные типы БД для Phase 5 (мультиплеер).
// Полные типы можно сгенерировать через `supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          city: string | null;
          country: string;
          elo: number;
          preferred_language: "ru" | "en" | "kk";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          city?: string | null;
          country?: string;
          elo?: number;
          preferred_language?: "ru" | "en" | "kk";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          city?: string | null;
          country?: string;
          elo?: number;
          preferred_language?: "ru" | "en" | "kk";
          updated_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          invite_code: string;
          host_id: string;
          guest_id: string | null;
          host_color: "white" | "black" | "random";
          time_control: string;
          status: "waiting" | "active" | "finished" | "abandoned";
          current_fen: string;
          last_move_at: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          invite_code: string;
          host_id: string;
          guest_id?: string | null;
          host_color?: "white" | "black" | "random";
          time_control?: string;
          status?: "waiting" | "active" | "finished" | "abandoned";
          current_fen?: string;
          last_move_at?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          guest_id?: string | null;
          status?: "waiting" | "active" | "finished" | "abandoned";
          current_fen?: string;
          last_move_at?: string | null;
        };
        Relationships: [];
      };
      room_moves: {
        Row: {
          room_id: string;
          ply: number;
          uci: string;
          san: string;
          fen_after: string;
          by_user_id: string;
          server_received_at: string;
        };
        Insert: {
          room_id: string;
          ply: number;
          uci: string;
          san: string;
          fen_after: string;
          by_user_id: string;
          server_received_at?: string;
        };
        Update: {
          uci?: string;
          san?: string;
          fen_after?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          mode: "ai" | "online" | "local";
          white_id: string | null;
          black_id: string | null;
          white_name: string;
          black_name: string;
          pgn: string;
          final_fen: string | null;
          result: "1-0" | "0-1" | "1/2-1/2" | "*";
          termination: string | null;
          ply_count: number;
          room_id: string | null;
          created_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          mode: "ai" | "online" | "local";
          white_id?: string | null;
          black_id?: string | null;
          white_name: string;
          black_name: string;
          pgn?: string;
          final_fen?: string | null;
          result?: "1-0" | "0-1" | "1/2-1/2" | "*";
          termination?: string | null;
          ply_count?: number;
          room_id?: string | null;
          created_at?: string;
          finished_at?: string | null;
        };
        Update: {
          pgn?: string;
          final_fen?: string | null;
          result?: "1-0" | "0-1" | "1/2-1/2" | "*";
          termination?: string | null;
          finished_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
