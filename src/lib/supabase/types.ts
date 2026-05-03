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
          is_pro: boolean;
          active_skin: string;
          pro_purchased_at: string | null;
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
          is_pro?: boolean;
          active_skin?: string;
          pro_purchased_at?: string | null;
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
          is_pro?: boolean;
          active_skin?: string;
          pro_purchased_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          amount_cents: number;
          currency: string;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          amount_cents: number;
          currency?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          product_id: string;
          amount_cents: number;
          currency: string;
        }>;
        Relationships: [];
      };
      stripe_events: {
        Row: {
          id: string;
          type: string;
          payload: Json;
          processed_at: string;
        };
        Insert: {
          id: string;
          type: string;
          payload: Json;
          processed_at?: string;
        };
        Update: Partial<{ type: string }>;
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
    Views: {
      leaderboard: {
        Row: {
          id: string;
          display_name: string | null;
          city: string | null;
          country: string;
          elo: number;
          games_played: number;
          wins: number;
          losses: number;
          draws: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      refresh_leaderboard: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
