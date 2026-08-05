// Auto-generated from Supabase schema. Regenerate via MCP or:
// supabase gen types typescript --project-id vwoizjesyyygmokfqpyy --schema public > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          agent_id: Database["public"]["Enums"]["agent_id"]
          event: string
          id: string
          payload: Json | null
          ref_id: string | null
          ts: string
        }
        Insert: {
          agent_id: Database["public"]["Enums"]["agent_id"]
          event: string
          id?: string
          payload?: Json | null
          ref_id?: string | null
          ts?: string
        }
        Update: {
          agent_id?: Database["public"]["Enums"]["agent_id"]
          event?: string
          id?: string
          payload?: Json | null
          ref_id?: string | null
          ts?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          briefing_json: Json | null
          created_at: string
          daily_room_url: string | null
          id: string
          include_pre_call_brief: boolean
          duration_minutes: number
          intake_background: string | null
          match_reason: string | null
          mentee_id: string
          mentee_token: string | null
          mentor_id: string
          mentor_token: string | null
          scheduled_at: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id: string
        }
        Insert: {
          briefing_json?: Json | null
          created_at?: string
          daily_room_url?: string | null
          id?: string
          include_pre_call_brief?: boolean
          duration_minutes?: number
          intake_background?: string | null
          match_reason?: string | null
          mentee_id: string
          mentee_token?: string | null
          mentor_id: string
          mentor_token?: string | null
          scheduled_at: string
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id: string
        }
        Update: {
          briefing_json?: Json | null
          created_at?: string
          daily_room_url?: string | null
          id?: string
          include_pre_call_brief?: boolean
          duration_minutes?: number
          intake_background?: string | null
          match_reason?: string | null
          mentee_id?: string
          mentee_token?: string | null
          mentor_id?: string
          mentor_token?: string | null
          scheduled_at?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      early_access_rate_limits: {
        Row: {
          bucket_key: string
          hit_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          bucket_key: string
          hit_count?: number
          updated_at?: string
          window_start: string
        }
        Update: {
          bucket_key?: string
          hit_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      early_access_signups: {
        Row: {
          created_at: string
          email: string
          est_time: string
          id: string
          referrer: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          est_time: string
          id?: string
          referrer?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          est_time?: string
          id?: string
          referrer?: string | null
          source?: string
        }
        Relationships: []
      }
      landing_goal_submissions: {
        Row: {
          created_at: string
          est_time: string
          expert_name: string | null
          expert_slug: string | null
          goal_text: string
          id: string
          ip_hash: string | null
          reply_source: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          est_time: string
          expert_name?: string | null
          expert_slug?: string | null
          goal_text: string
          id?: string
          ip_hash?: string | null
          reply_source?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          est_time?: string
          expert_name?: string | null
          expert_slug?: string | null
          goal_text?: string
          id?: string
          ip_hash?: string | null
          reply_source?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_goal_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reviews: {
        Row: {
          bio_analysis_reasoning: string | null
          bio_risk_rating: Database["public"]["Enums"]["bio_risk_rating"]
          created_at: string
          id: string
          is_civil_servant: boolean
          mentor_id: string
          nf1860_extracted_data: Json | null
          reviewed_by_lead_at: string | null
        }
        Insert: {
          bio_analysis_reasoning?: string | null
          bio_risk_rating: Database["public"]["Enums"]["bio_risk_rating"]
          created_at?: string
          id?: string
          is_civil_servant: boolean
          mentor_id: string
          nf1860_extracted_data?: Json | null
          reviewed_by_lead_at?: string | null
        }
        Update: {
          bio_analysis_reasoning?: string | null
          bio_risk_rating?: Database["public"]["Enums"]["bio_risk_rating"]
          created_at?: string
          id?: string
          is_civil_servant?: boolean
          mentor_id?: string
          nf1860_extracted_data?: Json | null
          reviewed_by_lead_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_reviews: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attribution_type: string
          auto_published: boolean
          booking_id: string | null
          consent_notes: string | null
          consent_to_publish: boolean
          created_at: string
          display_name: string
          expert_id: string
          id: string
          locale: string | null
          moderated_at: string | null
          moderation_flags: string[]
          moderation_json: Json | null
          moderation_reason: string | null
          moderation_verdict: string
          quote: string
          rating: number
          reviewer_user_id: string | null
          source: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attribution_type: string
          auto_published?: boolean
          booking_id?: string | null
          consent_notes?: string | null
          consent_to_publish?: boolean
          created_at?: string
          display_name: string
          expert_id: string
          id?: string
          locale?: string | null
          moderated_at?: string | null
          moderation_flags?: string[]
          moderation_json?: Json | null
          moderation_reason?: string | null
          moderation_verdict?: string
          quote: string
          rating: number
          reviewer_user_id?: string | null
          source?: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attribution_type?: string
          auto_published?: boolean
          booking_id?: string | null
          consent_notes?: string | null
          consent_to_publish?: boolean
          created_at?: string
          display_name?: string
          expert_id?: string
          id?: string
          locale?: string | null
          moderated_at?: string | null
          moderation_flags?: string[]
          moderation_json?: Json | null
          moderation_reason?: string | null
          moderation_verdict?: string
          quote?: string
          rating?: number
          reviewer_user_id?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_reviews_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          booking_id: string
          channel: string
          created_at: string
          error_message: string | null
          id: string
          recipient_role: string
          resend_message_id: string | null
          status: string
        }
        Insert: {
          booking_id: string
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_role: string
          resend_message_id?: string | null
          status: string
        }
        Update: {
          booking_id?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_role?: string
          resend_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_integrations: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          provider?: Database["public"]["Enums"]["integration_provider"]
          refresh_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_integrations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          activated_at: string | null
          activation_status: Database["public"]["Enums"]["mentor_activation_status"]
          bio: string
          compliance_status: Database["public"]["Enums"]["compliance_status"]
          created_at: string
          email: string
          employer: string
          expertise: string[]
          full_name: string
          id: string
          image_url: string | null
          intro_video_url: string | null
          is_civil_servant: boolean
          is_listed: boolean
          live_session_price_cents: number
          payout_handle: string | null
          payout_method: Database["public"]["Enums"]["mentor_payout_method"]
          pending_email: string | null
          slug: string | null
          stripe_connect_account_id: string | null
          stripe_onboarding_completed: boolean
          title: string | null
          user_id: string | null
          video_request_price_cents: number
          video_request_sla_days: number
          video_requests_enabled: boolean
        }
        Insert: {
          activated_at?: string | null
          activation_status?: Database["public"]["Enums"]["mentor_activation_status"]
          bio?: string
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          created_at?: string
          email: string
          employer?: string
          expertise?: string[]
          full_name: string
          id?: string
          image_url?: string | null
          intro_video_url?: string | null
          is_civil_servant?: boolean
          is_listed?: boolean
          live_session_price_cents?: number
          payout_handle?: string | null
          payout_method?: Database["public"]["Enums"]["mentor_payout_method"]
          pending_email?: string | null
          slug?: string | null
          stripe_connect_account_id?: string | null
          stripe_onboarding_completed?: boolean
          title?: string | null
          user_id?: string | null
          video_request_price_cents?: number
          video_request_sla_days?: number
          video_requests_enabled?: boolean
        }
        Update: {
          activated_at?: string | null
          activation_status?: Database["public"]["Enums"]["mentor_activation_status"]
          bio?: string
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          created_at?: string
          email?: string
          employer?: string
          expertise?: string[]
          full_name?: string
          id?: string
          image_url?: string | null
          intro_video_url?: string | null
          is_civil_servant?: boolean
          is_listed?: boolean
          live_session_price_cents?: number
          payout_handle?: string | null
          payout_method?: Database["public"]["Enums"]["mentor_payout_method"]
          pending_email?: string | null
          slug?: string | null
          stripe_connect_account_id?: string | null
          stripe_onboarding_completed?: boolean
          title?: string | null
          user_id?: string | null
          video_request_price_cents?: number
          video_request_sla_days?: number
          video_requests_enabled?: boolean
        }
        Relationships: []
      }
      video_requests: {
        Row: {
          buyer_email: string
          buyer_user_id: string | null
          created_at: string
          decline_reason: string | null
          declined_at: string | null
          delivered_at: string | null
          due_at: string | null
          from_name: string
          id: string
          instructions: string
          marketing_referrer: string | null
          mentor_id: string
          occasion: string
          paid_at: string | null
          price_cents: number
          pronunciation_notes: string | null
          recipient_name: string | null
          status: Database["public"]["Enums"]["video_request_status"]
          stripe_customer_id: string | null
          stripe_payment_intent_id: string
          updated_at: string
          video_duration_seconds: number | null
          video_storage_path: string | null
        }
        Insert: {
          buyer_email: string
          buyer_user_id?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          delivered_at?: string | null
          due_at?: string | null
          from_name?: string
          id?: string
          instructions?: string
          marketing_referrer?: string | null
          mentor_id: string
          occasion?: string
          paid_at?: string | null
          price_cents: number
          pronunciation_notes?: string | null
          recipient_name?: string | null
          status?: Database["public"]["Enums"]["video_request_status"]
          stripe_customer_id?: string | null
          stripe_payment_intent_id: string
          updated_at?: string
          video_duration_seconds?: number | null
          video_storage_path?: string | null
        }
        Update: {
          buyer_email?: string
          buyer_user_id?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          delivered_at?: string | null
          due_at?: string | null
          from_name?: string
          id?: string
          instructions?: string
          marketing_referrer?: string | null
          mentor_id?: string
          occasion?: string
          paid_at?: string | null
          price_cents?: number
          pronunciation_notes?: string | null
          recipient_name?: string | null
          status?: Database["public"]["Enums"]["video_request_status"]
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string
          updated_at?: string
          video_duration_seconds?: number | null
          video_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_requests_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_claim_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          mentor_id: string
          revoked_at: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          mentor_id: string
          revoked_at?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          mentor_id?: string
          revoked_at?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: []
      }
      mentor_manual_payouts: {
        Row: {
          created_at: string
          created_by_admin_id: string
          id: string
          mentor_id: string
          paid_at: string
          reference_note: string | null
          total_cents: number
        }
        Insert: {
          created_at?: string
          created_by_admin_id: string
          id?: string
          mentor_id: string
          paid_at?: string
          reference_note?: string | null
          total_cents: number
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string
          id?: string
          mentor_id?: string
          paid_at?: string
          reference_note?: string | null
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentor_manual_payouts_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_manual_payouts_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_payout_lines: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          payout_id: string
          transaction_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          payout_id: string
          transaction_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          payout_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_payout_lines_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "mentor_manual_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_payout_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          booking_id: string
          completed_at: string
          duration_seconds: number
          id: string
          summary_json: Json | null
          transcript_available: boolean
        }
        Insert: {
          booking_id: string
          completed_at?: string
          duration_seconds?: number
          id?: string
          summary_json?: Json | null
          transcript_available?: boolean
        }
        Update: {
          booking_id?: string
          completed_at?: string
          duration_seconds?: number
          id?: string
          summary_json?: Json | null
          transcript_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      session_translations: {
        Row: {
          booking_id: string
          id: string
          summary_json: Json | null
          target_locale: string
          translated_at: string
        }
        Insert: {
          booking_id: string
          id?: string
          summary_json?: Json | null
          target_locale: string
          translated_at?: string
        }
        Update: {
          booking_id?: string
          id?: string
          summary_json?: Json | null
          target_locale?: string
          translated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_translations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      session_comp_grants: {
        Row: {
          id: string
          user_id: string
          credit_minutes: number
          eligible_scope: string
          eligible_mentor_ids: string[] | null
          status: string
          expires_at: string | null
          internal_note: string | null
          created_at: string
          created_by: string | null
          redeemed_at: string | null
          redeemed_booking_id: string | null
          source_booking_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          credit_minutes?: number
          eligible_scope?: string
          eligible_mentor_ids?: string[] | null
          status?: string
          expires_at?: string | null
          internal_note?: string | null
          created_at?: string
          created_by?: string | null
          redeemed_at?: string | null
          redeemed_booking_id?: string | null
          source_booking_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          credit_minutes?: number
          eligible_scope?: string
          eligible_mentor_ids?: string[] | null
          status?: string
          expires_at?: string | null
          internal_note?: string | null
          created_at?: string
          created_by?: string | null
          redeemed_at?: string | null
          redeemed_booking_id?: string | null
          source_booking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_comp_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_transcripts: {
        Row: {
          booking_id: string
          created_at: string
          daily_transcript_id: string | null
          id: string
          source_locale: string
          utterances_json: Json | null
          vtt_text: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          daily_transcript_id?: string | null
          id?: string
          source_locale?: string
          utterances_json?: Json | null
          vtt_text?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          daily_transcript_id?: string | null
          id?: string
          source_locale?: string
          utterances_json?: Json | null
          vtt_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_transcripts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          booking_id: string
          created_at: string
          gross_amount_cents: number
          id: string
          mentor_payout_cents: number
          mentor_stripe_account: string
          platform_fee_cents: number
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_event_id: string
          stripe_payment_intent_id: string
          stripe_refund_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          gross_amount_cents: number
          id?: string
          mentor_payout_cents: number
          mentor_stripe_account: string
          platform_fee_cents: number
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_event_id: string
          stripe_payment_intent_id: string
          stripe_refund_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          gross_amount_cents?: number
          id?: string
          mentor_payout_cents?: number
          mentor_stripe_account?: string
          platform_fee_cents?: number
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_event_id?: string
          stripe_payment_intent_id?: string
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_app_state: {
        Row: {
          onboarded: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          onboarded?: boolean
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          onboarded?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_app_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          bio: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          preferred_locale: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          bio?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          preferred_locale?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          bio?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferred_locale?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      early_access_consume_rate_limit: {
        Args: {
          p_bucket_key: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: Json
      }
    }
    Enums: {
      agent_id:
        | "APX-01"
        | "APX-02"
        | "APX-03"
        | "APX-04"
        | "APX-05"
        | "APX-06"
        | "APX-08"
        | "APX-09"
      bio_risk_rating: "low" | "medium" | "high"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "completed"
        | "pending_review"
        | "payment_failed"
        | "cancelled"
        | "refunded"
      compliance_status:
        | "pending_review"
        | "document_required"
        | "stripe_incomplete"
        | "awaiting_human_approval"
        | "approved"
        | "rejected"
      integration_provider: "google_calendar"
      mentor_activation_status: "pending" | "active"
      video_request_status:
        | "pending_payment"
        | "paid_awaiting_expert"
        | "delivered"
        | "declined"
        | "expired"
        | "refunded"
      mentor_payout_method:
        | "paypal"
        | "zelle"
        | "cashapp"
        | "bank_manual"
        | "unset"
      service_type: "session_1on1" | "pre_call_brief" | "extended_session"
      transaction_status: "pending" | "completed" | "failed" | "refunded"
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

export const Constants = {
  public: {
    Enums: {
      agent_id: [
        "APX-01",
        "APX-02",
        "APX-03",
        "APX-04",
        "APX-05",
        "APX-06",
        "APX-08",
        "APX-09",
      ],
      bio_risk_rating: ["low", "medium", "high"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "completed",
        "pending_review",
        "payment_failed",
      ],
      compliance_status: [
        "pending_review",
        "document_required",
        "stripe_incomplete",
        "awaiting_human_approval",
        "approved",
        "rejected",
      ],
      integration_provider: ["google_calendar"],
      mentor_activation_status: ["pending", "active"],
      video_request_status: [
        "pending_payment",
        "paid_awaiting_expert",
        "delivered",
        "declined",
        "expired",
        "refunded",
      ],
      mentor_payout_method: ["paypal", "zelle", "cashapp", "bank_manual", "unset"],
      service_type: ["session_1on1", "pre_call_brief", "extended_session"],
      transaction_status: ["pending", "completed", "failed", "refunded"],
    },
  },
} as const
