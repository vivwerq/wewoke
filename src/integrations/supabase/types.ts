export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      friendships: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"] | null
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"] | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      match_queue: {
        Row: {
          created_at: string | null
          id: string
          intent: Database["public"]["Enums"]["intent_type"]
          interests: string[] | null
          language: string | null
          mood: Database["public"]["Enums"]["mood_type"]
          prefer_nearby: boolean | null
          region: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent: Database["public"]["Enums"]["intent_type"]
          interests?: string[] | null
          language?: string | null
          mood: Database["public"]["Enums"]["mood_type"]
          prefer_nearby?: boolean | null
          region?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["intent_type"]
          interests?: string[] | null
          language?: string | null
          mood?: Database["public"]["Enums"]["mood_type"]
          prefer_nearby?: boolean | null
          region?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          intent: Database["public"]["Enums"]["intent_type"] | null
          interests: string[] | null
          is_online: boolean | null
          language: string | null
          last_call_at: string | null
          mood: Database["public"]["Enums"]["mood_type"] | null
          region: string | null
          streak_days: number | null
          total_calls: number | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["intent_type"] | null
          interests?: string[] | null
          is_online?: boolean | null
          language?: string | null
          last_call_at?: string | null
          mood?: Database["public"]["Enums"]["mood_type"] | null
          region?: string | null
          streak_days?: number | null
          total_calls?: number | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["intent_type"] | null
          interests?: string[] | null
          is_online?: boolean | null
          language?: string | null
          last_call_at?: string | null
          mood?: Database["public"]["Enums"]["mood_type"] | null
          region?: string | null
          streak_days?: number | null
          total_calls?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          call_id: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at: string | null
          description: string | null
          id: string
          reported_user_id: string
          reporter_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          call_id?: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          reported_user_id: string
          reporter_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          call_id?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          reported_user_id?: string
          reporter_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      friendship_status: "pending" | "accepted" | "rejected"
      intent_type:
        | "fun_chat"
        | "study_partner"
        | "music_talk"
        | "venting"
        | "random"
      mood_type:
        | "chill"
        | "excited"
        | "bored"
        | "stressed"
        | "talkative"
        | "silent"
      report_category: "harassment" | "nudity" | "violence" | "spam"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      friendship_status: ["pending", "accepted", "rejected"],
      intent_type: [
        "fun_chat",
        "study_partner",
        "music_talk",
        "venting",
        "random",
      ],
      mood_type: [
        "chill",
        "excited",
        "bored",
        "stressed",
        "talkative",
        "silent",
      ],
      report_category: ["harassment", "nudity", "violence", "spam"],
    },
  },
} as const
