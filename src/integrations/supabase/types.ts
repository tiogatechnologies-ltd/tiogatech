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
      affiliate_applications: {
        Row: {
          audience_size: string | null
          channels: string[]
          created_at: string
          email: string
          full_name: string
          id: string
          location: string | null
          notes: string | null
          phone: string
          social_links: string | null
          status: string
          updated_at: string
          why: string | null
        }
        Insert: {
          audience_size?: string | null
          channels?: string[]
          created_at?: string
          email: string
          full_name: string
          id?: string
          location?: string | null
          notes?: string | null
          phone: string
          social_links?: string | null
          status?: string
          updated_at?: string
          why?: string | null
        }
        Update: {
          audience_size?: string | null
          channels?: string[]
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string
          social_links?: string | null
          status?: string
          updated_at?: string
          why?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          application_id: string | null
          code: string
          commission_rate: number
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          payout_details: string | null
          payout_method: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          code: string
          commission_rate?: number
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          payout_details?: string | null
          payout_method?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          code?: string
          commission_rate?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          payout_details?: string | null
          payout_method?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "affiliate_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      app_waitlist: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          platform: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          platform?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          platform?: string
          source?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          published: boolean
          published_at: string | null
          read_minutes: number
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          read_minutes?: number
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          read_minutes?: number
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      career_applications: {
        Row: {
          career_id: string | null
          cover_note: string
          created_at: string
          cv_path: string
          email: string
          full_name: string
          id: string
          location: string
          phone: string
          role_title: string
          status: string
          updated_at: string
          years_experience: string
        }
        Insert: {
          career_id?: string | null
          cover_note?: string
          created_at?: string
          cv_path: string
          email: string
          full_name: string
          id?: string
          location?: string
          phone: string
          role_title: string
          status?: string
          updated_at?: string
          years_experience?: string
        }
        Update: {
          career_id?: string | null
          cover_note?: string
          created_at?: string
          cv_path?: string
          email?: string
          full_name?: string
          id?: string
          location?: string
          phone?: string
          role_title?: string
          status?: string
          updated_at?: string
          years_experience?: string
        }
        Relationships: []
      }
      careers: {
        Row: {
          created_at: string
          deadline: string
          email_subject: string
          highlights: string[]
          id: string
          is_active: boolean
          location: string
          requirements: string
          sort_order: number
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string
          email_subject?: string
          highlights?: string[]
          id?: string
          is_active?: boolean
          location?: string
          requirements?: string
          sort_order?: number
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string
          email_subject?: string
          highlights?: string[]
          id?: string
          is_active?: boolean
          location?: string
          requirements?: string
          sort_order?: number
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      home_automation_packages: {
        Row: {
          badge: string | null
          created_at: string
          description: string
          entertainment: string[]
          features: string[]
          id: string
          is_active: boolean
          name: string
          price: number | null
          price_label: string | null
          sort_order: number
          tagline: string
          tier: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          description?: string
          entertainment?: string[]
          features?: string[]
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          price_label?: string | null
          sort_order?: number
          tagline?: string
          tier: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          description?: string
          entertainment?: string[]
          features?: string[]
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          price_label?: string | null
          sort_order?: number
          tagline?: string
          tier?: string
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
          affiliate_code: string | null
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
          referrer: string | null
          source: string
          status: string
          timeline: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          affiliate_code?: string | null
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
          referrer?: string | null
          source?: string
          status?: string
          timeline?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          affiliate_code?: string | null
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
          referrer?: string | null
          source?: string
          status?: string
          timeline?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      newsletter_broadcasts: {
        Row: {
          created_at: string
          html: string
          id: string
          sent_by: string | null
          sent_count: number
          subject: string
        }
        Insert: {
          created_at?: string
          html: string
          id?: string
          sent_by?: string | null
          sent_count?: number
          subject: string
        }
        Update: {
          created_at?: string
          html?: string
          id?: string
          sent_by?: string | null
          sent_count?: number
          subject?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirm_token: string
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          source: string
          unsubscribe_token: string
          unsubscribed: boolean
          updated_at: string
        }
        Insert: {
          confirm_token?: string
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          source?: string
          unsubscribe_token?: string
          unsubscribed?: boolean
          updated_at?: string
        }
        Update: {
          confirm_token?: string
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          source?: string
          unsubscribe_token?: string
          unsubscribed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          price_label: string | null
          product_name: string
          product_type: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          price_label?: string | null
          product_name: string
          product_type?: string | null
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          price_label?: string | null
          product_name?: string
          product_type?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          consent: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          item_count: number
          items_summary: string
          location: string
          notes: string | null
          order_number: string
          phone: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          consent?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          item_count?: number
          items_summary?: string
          location: string
          notes?: string | null
          order_number?: string
          phone: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          item_count?: number
          items_summary?: string
          location?: string
          notes?: string | null
          order_number?: string
          phone?: string
          source?: string
          status?: string
          updated_at?: string
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
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
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
      smart_locks: {
        Row: {
          badge: string | null
          category: string
          created_at: string
          description: string
          features: string[]
          id: string
          ideal_for: string
          is_active: boolean
          model: string
          name: string
          power_system: string
          price: number | null
          price_label: string | null
          series: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category?: string
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          ideal_for?: string
          is_active?: boolean
          model?: string
          name: string
          power_system?: string
          price?: number | null
          price_label?: string | null
          series?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category?: string
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          ideal_for?: string
          is_active?: boolean
          model?: string
          name?: string
          power_system?: string
          price?: number | null
          price_label?: string | null
          series?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      solar_packages: {
        Row: {
          accessories_price: number | null
          appliances: string
          badge: string | null
          battery: string
          battery_price: number | null
          battery_type: string
          charge_controller: string
          charge_controller_price: number | null
          created_at: string
          id: string
          inverter: string
          inverter_price: number | null
          is_active: boolean
          package_number: number
          setup_fee: number | null
          solar_panels: string
          solar_panels_price: number | null
          sort_order: number
          tagline: string | null
          total_price: number
          updated_at: string
        }
        Insert: {
          accessories_price?: number | null
          appliances: string
          badge?: string | null
          battery: string
          battery_price?: number | null
          battery_type?: string
          charge_controller?: string
          charge_controller_price?: number | null
          created_at?: string
          id?: string
          inverter: string
          inverter_price?: number | null
          is_active?: boolean
          package_number: number
          setup_fee?: number | null
          solar_panels: string
          solar_panels_price?: number | null
          sort_order?: number
          tagline?: string | null
          total_price: number
          updated_at?: string
        }
        Update: {
          accessories_price?: number | null
          appliances?: string
          badge?: string | null
          battery?: string
          battery_price?: number | null
          battery_type?: string
          charge_controller?: string
          charge_controller_price?: number | null
          created_at?: string
          id?: string
          inverter?: string
          inverter_price?: number | null
          is_active?: boolean
          package_number?: number
          setup_fee?: number | null
          solar_panels?: string
          solar_panels_price?: number | null
          sort_order?: number
          tagline?: string | null
          total_price?: number
          updated_at?: string
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
