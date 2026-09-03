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
    PostgrestVersion: "14.5"
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
      affiliate_link_clicks: {
        Row: {
          affiliate_id: string
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          link_id: string | null
          referrer: string | null
          session_id: string | null
          slug: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          link_id?: string | null
          referrer?: string | null
          session_id?: string | null
          slug?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          link_id?: string | null
          referrer?: string | null
          session_id?: string | null
          slug?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_link_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          created_at: string
          destination_path: string
          id: string
          is_archived: boolean
          label: string
          slug: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          destination_path?: string
          id?: string
          is_archived?: boolean
          label: string
          slug: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          destination_path?: string
          id?: string
          is_archived?: boolean
          label?: string
          slug?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payout_requests: {
        Row: {
          admin_note: string | null
          affiliate_id: string
          amount: number
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          note: string | null
          payout_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          affiliate_id: string
          amount: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          payout_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          affiliate_id?: string
          amount?: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          payout_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payout_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payout_requests_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "affiliate_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          commission_total: number
          created_at: string
          id: string
          lead_count: number
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          revenue_total: number
          statement_token: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount?: number
          commission_total?: number
          created_at?: string
          id?: string
          lead_count?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          revenue_total?: number
          statement_token?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          commission_total?: number
          created_at?: string
          id?: string
          lead_count?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          revenue_total?: number
          statement_token?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
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
      ai_credit_usage: {
        Row: {
          assessment_id: string | null
          created_at: string
          description: string | null
          feature: string
          id: string
          source: string | null
          subscription_plan: string | null
          used_free_credit: boolean
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          description?: string | null
          feature: string
          id?: string
          source?: string | null
          subscription_plan?: string | null
          used_free_credit?: boolean
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          description?: string | null
          feature?: string
          id?: string
          source?: string | null
          subscription_plan?: string | null
          used_free_credit?: boolean
          user_id?: string
        }
        Relationships: []
      }
      ai_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          monthly_price_ngn: number
          notes: string | null
          plan: Database["public"]["Enums"]["ai_plan"]
          started_at: string
          status: Database["public"]["Enums"]["ai_sub_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          monthly_price_ngn?: number
          notes?: string | null
          plan?: Database["public"]["Enums"]["ai_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["ai_sub_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          monthly_price_ngn?: number
          notes?: string | null
          plan?: Database["public"]["Enums"]["ai_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["ai_sub_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      assessment_credits: {
        Row: {
          created_at: string
          last_reset_at: string | null
          purchased_credits: number
          total_credits: number
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string
          last_reset_at?: string | null
          purchased_credits?: number
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          created_at?: string
          last_reset_at?: string | null
          purchased_credits?: number
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          created_at: string
          detail: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          idempotency_key: string | null
          recipient: string | null
          rule_key: string
          status: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          idempotency_key?: string | null
          recipient?: string | null
          rule_key: string
          status?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          idempotency_key?: string | null
          recipient?: string | null
          rule_key?: string
          status?: string
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          category: string
          config: Json
          description: string | null
          enabled: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json
          description?: string | null
          enabled?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          description?: string | null
          enabled?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      backups_log: {
        Row: {
          created_at: string
          drive_file_id: string | null
          drive_web_link: string | null
          error_message: string | null
          filename: string
          id: string
          size_bytes: number | null
          status: string
          tables_count: number | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          drive_file_id?: string | null
          drive_web_link?: string | null
          error_message?: string | null
          filename: string
          id?: string
          size_bytes?: number | null
          status?: string
          tables_count?: number | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          drive_file_id?: string | null
          drive_web_link?: string | null
          error_message?: string | null
          filename?: string
          id?: string
          size_bytes?: number | null
          status?: string
          tables_count?: number | null
          triggered_by?: string | null
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
      brief_events: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          from_value: string | null
          id: string
          note: string | null
          to_value: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          from_value?: string | null
          id?: string
          note?: string | null
          to_value?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          from_value?: string | null
          id?: string
          note?: string | null
          to_value?: string | null
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
      custom_roles: {
        Row: {
          base_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          key: string
          label: string
        }
        Insert: {
          base_role: Database["public"]["Enums"]["app_role"]
          created_at?: string
          key: string
          label: string
        }
        Update: {
          base_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      custom_solution_requests: {
        Row: {
          admin_notes: string | null
          assessment_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          location: string | null
          phone: string | null
          requirements: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assessment_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          location?: string | null
          phone?: string | null
          requirements?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assessment_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          requirements?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_solution_requests_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "solar_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          pinned: boolean
          user_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          pinned?: boolean
          user_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          user_id?: string
        }
        Relationships: []
      }
      customer_tags: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          tag: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          tag: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          tag?: string
          user_id?: string
        }
        Relationships: []
      }
      debit_retry_queue: {
        Row: {
          application_id: string
          attempt_number: number
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          schedule_id: string
          scheduled_date: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          attempt_number?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          schedule_id: string
          scheduled_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          attempt_number?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          schedule_id?: string
          scheduled_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debit_retry_queue_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "finance_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debit_retry_queue_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "finance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      device_serials: {
        Row: {
          created_at: string
          customer_email: string | null
          dispatched_at: string
          id: string
          notes: string | null
          order_id: string | null
          order_item_id: string | null
          product_id: string | null
          product_name: string
          recorded_by: string | null
          serial: string
          status: string
          updated_at: string
          user_id: string | null
          warranty_until: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          dispatched_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string | null
          product_name: string
          recorded_by?: string | null
          serial: string
          status?: string
          updated_at?: string
          user_id?: string | null
          warranty_until?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          dispatched_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string | null
          product_name?: string
          recorded_by?: string | null
          serial?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_serials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_serials_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_serials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_redemptions: {
        Row: {
          amount_discounted: number
          created_at: string
          discount_id: string
          email: string | null
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_discounted?: number
          created_at?: string
          discount_id: string
          email?: string | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_discounted?: number
          created_at?: string
          discount_id?: string
          email?: string | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          active: boolean
          applies_to: string
          applies_to_values: string[]
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          min_cart_ngn: number
          per_customer_cap: number
          starts_at: string | null
          type: string
          updated_at: string
          uses_count: number
          value: number
        }
        Insert: {
          active?: boolean
          applies_to?: string
          applies_to_values?: string[]
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_cart_ngn?: number
          per_customer_cap?: number
          starts_at?: string | null
          type: string
          updated_at?: string
          uses_count?: number
          value: number
        }
        Update: {
          active?: boolean
          applies_to?: string
          applies_to_values?: string[]
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_cart_ngn?: number
          per_customer_cap?: number
          starts_at?: string | null
          type?: string
          updated_at?: string
          uses_count?: number
          value?: number
        }
        Relationships: []
      }
      due_date_overrides: {
        Row: {
          application_id: string
          created_at: string
          id: string
          installment_no: number
          new_due_date: string
          original_due_date: string
          overridden_by: string | null
          reason: string | null
          schedule_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          installment_no: number
          new_due_date: string
          original_due_date: string
          overridden_by?: string | null
          reason?: string | null
          schedule_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          installment_no?: number
          new_due_date?: string
          original_due_date?: string
          overridden_by?: string | null
          reason?: string | null
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "due_date_overrides_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "finance_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "due_date_overrides_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "finance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      finance_applications: {
        Row: {
          address: string
          approved_at: string | null
          assessment_id: string | null
          city: string | null
          consent: boolean
          consent_ip: string | null
          consent_timestamp: string | null
          created_at: string
          date_of_birth: string | null
          deadline_date: string | null
          deposit_ngn: number
          direct_debit_consent: boolean
          effective_payment_method: string
          email: string
          employer: string | null
          financed_ngn: number
          full_name: string
          id: string
          id_document_url: string | null
          id_number: string | null
          id_type: string | null
          insurance_fee_ngn: number | null
          interest_rate_pct: number | null
          is_asset_financing: boolean
          item_name: string
          item_reference: string | null
          management_fee_ngn: number | null
          monthly_income_ngn: number | null
          monthly_interest_ngn: number | null
          monthly_payment_ngn: number
          monthly_principal_ngn: number | null
          months: number
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          notes: string | null
          occupation: string | null
          package_slug: string | null
          paystack_authorization_code: string | null
          paystack_customer_code: string | null
          phone: string
          rejection_reason: string | null
          reviewer_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["finance_app_status"]
          total_amount_ngn: number
          total_interest_ngn: number | null
          total_repayment_ngn: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          approved_at?: string | null
          assessment_id?: string | null
          city?: string | null
          consent?: boolean
          consent_ip?: string | null
          consent_timestamp?: string | null
          created_at?: string
          date_of_birth?: string | null
          deadline_date?: string | null
          deposit_ngn?: number
          direct_debit_consent?: boolean
          effective_payment_method?: string
          email: string
          employer?: string | null
          financed_ngn: number
          full_name: string
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          id_type?: string | null
          insurance_fee_ngn?: number | null
          interest_rate_pct?: number | null
          is_asset_financing?: boolean
          item_name: string
          item_reference?: string | null
          management_fee_ngn?: number | null
          monthly_income_ngn?: number | null
          monthly_interest_ngn?: number | null
          monthly_payment_ngn: number
          monthly_principal_ngn?: number | null
          months: number
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          notes?: string | null
          occupation?: string | null
          package_slug?: string | null
          paystack_authorization_code?: string | null
          paystack_customer_code?: string | null
          phone: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["finance_app_status"]
          total_amount_ngn: number
          total_interest_ngn?: number | null
          total_repayment_ngn?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          approved_at?: string | null
          assessment_id?: string | null
          city?: string | null
          consent?: boolean
          consent_ip?: string | null
          consent_timestamp?: string | null
          created_at?: string
          date_of_birth?: string | null
          deadline_date?: string | null
          deposit_ngn?: number
          direct_debit_consent?: boolean
          effective_payment_method?: string
          email?: string
          employer?: string | null
          financed_ngn?: number
          full_name?: string
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          id_type?: string | null
          insurance_fee_ngn?: number | null
          interest_rate_pct?: number | null
          is_asset_financing?: boolean
          item_name?: string
          item_reference?: string | null
          management_fee_ngn?: number | null
          monthly_income_ngn?: number | null
          monthly_interest_ngn?: number | null
          monthly_payment_ngn?: number
          monthly_principal_ngn?: number | null
          months?: number
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          notes?: string | null
          occupation?: string | null
          package_slug?: string | null
          paystack_authorization_code?: string | null
          paystack_customer_code?: string | null
          phone?: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["finance_app_status"]
          total_amount_ngn?: number
          total_interest_ngn?: number | null
          total_repayment_ngn?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_applications_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "solar_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_payments: {
        Row: {
          amount_ngn: number
          application_id: string
          created_at: string
          id: string
          method: string
          proof_url: string | null
          reference: string | null
          schedule_id: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_ngn: number
          application_id: string
          created_at?: string
          id?: string
          method?: string
          proof_url?: string | null
          reference?: string | null
          schedule_id?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_ngn?: number
          application_id?: string
          created_at?: string
          id?: string
          method?: string
          proof_url?: string | null
          reference?: string | null
          schedule_id?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "finance_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_payments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "finance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_schedules: {
        Row: {
          amount_ngn: number
          application_id: string
          auto_charge_status: string | null
          created_at: string
          due_date: string
          id: string
          installment_no: number
          is_deposit: boolean
          last_charge_error: string | null
          original_due_date: string | null
          override_reason: string | null
          paid_at: string | null
          paid_reference: string | null
          payment_reference: string | null
          payment_url: string | null
          proof_url: string | null
          reminded_at: string | null
          status: Database["public"]["Enums"]["finance_inst_status"]
          updated_at: string
        }
        Insert: {
          amount_ngn: number
          application_id: string
          auto_charge_status?: string | null
          created_at?: string
          due_date: string
          id?: string
          installment_no: number
          is_deposit?: boolean
          last_charge_error?: string | null
          original_due_date?: string | null
          override_reason?: string | null
          paid_at?: string | null
          paid_reference?: string | null
          payment_reference?: string | null
          payment_url?: string | null
          proof_url?: string | null
          reminded_at?: string | null
          status?: Database["public"]["Enums"]["finance_inst_status"]
          updated_at?: string
        }
        Update: {
          amount_ngn?: number
          application_id?: string
          auto_charge_status?: string | null
          created_at?: string
          due_date?: string
          id?: string
          installment_no?: number
          is_deposit?: boolean
          last_charge_error?: string | null
          original_due_date?: string | null
          override_reason?: string | null
          paid_at?: string | null
          paid_reference?: string | null
          payment_reference?: string | null
          payment_url?: string | null
          proof_url?: string | null
          reminded_at?: string | null
          status?: Database["public"]["Enums"]["finance_inst_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_schedules_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "finance_applications"
            referencedColumns: ["id"]
          },
        ]
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
          affiliate_link_slug: string | null
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
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          affiliate_code?: string | null
          affiliate_link_slug?: string | null
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
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          affiliate_code?: string | null
          affiliate_link_slug?: string | null
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
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      lumivolt_sizings: {
        Row: {
          appliances: Json
          battery_ah: number | null
          battery_dod: number
          battery_kwh: number | null
          battery_type: string
          battery_voltage: number
          charge_controller_a: number | null
          created_at: string
          daily_energy_wh: number
          days_autonomy: number
          email: string | null
          engineer_owner_id: string | null
          full_name: string | null
          id: string
          internal_notes: string | null
          inverter_w: number | null
          lead_id: string | null
          location: string | null
          notes: string | null
          phone: string | null
          pipeline_status: string
          recommended_panel_w: number | null
          revised: Json | null
          sales_owner_id: string | null
          share_token: string | null
          solar_panel_w: number | null
          source: string | null
          sunlight_hours: number
          total_load_w: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appliances?: Json
          battery_ah?: number | null
          battery_dod?: number
          battery_kwh?: number | null
          battery_type?: string
          battery_voltage?: number
          charge_controller_a?: number | null
          created_at?: string
          daily_energy_wh?: number
          days_autonomy?: number
          email?: string | null
          engineer_owner_id?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          inverter_w?: number | null
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_status?: string
          recommended_panel_w?: number | null
          revised?: Json | null
          sales_owner_id?: string | null
          share_token?: string | null
          solar_panel_w?: number | null
          source?: string | null
          sunlight_hours?: number
          total_load_w?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appliances?: Json
          battery_ah?: number | null
          battery_dod?: number
          battery_kwh?: number | null
          battery_type?: string
          battery_voltage?: number
          charge_controller_a?: number | null
          created_at?: string
          daily_energy_wh?: number
          days_autonomy?: number
          email?: string | null
          engineer_owner_id?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          inverter_w?: number | null
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_status?: string
          recommended_panel_w?: number | null
          revised?: Json | null
          sales_owner_id?: string | null
          share_token?: string | null
          solar_panel_w?: number | null
          source?: string | null
          sunlight_hours?: number
          total_load_w?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lumivolt_sizings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      order_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          affiliate_code: string | null
          affiliate_link_slug: string | null
          billing_address: Json | null
          consent: boolean
          created_at: string
          discount_amount: number | null
          discount_code: string | null
          email: string | null
          fulfilled_at: string | null
          full_name: string
          id: string
          internal_notes: string | null
          item_count: number
          items_summary: string
          location: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_provider: string | null
          payment_reference: string | null
          payment_status: string | null
          phone: string
          shipping_address: Json | null
          shipping_fee: number | null
          shipping_method: string | null
          source: string
          status: string
          subtotal: number | null
          total: number | null
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliate_code?: string | null
          affiliate_link_slug?: string | null
          billing_address?: Json | null
          consent?: boolean
          created_at?: string
          discount_amount?: number | null
          discount_code?: string | null
          email?: string | null
          fulfilled_at?: string | null
          full_name: string
          id?: string
          internal_notes?: string | null
          item_count?: number
          items_summary?: string
          location: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          phone: string
          shipping_address?: Json | null
          shipping_fee?: number | null
          shipping_method?: string | null
          source?: string
          status?: string
          subtotal?: number | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string | null
          affiliate_link_slug?: string | null
          billing_address?: Json | null
          consent?: boolean
          created_at?: string
          discount_amount?: number | null
          discount_code?: string | null
          email?: string | null
          fulfilled_at?: string | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          item_count?: number
          items_summary?: string
          location?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          phone?: string
          shipping_address?: Json | null
          shipping_fee?: number | null
          shipping_method?: string | null
          source?: string
          status?: string
          subtotal?: number | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
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
          is_new_session: boolean
          landing_path: string | null
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          is_new_session?: boolean
          landing_path?: string | null
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          is_new_session?: boolean
          landing_path?: string | null
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount_ngn: number | null
          application_id: string | null
          created_at: string
          event_type: string
          id: string
          paystack_event_id: string | null
          provider: string
          raw: Json | null
          reference: string
          schedule_id: string | null
          status: string
        }
        Insert: {
          amount_ngn?: number | null
          application_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          paystack_event_id?: string | null
          provider?: string
          raw?: Json | null
          reference: string
          schedule_id?: string | null
          status: string
        }
        Update: {
          amount_ngn?: number | null
          application_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          paystack_event_id?: string | null
          provider?: string
          raw?: Json | null
          reference?: string
          schedule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "finance_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "finance_schedules"
            referencedColumns: ["id"]
          },
        ]
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
      product_reviews: {
        Row: {
          admin_reply: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          product_id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
          verified_purchase: boolean
        }
        Insert: {
          admin_reply?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          verified_purchase?: boolean
        }
        Update: {
          admin_reply?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          verified_purchase?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stock_movements: {
        Row: {
          actor_id: string | null
          created_at: string
          delta: number
          id: string
          note: string | null
          product_id: string
          reason: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delta: number
          id?: string
          note?: string | null
          product_id: string
          reason: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          note?: string | null
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_movements_product_id_fkey"
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
          low_stock_threshold: number | null
          name: string
          price: string | null
          series: string | null
          sort_order: number
          specifications: Json | null
          stock_qty: number | null
          tags: string[] | null
          tier: string
          updated_at: string
          warranty_months: number
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
          low_stock_threshold?: number | null
          name: string
          price?: string | null
          series?: string | null
          sort_order?: number
          specifications?: Json | null
          stock_qty?: number | null
          tags?: string[] | null
          tier?: string
          updated_at?: string
          warranty_months?: number
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
          low_stock_threshold?: number | null
          name?: string
          price?: string | null
          series?: string | null
          sort_order?: number
          specifications?: Json | null
          stock_qty?: number | null
          tags?: string[] | null
          tier?: string
          updated_at?: string
          warranty_months?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          created_at: string
          default_address: Json | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string
          default_address?: Json | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string
          default_address?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accepted_at: string | null
          assessment_id: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_location: string | null
          customer_name: string
          customer_phone: string | null
          deposit_pct: number
          discount: number
          exclusions: string | null
          id: string
          intro: string | null
          lead_id: string | null
          notes: string[]
          options_table: Json | null
          parent_quote_id: string | null
          quote_number: string
          scope: string | null
          sections: Json
          sent_at: string | null
          share_token: string
          sizing_id: string | null
          status: string
          subtitle: string | null
          subtotal: number
          title: string
          total: number
          updated_at: string
          user_id: string | null
          valid_until: string | null
          version: number
        }
        Insert: {
          accepted_at?: string | null
          assessment_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_location?: string | null
          customer_name: string
          customer_phone?: string | null
          deposit_pct?: number
          discount?: number
          exclusions?: string | null
          id?: string
          intro?: string | null
          lead_id?: string | null
          notes?: string[]
          options_table?: Json | null
          parent_quote_id?: string | null
          quote_number: string
          scope?: string | null
          sections?: Json
          sent_at?: string | null
          share_token?: string
          sizing_id?: string | null
          status?: string
          subtitle?: string | null
          subtotal?: number
          title?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
          version?: number
        }
        Update: {
          accepted_at?: string | null
          assessment_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_location?: string | null
          customer_name?: string
          customer_phone?: string | null
          deposit_pct?: number
          discount?: number
          exclusions?: string | null
          id?: string
          intro?: string | null
          lead_id?: string | null
          notes?: string[]
          options_table?: Json | null
          parent_quote_id?: string | null
          quote_number?: string
          scope?: string | null
          sections?: Json
          sent_at?: string | null
          share_token?: string
          sizing_id?: string | null
          status?: string
          subtitle?: string | null
          subtotal?: number
          title?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "solar_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_sizing_id_fkey"
            columns: ["sizing_id"]
            isOneToOne: false
            referencedRelation: "lumivolt_sizings"
            referencedColumns: ["id"]
          },
        ]
      }
      role_page_permissions: {
        Row: {
          allowed: boolean
          page_key: string
          role_key: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          page_key: string
          role_key: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          page_key?: string
          role_key?: string
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
      solar_assessments: {
        Row: {
          appliances: Json
          building_type: string | null
          created_at: string
          current_power_situation: string | null
          daily_kwh: number | null
          email: string
          engineer_id: string | null
          engineer_notes: string | null
          engineer_owner_id: string | null
          full_name: string
          full_report: Json | null
          id: string
          internal_notes: string | null
          is_full_unlocked: boolean
          lead_id: string | null
          location: string | null
          monthly_bill_ngn: number | null
          occupants: number | null
          peak_load_w: number | null
          phone: string | null
          pipeline_status: string
          recommendation: Json | null
          revised: Json | null
          sales_owner_id: string | null
          share_token: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appliances?: Json
          building_type?: string | null
          created_at?: string
          current_power_situation?: string | null
          daily_kwh?: number | null
          email: string
          engineer_id?: string | null
          engineer_notes?: string | null
          engineer_owner_id?: string | null
          full_name: string
          full_report?: Json | null
          id?: string
          internal_notes?: string | null
          is_full_unlocked?: boolean
          lead_id?: string | null
          location?: string | null
          monthly_bill_ngn?: number | null
          occupants?: number | null
          peak_load_w?: number | null
          phone?: string | null
          pipeline_status?: string
          recommendation?: Json | null
          revised?: Json | null
          sales_owner_id?: string | null
          share_token?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appliances?: Json
          building_type?: string | null
          created_at?: string
          current_power_situation?: string | null
          daily_kwh?: number | null
          email?: string
          engineer_id?: string | null
          engineer_notes?: string | null
          engineer_owner_id?: string | null
          full_name?: string
          full_report?: Json | null
          id?: string
          internal_notes?: string | null
          is_full_unlocked?: boolean
          lead_id?: string | null
          location?: string | null
          monthly_bill_ngn?: number | null
          occupants?: number | null
          peak_load_w?: number | null
          phone?: string | null
          pipeline_status?: string
          recommendation?: Json | null
          revised?: Json | null
          sales_owner_id?: string | null
          share_token?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solar_assessments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      support_tickets: {
        Row: {
          assigned_to: string | null
          channel: string
          conversation_context: string | null
          created_at: string
          id: string
          message: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string | null
          ticket_number: string
          updated_at: string
          user_contact: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string
          conversation_context?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string | null
          ticket_number?: string
          updated_at?: string
          user_contact: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          conversation_context?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string | null
          ticket_number?: string
          updated_at?: string
          user_contact?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_custom_roles: {
        Row: {
          created_at: string
          custom_role_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_custom_role_key_fkey"
            columns: ["custom_role_key"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["key"]
          },
        ]
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
      warranty_claim_events: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          claim_id: string
          created_at: string
          event_type: string
          from_value: string | null
          id: string
          note: string | null
          to_value: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          claim_id: string
          created_at?: string
          event_type: string
          from_value?: string | null
          id?: string
          note?: string | null
          to_value?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          claim_id?: string
          created_at?: string
          event_type?: string
          from_value?: string | null
          id?: string
          note?: string | null
          to_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claim_events_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "warranty_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claims: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          description: string
          id: string
          in_warranty: boolean
          internal_notes: string | null
          order_id: string | null
          photo_urls: string[]
          product_name: string | null
          reason: string
          resolution: string | null
          resolved_at: string | null
          rma_number: string
          serial: string | null
          serial_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          description: string
          id?: string
          in_warranty?: boolean
          internal_notes?: string | null
          order_id?: string | null
          photo_urls?: string[]
          product_name?: string | null
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          rma_number?: string
          serial?: string | null
          serial_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          description?: string
          id?: string
          in_warranty?: boolean
          internal_notes?: string | null
          order_id?: string | null
          photo_urls?: string[]
          product_name?: string | null
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          rma_number?: string
          serial?: string | null
          serial_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_serial_id_fkey"
            columns: ["serial_id"]
            isOneToOne: false
            referencedRelation: "device_serials"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_affiliate_id: { Args: never; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_ai_subscription: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          _action: string
          _diff: Json
          _entity: string
          _entity_id: string
        }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reset_monthly_free_credits: { Args: never; Returns: number }
      verified_email: { Args: never; Returns: string }
    }
    Enums: {
      ai_plan: "free" | "starter" | "business"
      ai_sub_status: "active" | "expired" | "pending" | "revoked"
      app_role:
        | "admin"
        | "user"
        | "staff"
        | "affiliate"
        | "customer"
        | "engineer"
      finance_app_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "active"
        | "completed"
        | "defaulted"
        | "cancelled"
      finance_inst_status: "upcoming" | "due" | "paid" | "overdue" | "waived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      ai_plan: ["free", "starter", "business"],
      ai_sub_status: ["active", "expired", "pending", "revoked"],
      app_role: ["admin", "user", "staff", "affiliate", "customer", "engineer"],
      finance_app_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "active",
        "completed",
        "defaulted",
        "cancelled",
      ],
      finance_inst_status: ["upcoming", "due", "paid", "overdue", "waived"],
    },
  },
} as const
