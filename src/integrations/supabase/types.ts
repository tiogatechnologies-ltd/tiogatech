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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      conversions: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string
        }
        Relationships: []
      }
      form_questions: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number
          step_key: string
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json | null
          question_text: string
          question_type?: string
          sort_order?: number
          step_key: string
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number
          step_key?: string
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      landing_content: {
        Row: {
          content: Json
          id: string
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          action_type: string
          created_at: string
          created_by: string
          id: string
          lead_id: string
          note: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by: string
          id?: string
          lead_id: string
          note?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          appliances: string[] | null
          budget: string | null
          consent: boolean
          created_at: string
          email: string | null
          full_name: string
          has_electricity: string | null
          id: string
          location: string
          main_goal: string | null
          notes: string | null
          phone: string
          products: string[]
          source: string
          status: string
          timeline: string | null
        }
        Insert: {
          appliances?: string[] | null
          budget?: string | null
          consent?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          has_electricity?: string | null
          id?: string
          location: string
          main_goal?: string | null
          notes?: string | null
          phone: string
          products?: string[]
          source?: string
          status?: string
          timeline?: string | null
        }
        Update: {
          appliances?: string[] | null
          budget?: string | null
          consent?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          has_electricity?: string | null
          id?: string
          location?: string
          main_goal?: string | null
          notes?: string | null
          phone?: string
          products?: string[]
          source?: string
          status?: string
          timeline?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      product_clicks: {
        Row: {
          created_at: string
          id: string
          product_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          best_for: string
          category: string
          created_at: string
          description: string
          features: string[]
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: string | null
          series: string | null
          sort_order: number
          specifications: Json | null
          tags: string[] | null
          tier: string
          updated_at: string
        }
        Insert: {
          best_for?: string
          category: string
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: string | null
          series?: string | null
          sort_order?: number
          specifications?: Json | null
          tags?: string[] | null
          tier?: string
          updated_at?: string
        }
        Update: {
          best_for?: string
          category?: string
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: string | null
          series?: string | null
          sort_order?: number
          specifications?: Json | null
          tags?: string[] | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
