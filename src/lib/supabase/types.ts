// Hand-written types for the tables/views this app touches directly.
// Not a full generated schema — extend as new tables/columns are added.
// (Once the project is linked to a real Supabase project, prefer
// `supabase gen types typescript` to keep this in sync automatically.)

export type UserRole = "student" | "booth_staff" | "admin";
export type GameType = "digital" | "physical" | "card";
export type SubmissionSource = "claim_token" | "qr_checkin" | "card_answer";
export type DailyFeatureKind = "poster" | "video";

export interface Profile {
  id: string;
  email: string;
  nickname: string | null;
  role: UserRole;
  group_id: string | null;
  created_at: string;
}

export interface Station {
  id: string;
  label: string;
  location_note: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  name: string;
  type: GameType;
  points_value: number;
  embed_url: string | null;
  station_id: string | null;
  active_from: string | null;
  active_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CardPuzzle {
  id: string;
  game_id: string;
  slug: string;
  prompt: string | null;
  correct_answer: string;
  created_at: string;
}

export interface ClaimToken {
  id: string;
  game_id: string;
  token: string;
  issued_by: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  claimed_by_user_id: string | null;
}

export interface Submission {
  id: string;
  user_id: string;
  game_id: string;
  points_awarded: number;
  source: SubmissionSource;
  flagged: boolean;
  created_at: string;
}

export interface DailyFeature {
  id: string;
  date: string;
  kind: DailyFeatureKind;
  title: string;
  media_url: string;
  link_href: string | null;
  created_at: string;
}

export interface LeaderboardIndividualRow {
  user_id: string;
  nickname: string;
  total_points: number;
}

export interface LeaderboardGroupRow {
  group_id: string;
  name: string;
  total_points: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; Relationships: [] };
      stations: { Row: Station; Insert: Partial<Station>; Update: Partial<Station>; Relationships: [] };
      games: { Row: Game; Insert: Partial<Game>; Update: Partial<Game>; Relationships: [] };
      card_puzzles: { Row: CardPuzzle; Insert: Partial<CardPuzzle>; Update: Partial<CardPuzzle>; Relationships: [] };
      claim_tokens: { Row: ClaimToken; Insert: Partial<ClaimToken>; Update: Partial<ClaimToken>; Relationships: [] };
      submissions: { Row: Submission; Insert: Partial<Submission>; Update: Partial<Submission>; Relationships: [] };
      daily_features: { Row: DailyFeature; Insert: Partial<DailyFeature>; Update: Partial<DailyFeature>; Relationships: [] };
    };
    Views: {
      leaderboard_individual: { Row: LeaderboardIndividualRow; Relationships: [] };
      leaderboard_group: { Row: LeaderboardGroupRow; Relationships: [] };
    };
    Functions: {
      set_my_nickname: {
        Args: { new_nickname: string };
        Returns: void;
      };
      claim_token: {
        Args: { p_token: string };
        Returns: { game_id: string; game_name: string; points_awarded: number }[];
      };
      submit_puzzle_answer: {
        Args: { p_slug: string; p_answer: string };
        Returns: {
          correct: boolean;
          locked: boolean;
          attempts_left: number;
          game_id: string;
          game_name: string;
          points_awarded: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
