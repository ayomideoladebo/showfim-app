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
      ad_free_codes: {
        Row: {
          assigned_email: string | null
          code: string
          created_at: string | null
          redeemed_at: string | null
          status: string | null
          valid_until: string | null
        }
        Insert: {
          assigned_email?: string | null
          code: string
          created_at?: string | null
          redeemed_at?: string | null
          status?: string | null
          valid_until?: string | null
        }
        Update: {
          assigned_email?: string | null
          code?: string
          created_at?: string | null
          redeemed_at?: string | null
          status?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      ad_payment_settings: {
        Row: {
          bank: Json | null
          id: number
          updated_at: string | null
          wallets: Json | null
        }
        Insert: {
          bank?: Json | null
          id?: number
          updated_at?: string | null
          wallets?: Json | null
        }
        Update: {
          bank?: Json | null
          id?: number
          updated_at?: string | null
          wallets?: Json | null
        }
        Relationships: []
      }
      ad_payments: {
        Row: {
          created_at: string | null
          email: string
          id: string
          method: string
          proof_url: string | null
          status: string | null
          sub_method: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          method: string
          proof_url?: string | null
          status?: string | null
          sub_method?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          method?: string
          proof_url?: string | null
          status?: string | null
          sub_method?: string | null
        }
        Relationships: []
      }
      ad_script_slots: {
        Row: {
          enabled: boolean
          id: number
          position: Database["public"]["Enums"]["ad_script_position"]
          script: string
        }
        Insert: {
          enabled?: boolean
          id?: number
          position: Database["public"]["Enums"]["ad_script_position"]
          script?: string
        }
        Update: {
          enabled?: boolean
          id?: number
          position?: Database["public"]["Enums"]["ad_script_position"]
          script?: string
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      ads_banners: {
        Row: {
          click_url: string
          created_at: string
          enabled: boolean
          id: string
          image_url: string
          placement: Database["public"]["Enums"]["ad_placement"]
          schedule_end: string | null
          schedule_start: string | null
          updated_at: string
        }
        Insert: {
          click_url: string
          created_at?: string
          enabled?: boolean
          id: string
          image_url: string
          placement?: Database["public"]["Enums"]["ad_placement"]
          schedule_end?: string | null
          schedule_start?: string | null
          updated_at?: string
        }
        Update: {
          click_url?: string
          created_at?: string
          enabled?: boolean
          id?: string
          image_url?: string
          placement?: Database["public"]["Enums"]["ad_placement"]
          schedule_end?: string | null
          schedule_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_events: {
        Row: {
          affiliate_id: string
          created_at: string | null
          event_type: string
          id: number
          path: string | null
          user_agent: string | null
          visitor_ip_hash: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string | null
          event_type: string
          id?: number
          path?: string | null
          user_agent?: string | null
          visitor_ip_hash?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string | null
          event_type?: string
          id?: number
          path?: string | null
          user_agent?: string | null
          visitor_ip_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_events_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_tiers: {
        Row: {
          commission_rate: number
          created_at: string | null
          id: number
          min_monthly_views: number
          name: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string | null
          id?: number
          min_monthly_views?: number
          name: string
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          id?: number
          min_monthly_views?: number
          name?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          access_key: string
          ad_zone_ids: Json | null
          contact_info: string | null
          created_at: string | null
          current_tier_id: number | null
          id: string
          name: string
          status: string
          total_earnings: number | null
          unique_code: string
        }
        Insert: {
          access_key: string
          ad_zone_ids?: Json | null
          contact_info?: string | null
          created_at?: string | null
          current_tier_id?: number | null
          id?: string
          name: string
          status?: string
          total_earnings?: number | null
          unique_code: string
        }
        Update: {
          access_key?: string
          ad_zone_ids?: Json | null
          contact_info?: string | null
          created_at?: string | null
          current_tier_id?: number | null
          id?: string
          name?: string
          status?: string
          total_earnings?: number | null
          unique_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "affiliate_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      alt_download_links: {
        Row: {
          alt_url: string
          created_at: string
          enabled: boolean
          id: number
          movie_id: number
          title: string
          updated_at: string
        }
        Insert: {
          alt_url: string
          created_at?: string
          enabled?: boolean
          id?: number
          movie_id: number
          title: string
          updated_at?: string
        }
        Update: {
          alt_url?: string
          created_at?: string
          enabled?: boolean
          id?: number
          movie_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          media_type: string | null
          movie_id: string | null
          movie_title: string | null
          page_path: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          media_type?: string | null
          movie_id?: string | null
          movie_title?: string | null
          page_path?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          media_type?: string | null
          movie_id?: string | null
          movie_title?: string | null
          page_path?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cta_popup: {
        Row: {
          button_link: string | null
          button_text: string | null
          enabled: boolean
          id: number
          message: string
          schedule_end: string | null
          schedule_start: string | null
          show_install_button: boolean
          title: string
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          enabled?: boolean
          id?: number
          message: string
          schedule_end?: string | null
          schedule_start?: string | null
          show_install_button?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          enabled?: boolean
          id?: number
          message?: string
          schedule_end?: string | null
          schedule_start?: string | null
          show_install_button?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_episodes: {
        Row: {
          created_at: string
          download_url: string | null
          episode_number: number
          id: string
          overview: string | null
          season_number: number
          series_id: number
          still_url: string | null
          stream_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          episode_number: number
          id?: string
          overview?: string | null
          season_number: number
          series_id: number
          still_url?: string | null
          stream_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          episode_number?: number
          id?: string
          overview?: string | null
          season_number?: number
          series_id?: number
          still_url?: string | null
          stream_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "custom_movies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_movies: {
        Row: {
          content_type: string | null
          created_at: string
          download_link: string | null
          episode_count: number | null
          id: number
          overview: string | null
          poster_url: string | null
          release_date: string | null
          season_count: number | null
          title: string
          updated_at: string
          watch_link: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          download_link?: string | null
          episode_count?: number | null
          id?: never
          overview?: string | null
          poster_url?: string | null
          release_date?: string | null
          season_count?: number | null
          title: string
          updated_at?: string
          watch_link?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          download_link?: string | null
          episode_count?: number | null
          id?: never
          overview?: string | null
          poster_url?: string | null
          release_date?: string | null
          season_count?: number | null
          title?: string
          updated_at?: string
          watch_link?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          content_id: number
          content_type: Database["public"]["Enums"]["content_type_enum"]
          created_at: string
          id: number
          poster_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          content_id: number
          content_type: Database["public"]["Enums"]["content_type_enum"]
          created_at?: string
          id?: number
          poster_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          content_id?: number
          content_type?: Database["public"]["Enums"]["content_type_enum"]
          created_at?: string
          id?: number
          poster_path?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      hero_slider_settings: {
        Row: {
          autoplay_trailer: boolean
          id: number
          slide_interval_ms: number
          updated_at: string
        }
        Insert: {
          autoplay_trailer?: boolean
          id?: number
          slide_interval_ms?: number
          updated_at?: string
        }
        Update: {
          autoplay_trailer?: boolean
          id?: number
          slide_interval_ms?: number
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections_order: {
        Row: {
          position: number
          section: Database["public"]["Enums"]["homepage_section_enum"]
        }
        Insert: {
          position: number
          section: Database["public"]["Enums"]["homepage_section_enum"]
        }
        Update: {
          position?: number
          section?: Database["public"]["Enums"]["homepage_section_enum"]
        }
        Relationships: []
      }
      homepage_sections_settings: {
        Row: {
          id: number
          show_ai_recommendations: boolean
          show_because_you_watched: boolean
          show_trailers_section: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          show_ai_recommendations?: boolean
          show_because_you_watched?: boolean
          show_trailers_section?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          show_ai_recommendations?: boolean
          show_because_you_watched?: boolean
          show_trailers_section?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      homepage_trailers: {
        Row: {
          created_at: string
          id: number
          media_type: Database["public"]["Enums"]["media_type_enum"]
          title: string | null
          video_key: string
        }
        Insert: {
          created_at?: string
          id: number
          media_type: Database["public"]["Enums"]["media_type_enum"]
          title?: string | null
          video_key: string
        }
        Update: {
          created_at?: string
          id?: number
          media_type?: Database["public"]["Enums"]["media_type_enum"]
          title?: string | null
          video_key?: string
        }
        Relationships: []
      }
      live_tv_channel_categories: {
        Row: {
          category: string
          channel_id: string
        }
        Insert: {
          category: string
          channel_id: string
        }
        Update: {
          category?: string
          channel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_tv_channel_categories_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "live_tv_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      live_tv_channels: {
        Row: {
          description: string
          enabled: boolean
          id: string
          image_url: string
          pinned: boolean
          title: string
          watch_link: string
          watch_type: Database["public"]["Enums"]["watch_type_enum"]
        }
        Insert: {
          description?: string
          enabled?: boolean
          id: string
          image_url?: string
          pinned?: boolean
          title: string
          watch_link: string
          watch_type?: Database["public"]["Enums"]["watch_type_enum"]
        }
        Update: {
          description?: string
          enabled?: boolean
          id?: string
          image_url?: string
          pinned?: boolean
          title?: string
          watch_link?: string
          watch_type?: Database["public"]["Enums"]["watch_type_enum"]
        }
        Relationships: []
      }
      mood_overlay_settings: {
        Row: {
          enabled: boolean
          id: number
          intensity: number
          kind: Database["public"]["Enums"]["mood_kind_enum"]
          schedule_end: string | null
          schedule_start: string | null
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: number
          intensity?: number
          kind?: Database["public"]["Enums"]["mood_kind_enum"]
          schedule_end?: string | null
          schedule_start?: string | null
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: number
          intensity?: number
          kind?: Database["public"]["Enums"]["mood_kind_enum"]
          schedule_end?: string | null
          schedule_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          ai_model: string | null
          ai_prompt: string | null
          clicks_count: number | null
          created_at: string | null
          id: string
          media_id: number
          media_title: string
          media_type: string
          notification_message: string
          notification_title: string
          recipients_count: number | null
          status: string | null
          webpushr_id: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_prompt?: string | null
          clicks_count?: number | null
          created_at?: string | null
          id?: string
          media_id: number
          media_title: string
          media_type: string
          notification_message: string
          notification_title: string
          recipients_count?: number | null
          status?: string | null
          webpushr_id?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_prompt?: string | null
          clicks_count?: number | null
          created_at?: string | null
          id?: string
          media_id?: number
          media_title?: string
          media_type?: string
          notification_message?: string
          notification_title?: string
          recipients_count?: number | null
          status?: string | null
          webpushr_id?: string | null
        }
        Relationships: []
      }
      popup_banner_ad: {
        Row: {
          button_text: string
          click_url: string
          enabled: boolean
          id: number
          image_url: string
          schedule_end: string | null
          schedule_start: string | null
          updated_at: string
        }
        Insert: {
          button_text?: string
          click_url?: string
          enabled?: boolean
          id?: number
          image_url?: string
          schedule_end?: string | null
          schedule_start?: string | null
          updated_at?: string
        }
        Update: {
          button_text?: string
          click_url?: string
          enabled?: boolean
          id?: number
          image_url?: string
          schedule_end?: string | null
          schedule_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pre_roll_gate: {
        Row: {
          duration_seconds: number
          enabled: boolean
          id: number
          image_click_url: string
          image_url: string
          script: string
          show_skip_button: boolean
          type: Database["public"]["Enums"]["pre_roll_type"]
          updated_at: string
          video_click_url: string
          video_url: string
        }
        Insert: {
          duration_seconds?: number
          enabled?: boolean
          id?: number
          image_click_url?: string
          image_url?: string
          script?: string
          show_skip_button?: boolean
          type?: Database["public"]["Enums"]["pre_roll_type"]
          updated_at?: string
          video_click_url?: string
          video_url?: string
        }
        Update: {
          duration_seconds?: number
          enabled?: boolean
          id?: number
          image_click_url?: string
          image_url?: string
          script?: string
          show_skip_button?: boolean
          type?: Database["public"]["Enums"]["pre_roll_type"]
          updated_at?: string
          video_click_url?: string
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ads_disabled: boolean
          avatar_url: string | null
          badges: number
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          level: number
          movies_watched: number
          plan: string
          points_earned: number
          updated_at: string
          xp: number
        }
        Insert: {
          ads_disabled?: boolean
          avatar_url?: string | null
          badges?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          level?: number
          movies_watched?: number
          plan?: string
          points_earned?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          ads_disabled?: boolean
          avatar_url?: string | null
          badges?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          level?: number
          movies_watched?: number
          plan?: string
          points_earned?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      scheduled_webpushr_settings: {
        Row: {
          enabled: boolean
          id: number
          quiet_end: number
          quiet_start: number
          source_preset: Database["public"]["Enums"]["source_preset_enum"]
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: number
          quiet_end?: number
          quiet_start?: number
          source_preset?: Database["public"]["Enums"]["source_preset_enum"]
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: number
          quiet_end?: number
          quiet_start?: number
          source_preset?: Database["public"]["Enums"]["source_preset_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      search_top_picks_movies: {
        Row: {
          id: number
          title: string | null
        }
        Insert: {
          id: number
          title?: string | null
        }
        Update: {
          id?: number
          title?: string | null
        }
        Relationships: []
      }
      search_top_picks_tv: {
        Row: {
          id: number
          name: string | null
        }
        Insert: {
          id: number
          name?: string | null
        }
        Update: {
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          points_reward: number
          required_action: string | null
          required_count: number
          task_type: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          points_reward: number
          required_action?: string | null
          required_count?: number
          task_type: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          points_reward?: number
          required_action?: string | null
          required_count?: number
          task_type?: string
          title?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_claimed: boolean
          is_completed: boolean
          progress_count: number
          reset_at: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          is_completed?: boolean
          progress_count?: number
          reset_at?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          is_completed?: boolean
          progress_count?: number
          reset_at?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_history: {
        Row: {
          content_id: number
          id: string
          is_completed: boolean
          last_watched_at: string
          media_type: string
          minutes_watched: number
          user_id: string
        }
        Insert: {
          content_id: number
          id?: string
          is_completed?: boolean
          last_watched_at?: string
          media_type: string
          minutes_watched?: number
          user_id: string
        }
        Update: {
          content_id?: number
          id?: string
          is_completed?: boolean
          last_watched_at?: string
          media_type?: string
          minutes_watched?: number
          user_id?: string
        }
        Relationships: []
      }
      watch_later: {
        Row: {
          added_at: string
          content_id: number
          content_type: Database["public"]["Enums"]["content_type_enum"]
          id: number
          poster_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          added_at?: string
          content_id: number
          content_type: Database["public"]["Enums"]["content_type_enum"]
          id?: number
          poster_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          added_at?: string
          content_id?: number
          content_type?: Database["public"]["Enums"]["content_type_enum"]
          id?: number
          poster_path?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string | null
          backdrop_path: string | null
          content_id: number
          content_type: string
          id: string
          poster_path: string | null
          title: string
          user_id: string
          vote_average: number | null
        }
        Insert: {
          added_at?: string | null
          backdrop_path?: string | null
          content_id: number
          content_type: string
          id?: string
          poster_path?: string | null
          title: string
          user_id: string
          vote_average?: number | null
        }
        Update: {
          added_at?: string | null
          backdrop_path?: string | null
          content_id?: number
          content_type?: string
          id?: string
          poster_path?: string | null
          title?: string
          user_id?: string
          vote_average?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_config_site_compiled: {
        Row: {
          value: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_task_points: {
        Args: { p_points: number; p_task_id: string; p_user_id: string }
        Returns: undefined
      }
      get_affiliate_stats: {
        Args: {
          p_affiliate_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_affiliate_event: {
        Args: {
          p_code: string
          p_event_type: string
          p_ip_hash: string
          p_path: string
        }
        Returns: Json
      }
    }
    Enums: {
      ad_placement: "all" | "homepage" | "detail"
      ad_script_position: "after_hero" | "before_movies" | "between_movies_tv"
      app_role: "student" | "landlord" | "admin"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      content_type_enum: "movie" | "tv"
      homepage_section_enum:
        | "becauseYouWatched"
        | "aiRecommendations"
        | "trailersSection"
      media_type_enum: "movie" | "tv"
      mood_kind_enum:
        | "liquid"
        | "fun"
        | "water"
        | "stars"
        | "christmas"
        | "fireworks"
        | "bubbles"
      pre_roll_type: "video" | "image" | "script"
      rental_status: "pending" | "paid" | "released"
      room_type: "single" | "double" | "self_contained" | "flat"
      source_preset_enum: "surprise" | "trending" | "popular"
      watch_type_enum: "m3u8" | "iframe" | "youtube"
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
      ad_placement: ["all", "homepage", "detail"],
      ad_script_position: ["after_hero", "before_movies", "between_movies_tv"],
      app_role: ["student", "landlord", "admin"],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      content_type_enum: ["movie", "tv"],
      homepage_section_enum: [
        "becauseYouWatched",
        "aiRecommendations",
        "trailersSection",
      ],
      media_type_enum: ["movie", "tv"],
      mood_kind_enum: [
        "liquid",
        "fun",
        "water",
        "stars",
        "christmas",
        "fireworks",
        "bubbles",
      ],
      pre_roll_type: ["video", "image", "script"],
      rental_status: ["pending", "paid", "released"],
      room_type: ["single", "double", "self_contained", "flat"],
      source_preset_enum: ["surprise", "trending", "popular"],
      watch_type_enum: ["m3u8", "iframe", "youtube"],
    },
  },
} as const
