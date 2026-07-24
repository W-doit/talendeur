export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      certifications: {
        Row: {
          id: string
          user_id: string | null
          course_name: string | null
          certification_type: string | null
          date_attained: string | null
          details: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          course_name?: string | null
          certification_type?: string | null
          date_attained?: string | null
          details?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          course_name?: string | null
          certification_type?: string | null
          date_attained?: string | null
          details?: string | null
        }
      }
      education_history: {
        Row: {
          id: string
          user_id: string | null
          institution: string | null
          qualification_type: string | null
          subject: string | null
          start_date: string | null
          end_date: string | null
          still_studying: boolean | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          institution?: string | null
          qualification_type?: string | null
          subject?: string | null
          start_date?: string | null
          end_date?: string | null
          still_studying?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string | null
          institution?: string | null
          qualification_type?: string | null
          subject?: string | null
          start_date?: string | null
          end_date?: string | null
          still_studying?: boolean | null
        }
      }
      jobseeker_skill_rating: {
        Row: {
          user_id: string
          interests: string[] | null
          soft_skills: number | null
          hard_skills: number | null
          feedback_score: number | null
          learning_score: number | null
        }
        Insert: {
          user_id: string
          interests?: string[] | null
          soft_skills?: number | null
          hard_skills?: number | null
          feedback_score?: number | null
          learning_score?: number | null
        }
        Update: {
          user_id?: string
          interests?: string[] | null
          soft_skills?: number | null
          hard_skills?: number | null
          feedback_score?: number | null
          learning_score?: number | null
        }
      }
      skills_dimensions: {
        Row: {
          user_id: string
          creativity: number | null
          communication: number | null
          critical_thinking: number | null
          technology_development: number | null
          operations: number | null
          social_impact: number | null
          business_acumen: number | null
          innovation: number | null
          collaboration: number | null
          leadership: number | null
          precision: number | null
          depth: number | null
          commitment: number | null
          empathy: number | null
          flexibility: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          creativity?: number | null
          communication?: number | null
          critical_thinking?: number | null
          technology_development?: number | null
          operations?: number | null
          social_impact?: number | null
          business_acumen?: number | null
          innovation?: number | null
          collaboration?: number | null
          leadership?: number | null
          precision?: number | null
          depth?: number | null
          commitment?: number | null
          empathy?: number | null
          flexibility?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          creativity?: number | null
          communication?: number | null
          critical_thinking?: number | null
          technology_development?: number | null
          operations?: number | null
          social_impact?: number | null
          business_acumen?: number | null
          innovation?: number | null
          collaboration?: number | null
          leadership?: number | null
          precision?: number | null
          depth?: number | null
          commitment?: number | null
          empathy?: number | null
          flexibility?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      matches: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          user_approved: boolean | null
          organization_approved: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          user_approved?: boolean | null
          organization_approved?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          user_approved?: boolean | null
          organization_approved?: boolean | null
          created_at?: string | null
        }
      }
      organization_details: {
        Row: {
          organization_id: string
          logo: string | null
          company_name: string
          website: string | null
          about: string | null
          needs: string[]
        }
        Insert: {
          organization_id: string
          logo?: string | null
          company_name: string
          website?: string | null
          about?: string | null
          needs: string[]
        }
        Update: {
          organization_id?: string
          logo?: string | null
          company_name?: string
          website?: string | null
          about?: string | null
          needs?: string[]
        }
      }
      profile: {
        Row: {
          user_id: string
          first_name: string
          surname: string
          email: string
          profile_pic: string | null
          cv_url: string | null
          bio: string | null
          video_url: string | null
          portfolio_url: string | null
          user_type: string
        }
        Insert: {
          user_id: string
          first_name: string
          surname: string
          email: string
          profile_pic?: string | null
          cv_url?: string | null
          bio?: string | null
          video_url?: string | null
          portfolio_url?: string | null
          user_type: string
        }
        Update: {
          user_id?: string
          first_name?: string
          surname?: string
          email?: string
          profile_pic?: string | null
          cv_url?: string | null
          bio?: string | null
          video_url?: string | null
          portfolio_url?: string | null
          user_type?: string
        }
      }
      reference: {
        Row: {
          id: string
          user_id: string | null
          relationship: string | null
          email: string | null
          number: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          relationship?: string | null
          email?: string | null
          number?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          relationship?: string | null
          email?: string | null
          number?: number | null
        }
      }
      socials: {
        Row: {
          id: string
          user_id: string | null
          platform: string | null
          url: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          platform?: string | null
          url?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          platform?: string | null
          url?: string | null
        }
      }
      work_experience: {
        Row: {
          id: string
          user_id: string | null
          job_title: string | null
          company: string | null
          start_date: string | null
          end_date: string | null
          still_work_here: boolean | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          job_title?: string | null
          company?: string | null
          start_date?: string | null
          end_date?: string | null
          still_work_here?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string | null
          job_title?: string | null
          company?: string | null
          start_date?: string | null
          end_date?: string | null
          still_work_here?: boolean | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
