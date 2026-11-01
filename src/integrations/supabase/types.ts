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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_controls: {
        Row: {
          changed_by: string | null
          reason: string | null
          suspended: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          reason?: string | null
          suspended?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          changed_by?: string | null
          reason?: string | null
          suspended?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          reference: string | null
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          reference?: string | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          reference?: string | null
          target?: string | null
        }
        Relationships: []
      }
      announcement_dismissals: {
        Row: {
          announcement_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          important: boolean
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          important?: boolean
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          important?: boolean
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_owners: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_owners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
          version: number
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
          version?: number
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
          version?: number
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          note: string | null
          reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          note?: string | null
          reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["ledger_kind"]
          note?: string | null
          reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          active: boolean
          created_at: string
          credits: number
          highlighted: boolean
          id: string
          name: string
          price_inr: number
          sort: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits: number
          highlighted?: boolean
          id: string
          name: string
          price_inr: number
          sort?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          credits?: number
          highlighted?: boolean
          id?: string
          name?: string
          price_inr?: number
          sort?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          balance: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_campaign_recipients: {
        Row: {
          attempts: number
          campaign_id: string
          created_at: string
          error_code: string | null
          id: string
          lease_expires_at: string | null
          next_attempt_at: string
          provider_message_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          attempts?: number
          campaign_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          lease_expires_at?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attempts?: number
          campaign_id?: string
          created_at?: string
          error_code?: string | null
          id?: string
          lease_expires_at?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string
          id: string
          plain_text: string
          scheduled_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by: string
          id?: string
          plain_text: string
          scheduled_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          plain_text?: string
          scheduled_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          created_at: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_inr: number
          created_at: string
          credits: number
          id: string
          package_id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          created_at?: string
          credits: number
          id?: string
          package_id: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          created_at?: string
          credits?: number
          id?: string
          package_id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferred_script: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          preferred_script?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_script?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          caption_style: Json | null
          created_at: string
          duration_seconds: number | null
          id: string
          language: string
          media_metadata: Json | null
          source_cleanup_claimed_at: string | null
          source_deleted_at: string | null
          storage_path: string | null
          style_preset: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption_style?: Json | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          language?: string
          media_metadata?: Json | null
          source_cleanup_claimed_at?: string | null
          source_deleted_at?: string | null
          storage_path?: string | null
          style_preset?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption_style?: Json | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          language?: string
          media_metadata?: Json | null
          source_cleanup_claimed_at?: string | null
          source_deleted_at?: string | null
          storage_path?: string | null
          style_preset?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rendering_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_reserved: number
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string
          lease_expires_at: string | null
          output_deleted_at: string | null
          output_expires_at: string | null
          output_storage_path: string | null
          progress_percentage: number | null
          project_id: string
          provider: string
          provider_job_id: string | null
          render_configuration: Json
          requested_resolution: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_reserved?: number
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key: string
          lease_expires_at?: string | null
          output_deleted_at?: string | null
          output_expires_at?: string | null
          output_storage_path?: string | null
          progress_percentage?: number | null
          project_id: string
          provider: string
          provider_job_id?: string | null
          render_configuration: Json
          requested_resolution: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_reserved?: number
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string
          lease_expires_at?: string | null
          output_deleted_at?: string | null
          output_expires_at?: string | null
          output_storage_path?: string | null
          progress_percentage?: number | null
          project_id?: string
          provider?: string
          provider_job_id?: string | null
          render_configuration?: Json
          requested_resolution?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendering_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transcription_jobs: {
        Row: {
          created_at: string
          credits_reserved: number
          error: string | null
          id: string
          project_id: string
          provider: string
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_reserved?: number
          error?: string | null
          id?: string
          project_id: string
          provider?: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_reserved?: number
          error?: string | null
          id?: string
          project_id?: string
          provider?: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcription_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          created_at: string
          language: string
          project_id: string
          romanized_segments: Json | null
          segments: Json
          timing_source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          language?: string
          project_id: string
          romanized_segments?: Json | null
          segments?: Json
          timing_source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          language?: string
          project_id?: string
          romanized_segments?: Json | null
          segments?: Json
          timing_source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_marketing_preferences: {
        Row: {
          consent: boolean
          consent_source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consent?: boolean
          consent_source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consent?: boolean
          consent_source?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_is_active: { Args: { _user_id: string }; Returns: boolean }
      apply_credit: {
        Args: {
          _amount: number
          _kind: Database["public"]["Enums"]["ledger_kind"]
          _note?: string
          _reference: string
          _user_id: string
        }
        Returns: number
      }
      claim_campaign_recipients: {
        Args: { _campaign_id: string }
        Returns: {
          attempts: number
          campaign_id: string
          created_at: string
          error_code: string | null
          id: string
          lease_expires_at: string | null
          next_attempt_at: string
          provider_message_id: string | null
          status: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "email_campaign_recipients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_expired_sources: {
        Args: never
        Returns: {
          project_id: string
          storage_path: string
          user_id: string
        }[]
      }
      consume_unsubscribe_token: { Args: { _hash: string }; Returns: boolean }
      finish_render_job: {
        Args: {
          _error_code: string
          _job_id: string
          _output_path: string
          _success: boolean
        }
        Returns: boolean
      }
      fulfill_verified_payment: {
        Args: { _order_id: string; _payment_id: string }
        Returns: {
          amount_inr: number
          created_at: string
          credits: number
          id: string
          package_id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_app_owner: { Args: { _user_id: string }; Returns: boolean }
      owner_adjust_credit: {
        Args: {
          _actor: string
          _amount: number
          _reason: string
          _reference: string
          _user_id: string
        }
        Returns: number
      }
      owner_refund_transcription: {
        Args: { _actor: string; _job_id: string }
        Returns: boolean
      }
      owner_save_announcement: {
        Args: { _actor: string; _id: string; _value: Json }
        Returns: boolean
      }
      owner_save_campaign: {
        Args: {
          _actor: string
          _audience: string
          _body: string
          _subject: string
        }
        Returns: string
      }
      owner_save_settings: {
        Args: {
          _actor: string
          _reason: string
          _value: Json
          _version: number
        }
        Returns: boolean
      }
      owner_set_account_status: {
        Args: {
          _actor: string
          _reason: string
          _suspended: boolean
          _user_id: string
        }
        Returns: boolean
      }
      owner_update_package: {
        Args: { _actor: string; _id: string; _reason: string; _value: Json }
        Returns: boolean
      }
      queue_campaign: {
        Args: { _actor: string; _campaign_id: string }
        Returns: number
      }
      reserve_render_job: {
        Args: {
          _configuration: Json
          _credits: number
          _idempotency: string
          _project_id: string
          _provider: string
          _resolution: string
          _user_id: string
        }
        Returns: string
      }
      set_marketing_consent: {
        Args: { _consent: boolean; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      job_status: "queued" | "processing" | "completed" | "failed" | "refunded"
      ledger_kind:
        | "signup_bonus"
        | "purchase"
        | "reserve"
        | "refund"
        | "admin_adjust"
      payment_status: "created" | "paid" | "failed"
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
      app_role: ["admin", "user"],
      job_status: ["queued", "processing", "completed", "failed", "refunded"],
      ledger_kind: [
        "signup_bonus",
        "purchase",
        "reserve",
        "refund",
        "admin_adjust",
      ],
      payment_status: ["created", "paid", "failed"],
    },
  },
} as const
