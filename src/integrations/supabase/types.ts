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
      admin_config: {
        Row: {
          config_key: string
          config_value: Json
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          code: string
          converted: boolean | null
          converted_at: string | null
          country: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          landing_page: string | null
          referer_url: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          affiliate_id: string
          code: string
          converted?: boolean | null
          converted_at?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referer_url?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          affiliate_id?: string
          code?: string
          converted?: boolean | null
          converted_at?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referer_url?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount_euros: number
          commission_rate: number
          created_at: string | null
          id: string
          mrr_euros: number
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          plan: string
          referral_id: string
          status: string | null
          stripe_invoice_id: string | null
        }
        Insert: {
          affiliate_id: string
          amount_euros: number
          commission_rate: number
          created_at?: string | null
          id?: string
          mrr_euros: number
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          plan: string
          referral_id: string
          status?: string | null
          stripe_invoice_id?: string | null
        }
        Update: {
          affiliate_id?: string
          amount_euros?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          mrr_euros?: number
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          plan?: string
          referral_id?: string
          status?: string | null
          stripe_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount_euros: number
          commission_ids: string[]
          created_at: string | null
          id: string
          notes: string | null
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          reference: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          amount_euros: number
          commission_ids?: string[]
          created_at?: string | null
          id?: string
          notes?: string | null
          payout_method: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          amount_euros?: number
          commission_ids?: string[]
          created_at?: string | null
          id?: string
          notes?: string | null
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          churned_at: string | null
          click_id: string | null
          converted_at: string | null
          created_at: string | null
          id: string
          plan: string | null
          referred_email: string
          referred_user_id: string | null
          status: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          affiliate_id: string
          churned_at?: string | null
          click_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          plan?: string | null
          referred_email: string
          referred_user_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          affiliate_id?: string
          churned_at?: string | null
          click_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          plan?: string | null
          referred_email?: string
          referred_user_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "affiliate_clicks"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          commission_rate: number | null
          commission_type: string | null
          created_at: string | null
          id: string
          notes: string | null
          payout_details: Json | null
          payout_method: string | null
          status: string | null
          total_clicks: number | null
          total_conversions: number | null
          total_earned_euros: number | null
          total_paid_euros: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          status?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_earned_euros?: number | null
          total_paid_euros?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          status?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_earned_euros?: number | null
          total_paid_euros?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_key_usage: {
        Row: {
          api_key_id: string
          called_at: string | null
          duration_ms: number | null
          endpoint: string
          id: string
          response_status: number | null
          user_id: string
        }
        Insert: {
          api_key_id: string
          called_at?: string | null
          duration_ms?: number | null
          endpoint: string
          id?: string
          response_status?: number | null
          user_id: string
        }
        Update: {
          api_key_id?: string
          called_at?: string | null
          duration_ms?: number | null
          endpoint?: string
          id?: string
          response_status?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          prefix: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          prefix: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          user_id?: string
        }
        Relationships: []
      }
      app_logs: {
        Row: {
          created_at: string | null
          id: string
          level: string
          meeting_id: string | null
          message: string
          metadata: Json | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          meeting_id?: string | null
          message: string
          metadata?: Json | null
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          meeting_id?: string | null
          message?: string
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_by: string | null
          blocked_until: string | null
          created_at: string | null
          event_count: number | null
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string | null
          event_count?: number | null
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string | null
          event_count?: number | null
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          author_id: string | null
          category: string | null
          content_gjs: Json | null
          content_html: string | null
          created_at: string | null
          excerpt: string | null
          featured: boolean | null
          has_lead_magnet: boolean | null
          id: string
          lead_magnet_id: string | null
          og_image_url: string | null
          published_at: string | null
          reading_time_minutes: number | null
          schema_markup: Json | null
          seo_canonical_url: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          share_count: number | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content_gjs?: Json | null
          content_html?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          has_lead_magnet?: boolean | null
          id?: string
          lead_magnet_id?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          schema_markup?: Json | null
          seo_canonical_url?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          share_count?: number | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content_gjs?: Json | null
          content_html?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          has_lead_magnet?: boolean | null
          id?: string
          lead_magnet_id?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          schema_markup?: Json | null
          seo_canonical_url?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          share_count?: number | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blog_images: {
        Row: {
          alt_text: string | null
          article_id: string | null
          caption: string | null
          created_at: string | null
          file_size_bytes: number | null
          generated_by_ai: boolean | null
          height: number | null
          id: string
          prompt_used: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          article_id?: string | null
          caption?: string | null
          created_at?: string | null
          file_size_bytes?: number | null
          generated_by_ai?: boolean | null
          height?: number | null
          id?: string
          prompt_used?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          article_id?: string | null
          caption?: string | null
          created_at?: string | null
          file_size_bytes?: number | null
          generated_by_ai?: boolean | null
          height?: number | null
          id?: string
          prompt_used?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_images_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendly_connections: {
        Row: {
          access_token: string
          calendly_org_uri: string | null
          calendly_user_uri: string
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          refresh_token: string | null
          scheduling_url: string | null
          token_expires_at: string | null
          token_type: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
          user_slug: string | null
        }
        Insert: {
          access_token: string
          calendly_org_uri?: string | null
          calendly_user_uri: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          refresh_token?: string | null
          scheduling_url?: string | null
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
          user_slug?: string | null
        }
        Update: {
          access_token?: string
          calendly_org_uri?: string | null
          calendly_user_uri?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          refresh_token?: string | null
          scheduling_url?: string | null
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
          user_slug?: string | null
        }
        Relationships: []
      }
      calendly_events: {
        Row: {
          calendly_uri: string
          cancellation: Json | null
          created_at: string | null
          end_time: string | null
          event_type_uri: string | null
          id: string
          invitees: Json | null
          invitees_count: number | null
          location: Json | null
          meeting_id: string | null
          name: string
          start_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendly_uri: string
          cancellation?: Json | null
          created_at?: string | null
          end_time?: string | null
          event_type_uri?: string | null
          id?: string
          invitees?: Json | null
          invitees_count?: number | null
          location?: Json | null
          meeting_id?: string | null
          name: string
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendly_uri?: string
          cancellation?: Json | null
          created_at?: string | null
          end_time?: string | null
          event_type_uri?: string | null
          id?: string
          invitees?: Json | null
          invitees_count?: number | null
          location?: Json | null
          meeting_id?: string | null
          name?: string
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendly_events_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      calendly_scheduling_links: {
        Row: {
          booking_url: string
          calendly_link_uri: string | null
          context: string | null
          created_at: string | null
          event_type_uri: string | null
          id: string
          max_event_count: number | null
          meeting_id: string | null
          owner_type: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          booking_url: string
          calendly_link_uri?: string | null
          context?: string | null
          created_at?: string | null
          event_type_uri?: string | null
          id?: string
          max_event_count?: number | null
          meeting_id?: string | null
          owner_type?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          booking_url?: string
          calendly_link_uri?: string | null
          context?: string | null
          created_at?: string | null
          event_type_uri?: string | null
          id?: string
          max_event_count?: number | null
          meeting_id?: string | null
          owner_type?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendly_scheduling_links_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          card: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          links: Json | null
          role: string
          suggestions: Json | null
          user_id: string
        }
        Insert: {
          card?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          links?: Json | null
          role: string
          suggestions?: Json | null
          user_id: string
        }
        Update: {
          card?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          links?: Json | null
          role?: string
          suggestions?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          interest_signals: string | null
          meeting_id: string
          name: string
          phone: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest_signals?: string | null
          meeting_id: string
          name: string
          phone?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest_signals?: string | null
          meeting_id?: string
          name?: string
          phone?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detected_contacts_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          domain: string
          domain_type: string
          error_message: string | null
          id: string
          landing_page_id: string
          last_check_at: string | null
          status: string | null
          user_id: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          domain: string
          domain_type: string
          error_message?: string | null
          id?: string
          landing_page_id: string
          last_check_at?: string | null
          status?: string | null
          user_id: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          domain?: string
          domain_type?: string
          error_message?: string | null
          id?: string
          landing_page_id?: string
          last_check_at?: string | null
          status?: string | null
          user_id?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_verifications_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          email_type: string
          error_message: string | null
          id: string
          meeting_id: string | null
          recipient_email: string
          resend_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          email_type?: string
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          recipient_email: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          email_type?: string
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string
          created_at: string
          css_content: string
          gjsdata: Json | null
          html_content: string
          id: string
          is_global: boolean | null
          name: string
          preview_text: string | null
          thumbnail_url: string | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          css_content?: string
          gjsdata?: Json | null
          html_content?: string
          id?: string
          is_global?: boolean | null
          name: string
          preview_text?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          css_content?: string
          gjsdata?: Json | null
          html_content?: string
          id?: string
          is_global?: boolean | null
          name?: string
          preview_text?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      extracted_decisions: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          source_timestamp: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meeting_id: string
          source_timestamp?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          source_timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_tasks: {
        Row: {
          assignee: string | null
          created_at: string
          deadline: string | null
          id: string
          meeting_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          source_timestamp: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          meeting_id: string
          priority?: Database["public"]["Enums"]["task_priority"]
          source_timestamp?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          meeting_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          source_timestamp?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_sessions: {
        Row: {
          admin_id: string
          ended_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          started_at: string | null
          target_user_id: string
        }
        Insert: {
          admin_id: string
          ended_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          target_user_id: string
        }
        Update: {
          admin_id?: string
          ended_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      kanban_activity: {
        Row: {
          action: string
          board_id: string
          card_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          board_id: string
          card_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          board_id?: string
          card_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_activity_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_board_stats"
            referencedColumns: ["board_id"]
          },
          {
            foreignKeyName: "kanban_activity_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_activity_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_boards: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_cards: {
        Row: {
          actual_hours: number | null
          archived_at: string | null
          assignee: string | null
          assignee_avatar_url: string | null
          attachments: Json | null
          board_id: string
          checklist: Json | null
          column_id: string
          comments_count: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          extracted_task_id: string | null
          id: string
          is_archived: boolean | null
          labels: string[] | null
          meeting_id: string | null
          position: number
          priority: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          archived_at?: string | null
          assignee?: string | null
          assignee_avatar_url?: string | null
          attachments?: Json | null
          board_id: string
          checklist?: Json | null
          column_id: string
          comments_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          extracted_task_id?: string | null
          id?: string
          is_archived?: boolean | null
          labels?: string[] | null
          meeting_id?: string | null
          position?: number
          priority?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          archived_at?: string | null
          assignee?: string | null
          assignee_avatar_url?: string | null
          attachments?: Json | null
          board_id?: string
          checklist?: Json | null
          column_id?: string
          comments_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          extracted_task_id?: string | null
          id?: string
          is_archived?: boolean | null
          labels?: string[] | null
          meeting_id?: string | null
          position?: number
          priority?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_board_stats"
            referencedColumns: ["board_id"]
          },
          {
            foreignKeyName: "kanban_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_extracted_task_id_fkey"
            columns: ["extracted_task_id"]
            isOneToOne: false
            referencedRelation: "extracted_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_columns: {
        Row: {
          auto_archive_days: number | null
          board_id: string
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_done_column: boolean | null
          name: string
          position: number
          wip_limit: number | null
        }
        Insert: {
          auto_archive_days?: number | null
          board_id: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_done_column?: boolean | null
          name: string
          position?: number
          wip_limit?: number | null
        }
        Update: {
          auto_archive_days?: number | null
          board_id?: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_done_column?: boolean | null
          name?: string
          position?: number
          wip_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_board_stats"
            referencedColumns: ["board_id"]
          },
          {
            foreignKeyName: "kanban_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "kanban_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_comments: {
        Row: {
          card_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kanban_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_bookings: {
        Row: {
          booked_date: string
          booked_time: string
          confirmation_sent_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          jitsi_room_name: string | null
          jitsi_room_url: string | null
          landing_page_id: string
          owner_notes: string | null
          prospect_company: string | null
          prospect_email: string
          prospect_message: string | null
          prospect_name: string
          prospect_phone: string | null
          rapidomeet_meeting_id: string | null
          reminder_sent_at: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booked_date: string
          booked_time: string
          confirmation_sent_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          jitsi_room_name?: string | null
          jitsi_room_url?: string | null
          landing_page_id: string
          owner_notes?: string | null
          prospect_company?: string | null
          prospect_email: string
          prospect_message?: string | null
          prospect_name: string
          prospect_phone?: string | null
          rapidomeet_meeting_id?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booked_date?: string
          booked_time?: string
          confirmation_sent_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          jitsi_room_name?: string | null
          jitsi_room_url?: string | null
          landing_page_id?: string
          owner_notes?: string | null
          prospect_company?: string | null
          prospect_email?: string
          prospect_message?: string | null
          prospect_name?: string
          prospect_phone?: string | null
          rapidomeet_meeting_id?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_bookings_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_bookings_rapidomeet_meeting_id_fkey"
            columns: ["rapidomeet_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          background_type: string | null
          background_value: string | null
          booking_config: Json | null
          booking_count: number | null
          content_gjs: Json | null
          content_html: string | null
          countdown_label: string | null
          countdown_target: string | null
          created_at: string | null
          custom_domain: string | null
          description: string | null
          domain_txt_record: string | null
          domain_verified: boolean | null
          domain_verified_at: string | null
          font_family: string | null
          has_booking_form: boolean | null
          has_countdown: boolean | null
          has_testimonials: boolean | null
          has_video_room: boolean | null
          id: string
          jitsi_config: Json | null
          logo_url: string | null
          og_image_url: string | null
          primary_color: string | null
          published_at: string | null
          reminder_config: Json | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          ssl_provisioned: boolean | null
          status: string | null
          subdomain: string | null
          subdomain_active: boolean | null
          subtitle: string | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          background_type?: string | null
          background_value?: string | null
          booking_config?: Json | null
          booking_count?: number | null
          content_gjs?: Json | null
          content_html?: string | null
          countdown_label?: string | null
          countdown_target?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          domain_txt_record?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          font_family?: string | null
          has_booking_form?: boolean | null
          has_countdown?: boolean | null
          has_testimonials?: boolean | null
          has_video_room?: boolean | null
          id?: string
          jitsi_config?: Json | null
          logo_url?: string | null
          og_image_url?: string | null
          primary_color?: string | null
          published_at?: string | null
          reminder_config?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          ssl_provisioned?: boolean | null
          status?: string | null
          subdomain?: string | null
          subdomain_active?: boolean | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          background_type?: string | null
          background_value?: string | null
          booking_config?: Json | null
          booking_count?: number | null
          content_gjs?: Json | null
          content_html?: string | null
          countdown_label?: string | null
          countdown_target?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          domain_txt_record?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          font_family?: string | null
          has_booking_form?: boolean | null
          has_countdown?: boolean | null
          has_testimonials?: boolean | null
          has_video_room?: boolean | null
          id?: string
          jitsi_config?: Json | null
          logo_url?: string | null
          og_image_url?: string | null
          primary_color?: string | null
          published_at?: string | null
          reminder_config?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          ssl_provisioned?: boolean | null
          status?: string | null
          subdomain?: string | null
          subdomain_active?: boolean | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      landing_templates: {
        Row: {
          category: string | null
          content_gjs: Json | null
          content_html: string
          created_at: string | null
          default_config: Json | null
          description: string | null
          id: string
          is_premium: boolean | null
          is_published: boolean | null
          name: string
          order_index: number | null
          thumbnail_url: string | null
        }
        Insert: {
          category?: string | null
          content_gjs?: Json | null
          content_html: string
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          name: string
          order_index?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          category?: string | null
          content_gjs?: Json | null
          content_html?: string
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          name?: string
          order_index?: number | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      leads_captures: {
        Row: {
          article_id: string | null
          company_name: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          ip_address: string | null
          lead_magnet_id: string | null
          phone: string | null
          source: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          article_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          ip_address?: string | null
          lead_magnet_id?: string | null
          phone?: string | null
          source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          article_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          ip_address?: string | null
          lead_magnet_id?: string | null
          phone?: string | null
          source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_captures_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_captures_lead_magnet_id_fkey"
            columns: ["lead_magnet_id"]
            isOneToOne: false
            referencedRelation: "leads_magnets"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_magnets: {
        Row: {
          content_html: string | null
          content_json: Json | null
          created_at: string | null
          description: string | null
          download_count: number | null
          file_url: string | null
          form_fields: Json | null
          id: string
          is_active: boolean | null
          requires_form: boolean | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          form_fields?: Json | null
          id?: string
          is_active?: boolean | null
          requires_form?: boolean | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          form_fields?: Json | null
          id?: string
          is_active?: boolean | null
          requires_form?: boolean | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting_recordings: {
        Row: {
          created_at: string | null
          download_url: string | null
          duration_seconds: number | null
          end_time: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          oauth_connection_id: string | null
          participants: Json | null
          provider: string
          provider_meeting_id: string
          provider_recording_id: string | null
          rapidomeet_meeting_id: string | null
          recording_url: string | null
          start_time: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          download_url?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          oauth_connection_id?: string | null
          participants?: Json | null
          provider: string
          provider_meeting_id: string
          provider_recording_id?: string | null
          rapidomeet_meeting_id?: string | null
          recording_url?: string | null
          start_time?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          download_url?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          oauth_connection_id?: string | null
          participants?: Json | null
          provider?: string
          provider_meeting_id?: string
          provider_recording_id?: string | null
          rapidomeet_meeting_id?: string | null
          recording_url?: string | null
          start_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_oauth_connection_id_fkey"
            columns: ["oauth_connection_id"]
            isOneToOne: false
            referencedRelation: "oauth_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_recordings_rapidomeet_meeting_id_fkey"
            columns: ["rapidomeet_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          audio_url: string | null
          channel: string | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          efficiency_breakdown: Json | null
          efficiency_score: number | null
          error_message: string | null
          id: string
          language: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          participants: Json | null
          precision_percent: number | null
          sentiment_score: number | null
          session_id: string | null
          status: Database["public"]["Enums"]["meeting_status"]
          summary: string | null
          title: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          audio_url?: string | null
          channel?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          efficiency_breakdown?: Json | null
          efficiency_score?: number | null
          error_message?: string | null
          id?: string
          language?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          participants?: Json | null
          precision_percent?: number | null
          sentiment_score?: number | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          audio_url?: string | null
          channel?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          efficiency_breakdown?: Json | null
          efficiency_score?: number | null
          error_message?: string | null
          id?: string
          language?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          participants?: Json | null
          precision_percent?: number | null
          sentiment_score?: number | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      mrr_snapshots: {
        Row: {
          churned_subscribers: number | null
          created_at: string | null
          id: string
          mrr_euros: number | null
          new_subscribers: number | null
          snapshot_date: string
          total_active: number | null
        }
        Insert: {
          churned_subscribers?: number | null
          created_at?: string | null
          id?: string
          mrr_euros?: number | null
          new_subscribers?: number | null
          snapshot_date: string
          total_active?: number | null
        }
        Update: {
          churned_subscribers?: number | null
          created_at?: string | null
          id?: string
          mrr_euros?: number | null
          new_subscribers?: number | null
          snapshot_date?: string
          total_active?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_connections: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          provider: string
          provider_email: string | null
          provider_user_id: string | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          provider: string
          provider_email?: string | null
          provider_user_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          provider?: string
          provider_email?: string | null
          provider_user_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          created_at: string
          provider: string
          redirect_uri: string | null
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          provider: string
          redirect_uri?: string | null
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          provider?: string
          redirect_uri?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_email_queue: {
        Row: {
          created_at: string | null
          email: string
          error_message: string | null
          first_name: string | null
          id: string
          resend_email_id: string | null
          scheduled_at: string
          sent_at: string | null
          skip_if_meeting: boolean | null
          skip_if_paid: boolean | null
          status: string | null
          step: number
          step_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          error_message?: string | null
          first_name?: string | null
          id?: string
          resend_email_id?: string | null
          scheduled_at: string
          sent_at?: string | null
          skip_if_meeting?: boolean | null
          skip_if_paid?: boolean | null
          status?: string | null
          step?: number
          step_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          error_message?: string | null
          first_name?: string | null
          id?: string
          resend_email_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          skip_if_meeting?: boolean | null
          skip_if_paid?: boolean | null
          status?: string | null
          step?: number
          step_name?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: string[] | null
          created_at: string | null
          current_step: string | null
          id: string
          is_completed: boolean | null
          skipped: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          is_completed?: boolean | null
          skipped?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          is_completed?: boolean | null
          skipped?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      openclaw_conversations: {
        Row: {
          created_at: string | null
          id: string
          messages: Json | null
          model: string | null
          skills_used: string[] | null
          title: string | null
          token_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          model?: string | null
          skills_used?: string[] | null
          title?: string | null
          token_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          model?: string | null
          skills_used?: string[] | null
          title?: string | null
          token_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      openclaw_skill_executions: {
        Row: {
          conversation_id: string | null
          duration_ms: number | null
          error_message: string | null
          executed_at: string | null
          id: string
          input_params: Json | null
          output_data: Json | null
          skill_slug: string
          success: boolean | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          input_params?: Json | null
          output_data?: Json | null
          skill_slug: string
          success?: boolean | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          input_params?: Json | null
          output_data?: Json | null
          skill_slug?: string
          success?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "openclaw_skill_executions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "openclaw_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      openclaw_skills: {
        Row: {
          author: string | null
          author_url: string | null
          category: string
          changelog: Json | null
          config_schema: Json | null
          created_at: string | null
          description: string
          icon: string | null
          id: string
          install_count: number | null
          is_active: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          is_published: boolean | null
          mcp_input_schema: Json
          mcp_tool_description: string
          mcp_tool_name: string
          name: string
          rating_avg: number | null
          rating_count: number | null
          readme: string | null
          required_plan: string | null
          screenshots: Json | null
          slug: string
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
          version: string | null
        }
        Insert: {
          author?: string | null
          author_url?: string | null
          category: string
          changelog?: Json | null
          config_schema?: Json | null
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          install_count?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          mcp_input_schema?: Json
          mcp_tool_description: string
          mcp_tool_name: string
          name: string
          rating_avg?: number | null
          rating_count?: number | null
          readme?: string | null
          required_plan?: string | null
          screenshots?: Json | null
          slug: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          version?: string | null
        }
        Update: {
          author?: string | null
          author_url?: string | null
          category?: string
          changelog?: Json | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          install_count?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          mcp_input_schema?: Json
          mcp_tool_description?: string
          mcp_tool_name?: string
          name?: string
          rating_avg?: number | null
          rating_count?: number | null
          readme?: string | null
          required_plan?: string | null
          screenshots?: Json | null
          slug?: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          version?: string | null
        }
        Relationships: []
      }
      pending_actions: {
        Row: {
          action_type: string
          created_at: string
          destination: string
          error_message: string | null
          id: string
          meeting_id: string
          payload: Json
          session_id: string | null
          status: string
          summary: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          destination?: string
          error_message?: string | null
          id?: string
          meeting_id: string
          payload?: Json
          session_id?: string | null
          status?: string
          summary?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          destination?: string
          error_message?: string | null
          id?: string
          meeting_id?: string
          payload?: Json
          session_id?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_actions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          api_calls_per_day: number | null
          api_calls_per_hour: number | null
          api_keys_max: number | null
          audio_max_duration_minutes: number | null
          audio_max_size_mb: number | null
          id: string
          meetings_per_month: number | null
          plan: string
          scenarios_max: number | null
          storage_gb: number | null
        }
        Insert: {
          api_calls_per_day?: number | null
          api_calls_per_hour?: number | null
          api_keys_max?: number | null
          audio_max_duration_minutes?: number | null
          audio_max_size_mb?: number | null
          id?: string
          meetings_per_month?: number | null
          plan: string
          scenarios_max?: number | null
          storage_gb?: number | null
        }
        Update: {
          api_calls_per_day?: number | null
          api_calls_per_hour?: number | null
          api_keys_max?: number | null
          audio_max_duration_minutes?: number | null
          audio_max_size_mb?: number | null
          id?: string
          meetings_per_month?: number | null
          plan?: string
          scenarios_max?: number | null
          storage_gb?: number | null
        }
        Relationships: []
      }
      playground_history: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          endpoint: string
          id: string
          params: Json | null
          response_body: Json | null
          response_status: number | null
          used_api_key: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint: string
          id?: string
          params?: Json | null
          response_body?: Json | null
          response_status?: number | null
          used_api_key?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint?: string
          id?: string
          params?: Json | null
          response_body?: Json | null
          response_status?: number | null
          used_api_key?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          first_name: string | null
          id: string
          is_suspended: boolean | null
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rapidocrm_syncs: {
        Row: {
          action: string | null
          contact_id: string | null
          error_message: string | null
          id: string
          meeting_id: string | null
          rapidocrm_contact_id: string | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          contact_id?: string | null
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          rapidocrm_contact_id?: string | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          contact_id?: string | null
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          rapidocrm_contact_id?: string | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapidocrm_syncs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "detected_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapidocrm_syncs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_rules: {
        Row: {
          apply_to: string | null
          block_duration_seconds: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_requests: number
          rule_name: string
          window_seconds: number
        }
        Insert: {
          apply_to?: string | null
          block_duration_seconds?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_requests?: number
          rule_name: string
          window_seconds?: number
        }
        Update: {
          apply_to?: string | null
          block_duration_seconds?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_requests?: number
          rule_name?: string
          window_seconds?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          function_name: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          function_name: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          function_name?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      reminder_schedules: {
        Row: {
          attempts: number | null
          booking_id: string
          channel: string
          created_at: string | null
          error_message: string | null
          id: string
          landing_page_id: string
          message_content: string | null
          metadata: Json | null
          reminder_type: string
          scheduled_at: string
          sent_at: string | null
          status: string | null
          to_email: string | null
          to_phone: string | null
          twilio_sid: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          booking_id: string
          channel: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          landing_page_id: string
          message_content?: string | null
          metadata?: Json | null
          reminder_type: string
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
          to_email?: string | null
          to_phone?: string | null
          twilio_sid?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          booking_id?: string
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          landing_page_id?: string
          message_content?: string | null
          metadata?: Json | null
          reminder_type?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
          to_email?: string | null
          to_phone?: string | null
          twilio_sid?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_schedules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "landing_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_schedules_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string | null
          id: string
          is_default: boolean | null
          language: string | null
          reminder_type: string
          subject: string | null
          template_name: string
          variables: string[] | null
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          language?: string | null
          reminder_type: string
          subject?: string | null
          template_name: string
          variables?: string[] | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          language?: string | null
          reminder_type?: string
          subject?: string | null
          template_name?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          content_html: string | null
          content_json: Json | null
          created_at: string | null
          distributed_to: Json | null
          id: string
          meeting_id: string
          report_type: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string | null
          distributed_to?: Json | null
          id?: string
          meeting_id: string
          report_type?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_html?: string | null
          content_json?: Json | null
          created_at?: string | null
          distributed_to?: Json | null
          id?: string
          meeting_id?: string
          report_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      resend_audiences: {
        Row: {
          contact_count: number | null
          created_at: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          name: string
          resend_audience_id: string
          segment: string
        }
        Insert: {
          contact_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          resend_audience_id: string
          segment: string
        }
        Update: {
          contact_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          resend_audience_id?: string
          segment?: string
        }
        Relationships: []
      }
      resend_broadcasts_log: {
        Row: {
          audience_segment: string
          bounces_count: number | null
          broadcast_type: string
          clicks_count: number | null
          content_html: string
          created_at: string | null
          created_by: string
          error_message: string | null
          id: string
          name: string
          opens_count: number | null
          recipients_count: number | null
          resend_audience_id: string
          resend_broadcast_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          unsubscribes_count: number | null
          updated_at: string | null
        }
        Insert: {
          audience_segment: string
          bounces_count?: number | null
          broadcast_type: string
          clicks_count?: number | null
          content_html: string
          created_at?: string | null
          created_by: string
          error_message?: string | null
          id?: string
          name: string
          opens_count?: number | null
          recipients_count?: number | null
          resend_audience_id: string
          resend_broadcast_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          unsubscribes_count?: number | null
          updated_at?: string | null
        }
        Update: {
          audience_segment?: string
          bounces_count?: number | null
          broadcast_type?: string
          clicks_count?: number | null
          content_html?: string
          created_at?: string | null
          created_by?: string
          error_message?: string | null
          id?: string
          name?: string
          opens_count?: number | null
          recipients_count?: number | null
          resend_audience_id?: string
          resend_broadcast_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          unsubscribes_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scenario_executions: {
        Row: {
          actions_results: Json | null
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          meeting_id: string | null
          scenario_id: string
          started_at: string | null
          status: string
          trigger_type: string
          user_id: string
        }
        Insert: {
          actions_results?: Json | null
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          scenario_id: string
          started_at?: string | null
          status?: string
          trigger_type: string
          user_id: string
        }
        Update: {
          actions_results?: Json | null
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          scenario_id?: string
          started_at?: string | null
          status?: string
          trigger_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_executions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_executions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          actions: Json
          created_at: string | null
          description: string | null
          execution_count: number | null
          filter_meeting_type: string[] | null
          filter_min_duration: number | null
          filter_sentiment_min: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          last_status: string | null
          name: string
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          filter_meeting_type?: string[] | null
          filter_min_duration?: number | null
          filter_sentiment_min?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          last_status?: string | null
          name: string
          trigger_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          filter_meeting_type?: string[] | null
          filter_min_duration?: number | null
          filter_sentiment_min?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          last_status?: string | null
          name?: string
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          method: string | null
          path: string | null
          request_body_hash: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          method?: string | null
          path?: string | null
          request_body_hash?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          method?: string | null
          path?: string | null
          request_body_hash?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shared_meetings: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string
          permissions: string | null
          shared_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id: string
          permissions?: string | null
          shared_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string
          permissions?: string | null
          shared_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_meetings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_meetings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reports: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          meeting_id: string
          report_id: string | null
          show_contacts: boolean | null
          show_transcription: boolean | null
          token: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          meeting_id: string
          report_id?: string | null
          show_contacts?: boolean | null
          show_transcription?: boolean | null
          token?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          meeting_id?: string
          report_id?: string | null
          show_contacts?: boolean | null
          show_transcription?: boolean | null
          token?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_reports_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_installations: {
        Row: {
          config: Json | null
          id: string
          installed_at: string | null
          is_active: boolean | null
          last_used_at: string | null
          skill_id: string
          skill_slug: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          id?: string
          installed_at?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          skill_id: string
          skill_slug: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          config?: Json | null
          id?: string
          installed_at?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          skill_id?: string
          skill_slug?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_installations_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "openclaw_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          review: string | null
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          review?: string | null
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          review?: string | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_ratings_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "openclaw_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_articles: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          assigned_to: string | null
          channel: string | null
          created_at: string | null
          first_response_at: string | null
          id: string
          metadata: Json | null
          priority: string | null
          resolved_at: string | null
          satisfaction_comment: string | null
          satisfaction_score: number | null
          status: string | null
          subject: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel?: string | null
          created_at?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          satisfaction_comment?: string | null
          satisfaction_score?: number | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string | null
          created_at?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          satisfaction_comment?: string | null
          satisfaction_score?: number | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          content_type: string | null
          conversation_id: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          is_read: boolean | null
          payload: Json | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          content_type?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_read?: boolean | null
          payload?: Json | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          content_type?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_read?: boolean | null
          payload?: Json | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      template_sends: {
        Row: {
          id: string
          meeting_id: string | null
          recipient_email: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          meeting_id?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          meeting_id?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_sends_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_variables: {
        Row: {
          category: string
          description: string | null
          example_value: string | null
          id: string
          label: string
          variable_key: string
        }
        Insert: {
          category: string
          description?: string | null
          example_value?: string | null
          id?: string
          label: string
          variable_key: string
        }
        Update: {
          category?: string
          description?: string | null
          example_value?: string | null
          id?: string
          label?: string
          variable_key?: string
        }
        Relationships: []
      }
      transcriptions: {
        Row: {
          created_at: string
          full_text: string
          id: string
          language: string | null
          meeting_id: string
          segments: Json | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          full_text?: string
          id?: string
          language?: string | null
          meeting_id: string
          segments?: Json | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          full_text?: string
          id?: string
          language?: string | null
          meeting_id?: string
          segments?: Json | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_certificates: {
        Row: {
          course_id: string
          course_title: string
          id: string
          issued_at: string | null
          metadata: Json | null
          user_id: string
          user_name: string
          valid_until: string | null
        }
        Insert: {
          course_id: string
          course_title: string
          id: string
          issued_at?: string | null
          metadata?: Json | null
          user_id: string
          user_name: string
          valid_until?: string | null
        }
        Update: {
          course_id?: string
          course_title?: string
          id?: string
          issued_at?: string | null
          metadata?: Json | null
          user_id?: string
          user_name?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "tutorial_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "tutorial_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_chapters: {
        Row: {
          content_markdown: string | null
          course_id: string
          created_at: string | null
          description: string | null
          has_quiz: boolean | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          order_index: number
          quiz_pass_score: number | null
          quiz_questions: Json | null
          slug: string
          thumbnail_url: string | null
          title: string
          video_duration_seconds: number | null
          video_provider: string | null
          video_url: string | null
        }
        Insert: {
          content_markdown?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          has_quiz?: boolean | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          order_index?: number
          quiz_pass_score?: number | null
          quiz_questions?: Json | null
          slug: string
          thumbnail_url?: string | null
          title: string
          video_duration_seconds?: number | null
          video_provider?: string | null
          video_url?: string | null
        }
        Update: {
          content_markdown?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          has_quiz?: boolean | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          order_index?: number
          quiz_pass_score?: number | null
          quiz_questions?: Json | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          video_duration_seconds?: number | null
          video_provider?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "tutorial_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "tutorial_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_courses: {
        Row: {
          category: string | null
          chapters_count: number | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          order_index: number | null
          required_plan: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          chapters_count?: number | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          order_index?: number | null
          required_plan?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          chapters_count?: number | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          order_index?: number | null
          required_plan?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tutorial_progress: {
        Row: {
          badge_earned: boolean | null
          certificate_id: string | null
          chapter_id: string | null
          completed_at: string | null
          completed_chapters: string[] | null
          completed_steps: number
          course_completed: boolean | null
          course_completed_at: string | null
          course_id: string | null
          id: string
          quiz_passed: boolean | null
          quiz_results: Json | null
          quiz_score: number | null
          started_at: string
          total_steps: number
          tutorial_slug: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          badge_earned?: boolean | null
          certificate_id?: string | null
          chapter_id?: string | null
          completed_at?: string | null
          completed_chapters?: string[] | null
          completed_steps?: number
          course_completed?: boolean | null
          course_completed_at?: string | null
          course_id?: string | null
          id?: string
          quiz_passed?: boolean | null
          quiz_results?: Json | null
          quiz_score?: number | null
          started_at?: string
          total_steps?: number
          tutorial_slug: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          badge_earned?: boolean | null
          certificate_id?: string | null
          chapter_id?: string | null
          completed_at?: string | null
          completed_chapters?: string[] | null
          completed_steps?: number
          course_completed?: boolean | null
          course_completed_at?: string | null
          course_id?: string | null
          id?: string
          quiz_passed?: boolean | null
          quiz_results?: Json | null
          quiz_score?: number | null
          started_at?: string
          total_steps?: number
          tutorial_slug?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "tutorial_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "tutorial_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "tutorial_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          account_label: string | null
          config: Json | null
          connected_at: string | null
          connection_type: string
          credentials: Json | null
          id: string
          integration_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_label?: string | null
          config?: Json | null
          connected_at?: string | null
          connection_type?: string
          credentials?: Json | null
          id?: string
          integration_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_label?: string | null
          config?: Json | null
          connected_at?: string | null
          connection_type?: string
          credentials?: Json | null
          id?: string
          integration_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
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
      user_settings: {
        Row: {
          created_at: string
          id: string
          settings_key: string
          settings_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings_key: string
          settings_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          settings_key?: string
          settings_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempted_at: string | null
          duration_ms: number | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          attempted_at?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          attempted_at?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          secret: string | null
          status: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          secret?: string | null
          status?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          secret?: string | null
          status?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"] | null
          status: string | null
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workspace_role"] | null
          status?: string | null
          token?: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"] | null
          status?: string | null
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["workspace_role"] | null
          status: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["workspace_role"] | null
          status?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["workspace_role"] | null
          status?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          max_members: number | null
          name: string
          owner_id: string
          plan: string | null
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          max_members?: number | null
          name: string
          owner_id: string
          plan?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          max_members?: number | null
          name?: string
          owner_id?: string
          plan?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      affiliate_leaderboard: {
        Row: {
          code: string | null
          commission_rate: number | null
          company: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          rank: number | null
          status: string | null
          total_conversions: number | null
          total_earned_euros: number | null
        }
        Relationships: []
      }
      affiliate_stats: {
        Row: {
          click_to_signup_rate: number | null
          code: string | null
          commission_rate: number | null
          earnings_mtd: number | null
          id: string | null
          pending_payout_euros: number | null
          signup_to_paid_rate: number | null
          status: string | null
          total_clicks: number | null
          total_conversions: number | null
          total_earned_euros: number | null
          total_paid_euros: number | null
          total_referrals: number | null
          user_id: string | null
        }
        Insert: {
          click_to_signup_rate?: never
          code?: string | null
          commission_rate?: number | null
          earnings_mtd?: never
          id?: string | null
          pending_payout_euros?: never
          signup_to_paid_rate?: never
          status?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_earned_euros?: number | null
          total_paid_euros?: number | null
          total_referrals?: number | null
          user_id?: string | null
        }
        Update: {
          click_to_signup_rate?: never
          code?: string | null
          commission_rate?: number | null
          earnings_mtd?: never
          id?: string | null
          pending_payout_euros?: never
          signup_to_paid_rate?: never
          status?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_earned_euros?: number | null
          total_paid_euros?: number | null
          total_referrals?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_ltv: {
        Row: {
          arpu: number | null
          customers: number | null
          estimated_ltv: number | null
          plan: string | null
        }
        Relationships: []
      }
      kanban_board_stats: {
        Row: {
          active_cards: number | null
          board_id: string | null
          critical_count: number | null
          done_count: number | null
          name: string | null
          overdue_count: number | null
          total_cards: number | null
          user_id: string | null
        }
        Relationships: []
      }
      monthly_churn: {
        Row: {
          base_customers: number | null
          churn_rate_percent: number | null
          churned_customers: number | null
        }
        Relationships: []
      }
      support_stats: {
        Row: {
          avg_first_response_minutes: number | null
          avg_satisfaction: number | null
          new_today: number | null
          open_count: number | null
          pending_count: number | null
          resolved_today: number | null
        }
        Relationships: []
      }
      tutorial_stats: {
        Row: {
          avg_chapters_done: number | null
          category: string | null
          completion_rate: number | null
          id: string | null
          slug: string | null
          title: string | null
          total_completed: number | null
          total_started: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_efficiency_score: {
        Args: { p_meeting_id: string }
        Returns: number
      }
      check_meeting_quota: { Args: { p_user_id: string }; Returns: Json }
      check_rls_status: {
        Args: never
        Returns: {
          has_rls: boolean
          tablename: string
        }[]
      }
      create_default_scenarios: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_link?: string
          p_message?: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      generate_affiliate_code: { Args: { p_user_id: string }; Returns: string }
      generate_certificate_id: { Args: never; Returns: string }
      get_kanban_board_stats: { Args: { p_board_id: string }; Returns: Json }
      get_user_workspace_role: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      is_subdomain_available: { Args: { p_slug: string }; Returns: boolean }
      is_workspace_member: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: boolean
      }
      purge_old_logs: { Args: never; Returns: undefined }
      shift_kanban_positions: {
        Args: {
          p_column_id: string
          p_exclude_card_id: string
          p_from_position: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      meeting_status:
        | "pending"
        | "transcribing"
        | "analyzing"
        | "completed"
        | "failed"
        | "partial"
      meeting_type:
        | "commercial"
        | "tech"
        | "retro"
        | "onboarding"
        | "rh"
        | "marketing"
        | "autre"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "pending" | "in_progress" | "done" | "ignored"
      workspace_role: "owner" | "admin" | "member" | "viewer"
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
      meeting_status: [
        "pending",
        "transcribing",
        "analyzing",
        "completed",
        "failed",
        "partial",
      ],
      meeting_type: [
        "commercial",
        "tech",
        "retro",
        "onboarding",
        "rh",
        "marketing",
        "autre",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: ["pending", "in_progress", "done", "ignored"],
      workspace_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
