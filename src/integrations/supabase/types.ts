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
      pro_reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          pro_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          pro_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          pro_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          email: string | null
          email_verified: boolean | null
          id: string
          is_verified: boolean | null
          last_violation_at: string | null
          name: string | null
          phone: string | null
          profile_complete: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          violation_flags: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          id: string
          is_verified?: boolean | null
          last_violation_at?: string | null
          name?: string | null
          phone?: string | null
          profile_complete?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          violation_flags?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string
          is_verified?: boolean | null
          last_violation_at?: string | null
          name?: string | null
          phone?: string | null
          profile_complete?: boolean | null
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
          stripe_refund_id: string | null
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
          stripe_refund_id?: string | null
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
          stripe_refund_id?: string | null
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
          additional_photos_requested: boolean | null
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
          photos_requested_at: string | null
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
          additional_photos_requested?: boolean | null
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
          photos_requested_at?: string | null
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
          additional_photos_requested?: boolean | null
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
          photos_requested_at?: string | null
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
      supplier_documents: {
        Row: {
          document_type: string
          file_name: string
          file_url: string
          id: string
          supplier_id: string
          uploaded_at: string | null
        }
        Insert: {
          document_type: string
          file_name: string
          file_url: string
          id?: string
          supplier_id: string
          uploaded_at?: string | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          supplier_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          commission_amount: number
          commission_rate: number | null
          confirmed_at: string | null
          created_at: string | null
          customer_id: string
          customer_notes: string | null
          delivery_method: string | null
          fulfilled_at: string | null
          id: string
          order_number: string
          paid_at: string | null
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent: string | null
          stripe_transfer_id: string | null
          subtotal: number
          supplier_id: string
          supplier_notes: string | null
          supplier_payout: number
          total_amount: number
          tracking_number: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          commission_amount: number
          commission_rate?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id: string
          customer_notes?: string | null
          delivery_method?: string | null
          fulfilled_at?: string | null
          id?: string
          order_number: string
          paid_at?: string | null
          product_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent?: string | null
          stripe_transfer_id?: string | null
          subtotal: number
          supplier_id: string
          supplier_notes?: string | null
          supplier_payout: number
          total_amount: number
          tracking_number?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          commission_amount?: number
          commission_rate?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string
          customer_notes?: string | null
          delivery_method?: string | null
          fulfilled_at?: string | null
          id?: string
          order_number?: string
          paid_at?: string | null
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent?: string | null
          stripe_transfer_id?: string | null
          subtotal?: number
          supplier_id?: string
          supplier_notes?: string | null
          supplier_payout?: number
          total_amount?: number
          tracking_number?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payouts: {
        Row: {
          amount: number
          commission_deducted: number
          completed_at: string | null
          created_at: string | null
          failed_reason: string | null
          id: string
          initiated_at: string | null
          order_id: string
          status: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          commission_deducted: number
          completed_at?: string | null
          created_at?: string | null
          failed_reason?: string | null
          id?: string
          initiated_at?: string | null
          order_id: string
          status?: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          commission_deducted?: number
          completed_at?: string | null
          created_at?: string | null
          failed_reason?: string | null
          id?: string
          initiated_at?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payouts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          admin_approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          category: string
          condition: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          oem_cross_ref: string | null
          part_name: string
          price: number
          quantity: number
          region: string | null
          sku: string
          supplier_id: string
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          admin_approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          category: string
          condition: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          oem_cross_ref?: string | null
          part_name: string
          price: number
          quantity?: number
          region?: string | null
          sku: string
          supplier_id: string
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          admin_approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          condition?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          oem_cross_ref?: string | null
          part_name?: string
          price?: number
          quantity?: number
          region?: string | null
          sku?: string
          supplier_id?: string
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          acceptance_rate: number | null
          business_address: string
          business_name: string
          cancelled_orders: number | null
          city: string
          contact_name: string
          created_at: string | null
          delivery_radius_km: number | null
          email: string
          fulfilled_orders: number | null
          id: string
          is_platform_seller: boolean
          on_time_rate: number | null
          phone: string
          pickup_available: boolean | null
          product_categories: string[] | null
          state: string
          status: Database["public"]["Enums"]["supplier_status"] | null
          stripe_connect_account_id: string | null
          stripe_onboarding_complete: boolean | null
          total_orders: number | null
          updated_at: string | null
          user_id: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          zip: string
        }
        Insert: {
          acceptance_rate?: number | null
          business_address: string
          business_name: string
          cancelled_orders?: number | null
          city: string
          contact_name: string
          created_at?: string | null
          delivery_radius_km?: number | null
          email: string
          fulfilled_orders?: number | null
          id?: string
          is_platform_seller?: boolean
          on_time_rate?: number | null
          phone: string
          pickup_available?: boolean | null
          product_categories?: string[] | null
          state: string
          status?: Database["public"]["Enums"]["supplier_status"] | null
          stripe_connect_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          total_orders?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          zip: string
        }
        Update: {
          acceptance_rate?: number | null
          business_address?: string
          business_name?: string
          cancelled_orders?: number | null
          city?: string
          contact_name?: string
          created_at?: string | null
          delivery_radius_km?: number | null
          email?: string
          fulfilled_orders?: number | null
          id?: string
          is_platform_seller?: boolean
          on_time_rate?: number | null
          phone?: string
          pickup_available?: boolean | null
          product_categories?: string[] | null
          state?: string
          status?: Database["public"]["Enums"]["supplier_status"] | null
          stripe_connect_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          total_orders?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          zip?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_lead_and_lock_job: { Args: { lead_id: string }; Returns: Json }
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
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      ensure_admin_user: { Args: never; Returns: undefined }
      expire_timed_out_quotes: { Args: never; Returns: number }
      generate_leads_for_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      generate_order_number: { Args: never; Returns: string }
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_accepted_pro_for_request: {
        Args: { request_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      mark_fee_paid: {
        Args: {
          fee_id: string
          notes_input?: string
          payment_method_input?: string
        }
        Returns: Json
      }
      pro_can_quote_request: {
        Args: { _pro_id: string; _request_id: string }
        Returns: boolean
      }
      pro_quoted_customer_request: {
        Args: { _customer_id: string; _pro_id: string }
        Returns: boolean
      }
      pro_serves_category: {
        Args: { _category_id: string; _pro_id: string }
        Returns: boolean
      }
      promote_user_to_admin: { Args: { user_email: string }; Returns: Json }
      release_expired_job_locks: { Args: never; Returns: number }
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
      user_is_quote_pro: {
        Args: { _quote_pro_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_verified_pro: { Args: { _user_id: string }; Returns: boolean }
      user_owns_request: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "pro" | "admin" | "supplier"
      lead_status: "new" | "accepted" | "declined"
      order_status: "pending" | "confirmed" | "fulfilled" | "cancelled" | "paid"
      payout_status: "pending" | "processing" | "completed" | "failed"
      supplier_status: "pending" | "approved" | "rejected" | "suspended"
      user_role: "customer" | "pro" | "admin" | "supplier"
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
      app_role: ["customer", "pro", "admin", "supplier"],
      lead_status: ["new", "accepted", "declined"],
      order_status: ["pending", "confirmed", "fulfilled", "cancelled", "paid"],
      payout_status: ["pending", "processing", "completed", "failed"],
      supplier_status: ["pending", "approved", "rejected", "suspended"],
      user_role: ["customer", "pro", "admin", "supplier"],
    },
  },
} as const
