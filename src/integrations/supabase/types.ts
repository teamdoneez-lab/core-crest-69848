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
      appointments: {
        Row: {
          created_at: string
          final_price: number | null
          id: string
          inspection_date: string | null
          notes: string | null
          pro_id: string
          request_id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          final_price?: number | null
          id?: string
          inspection_date?: string | null
          notes?: string | null
          pro_id: string
          request_id: string
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          final_price?: number | null
          id?: string
          inspection_date?: string | null
          notes?: string | null
          pro_id?: string
          request_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          request_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          request_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          fee_type: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          pro_id: string
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string
          fee_type?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pro_id: string
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          fee_type?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pro_id?: string
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          id: string
          pro_id: string
          request_id: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pro_id: string
          request_id: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pro_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_pro_id"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leads_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pro_profiles: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          created_at: string | null
          description: string | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          operating_hours: Json | null
          phone: string | null
          pro_id: string
          profile_complete: boolean | null
          radius_km: number | null
          service_radius: number | null
          state: string | null
          updated_at: string | null
          verified_address: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string | null
          created_at?: string | null
          description?: string | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          operating_hours?: Json | null
          phone?: string | null
          pro_id: string
          profile_complete?: boolean | null
          radius_km?: number | null
          service_radius?: number | null
          state?: string | null
          updated_at?: string | null
          verified_address?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          created_at?: string | null
          description?: string | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          operating_hours?: Json | null
          phone?: string | null
          pro_id?: string
          profile_complete?: boolean | null
          radius_km?: number | null
          service_radius?: number | null
          state?: string | null
          updated_at?: string | null
          verified_address?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      pro_service_areas: {
        Row: {
          created_at: string | null
          id: string
          pro_id: string
          zip: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pro_id: string
          zip: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pro_id?: string
          zip?: string
        }
        Relationships: []
      }
      pro_service_categories: {
        Row: {
          category_id: string
          pro_id: string
        }
        Insert: {
          category_id: string
          pro_id: string
        }
        Update: {
          category_id?: string
          pro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_service_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          last_violation_at: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          violation_flags: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          last_violation_at?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          violation_flags?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_violation_at?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          violation_flags?: number | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          confirmation_timer_expires_at: string | null
          confirmation_timer_minutes: number | null
          created_at: string
          description: string
          estimated_price: number
          id: string
          is_revised: boolean | null
          notes: string | null
          original_quote_id: string | null
          payment_status: string | null
          pro_id: string
          request_id: string
          revised_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          confirmation_timer_expires_at?: string | null
          confirmation_timer_minutes?: number | null
          created_at?: string
          description: string
          estimated_price: number
          id?: string
          is_revised?: boolean | null
          notes?: string | null
          original_quote_id?: string | null
          payment_status?: string | null
          pro_id: string
          request_id: string
          revised_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          confirmation_timer_expires_at?: string | null
          confirmation_timer_minutes?: number | null
          created_at?: string
          description?: string
          estimated_price?: number
          id?: string
          is_revised?: boolean | null
          notes?: string | null
          original_quote_id?: string | null
          payment_status?: string | null
          pro_id?: string
          request_id?: string
          revised_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_original_quote_id_fkey"
            columns: ["original_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_fees: {
        Row: {
          amount: number
          cancellation_reason: string | null
          created_at: string
          id: string
          paid_at: string | null
          pro_id: string
          quote_id: string | null
          refundable: boolean
          request_id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          cancellation_reason?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          pro_id: string
          quote_id?: string | null
          refundable?: boolean
          request_id: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          cancellation_reason?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          pro_id?: string
          quote_id?: string | null
          refundable?: boolean
          request_id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_fees_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_fees_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_fees_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          active: boolean
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          accept_expires_at: string | null
          accepted_pro_id: string | null
          address: string
          appointment_pref: string
          appointment_type: string | null
          category_id: string | null
          contact_email: string
          contact_phone: string
          created_at: string | null
          customer_id: string
          description: string | null
          formatted_address: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          mileage: number | null
          model: string
          notes: string | null
          preferred_time: string | null
          service_category: string[] | null
          status: string
          trim: string | null
          updated_at: string | null
          urgency: string | null
          vehicle_make: string
          year: number
          zip: string
        }
        Insert: {
          accept_expires_at?: string | null
          accepted_pro_id?: string | null
          address: string
          appointment_pref: string
          appointment_type?: string | null
          category_id?: string | null
          contact_email: string
          contact_phone: string
          created_at?: string | null
          customer_id: string
          description?: string | null
          formatted_address?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          mileage?: number | null
          model: string
          notes?: string | null
          preferred_time?: string | null
          service_category?: string[] | null
          status?: string
          trim?: string | null
          updated_at?: string | null
          urgency?: string | null
          vehicle_make: string
          year: number
          zip: string
        }
        Update: {
          accept_expires_at?: string | null
          accepted_pro_id?: string | null
          address?: string
          appointment_pref?: string
          appointment_type?: string | null
          category_id?: string | null
          contact_email?: string
          contact_phone?: string
          created_at?: string | null
          customer_id?: string
          description?: string | null
          formatted_address?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          mileage?: number | null
          model?: string
          notes?: string | null
          preferred_time?: string | null
          service_category?: string[] | null
          status?: string
          trim?: string | null
          updated_at?: string | null
          urgency?: string | null
          vehicle_make?: string
          year?: number
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_accepted_pro_id_fkey"
            columns: ["accepted_pro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_lead_and_lock_job: {
        Args: { lead_id: string }
        Returns: Json
      }
      accept_quote_with_timer: {
        Args: { quote_id_input: string }
        Returns: Json
      }
      cancel_appointment_with_validation: {
        Args: {
          appointment_id_input: string
          cancellation_reason_input: string
        }
        Returns: Json
      }
      create_admin_user: {
        Args: { admin_email: string; admin_password?: string }
        Returns: Json
      }
      ensure_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_timed_out_quotes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_leads_for_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      get_confirmation_timer_minutes: {
        Args: { urgency_value: string }
        Returns: number
      }
      get_service_request_details: {
        Args: { request_id: string }
        Returns: {
          accept_expires_at: string
          accepted_pro_id: string
          address: string
          appointment_pref: string
          appointment_type: string
          category_id: string
          contact_email: string
          contact_phone: string
          created_at: string
          customer_id: string
          description: string
          formatted_address: string
          id: string
          latitude: number
          longitude: number
          mileage: number
          model: string
          notes: string
          preferred_time: string
          service_category: string[]
          status: string
          trim: string
          updated_at: string
          urgency: string
          vehicle_make: string
          year: number
          zip: string
        }[]
      }
      is_accepted_pro_for_request: {
        Args: { request_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_fee_paid: {
        Args: {
          fee_id: string
          notes_input?: string
          payment_method_input?: string
        }
        Returns: Json
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: Json
      }
      release_expired_job_locks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      schedule_appointment: {
        Args: {
          appointment_notes?: string
          appointment_time: string
          request_id: string
        }
        Returns: Json
      }
      update_request_status: {
        Args: { new_status: string; request_id: string }
        Returns: Json
      }
    }
    Enums: {
      lead_status: "new" | "accepted" | "declined"
      user_role: "customer" | "pro" | "admin"
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
      lead_status: ["new", "accepted", "declined"],
      user_role: ["customer", "pro", "admin"],
    },
  },
} as const
