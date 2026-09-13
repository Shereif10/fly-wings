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
      activities: {
        Row: {
          category: string | null
          createdAt: string | null
          date: string | null
          descriptionAr: string | null
          descriptionEn: string | null
          extra: Json | null
          id: string
          images: string[] | null
          imageUrl: string | null
          location: string | null
          published: boolean | null
          titleAr: string | null
          titleEn: string | null
          updatedAt: string | null
        }
        Insert: {
          category?: string | null
          createdAt?: string | null
          date?: string | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          extra?: Json | null
          id?: string
          images?: string[] | null
          imageUrl?: string | null
          location?: string | null
          published?: boolean | null
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Update: {
          category?: string | null
          createdAt?: string | null
          date?: string | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          extra?: Json | null
          id?: string
          images?: string[] | null
          imageUrl?: string | null
          location?: string | null
          published?: boolean | null
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          age: number | null
          birthDate: string | null
          city: string | null
          country: string | null
          createdAt: string | null
          education: string | null
          email: string
          englishLevel: string | null
          experience: string | null
          extra: Json | null
          firstName: string | null
          fullName: string
          gender: string | null
          hasPassport: string | null
          howDidYouHear: string | null
          id: string
          lastName: string | null
          medicalCondition: string | null
          message: string | null
          nationality: string | null
          notes: string | null
          packageId: string | null
          packageName: string | null
          phone: string | null
          preferredProgram: string | null
          qualification: string | null
          status: string | null
          updatedAt: string | null
        }
        Insert: {
          age?: number | null
          birthDate?: string | null
          city?: string | null
          country?: string | null
          createdAt?: string | null
          education?: string | null
          email: string
          englishLevel?: string | null
          experience?: string | null
          extra?: Json | null
          firstName?: string | null
          fullName: string
          gender?: string | null
          hasPassport?: string | null
          howDidYouHear?: string | null
          id?: string
          lastName?: string | null
          medicalCondition?: string | null
          message?: string | null
          nationality?: string | null
          notes?: string | null
          packageId?: string | null
          packageName?: string | null
          phone?: string | null
          preferredProgram?: string | null
          qualification?: string | null
          status?: string | null
          updatedAt?: string | null
        }
        Update: {
          age?: number | null
          birthDate?: string | null
          city?: string | null
          country?: string | null
          createdAt?: string | null
          education?: string | null
          email?: string
          englishLevel?: string | null
          experience?: string | null
          extra?: Json | null
          firstName?: string | null
          fullName?: string
          gender?: string | null
          hasPassport?: string | null
          howDidYouHear?: string | null
          id?: string
          lastName?: string | null
          medicalCondition?: string | null
          message?: string | null
          nationality?: string | null
          notes?: string | null
          packageId?: string | null
          packageName?: string | null
          phone?: string | null
          preferredProgram?: string | null
          qualification?: string | null
          status?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          authorAr: string | null
          authorEn: string | null
          categoryAr: string | null
          categoryEn: string | null
          contentAr: string | null
          contentEn: string | null
          createdAt: string | null
          excerptAr: string | null
          excerptEn: string | null
          extra: Json | null
          id: string
          image: string | null
          published: boolean | null
          titleAr: string | null
          titleEn: string | null
          updatedAt: string | null
        }
        Insert: {
          authorAr?: string | null
          authorEn?: string | null
          categoryAr?: string | null
          categoryEn?: string | null
          contentAr?: string | null
          contentEn?: string | null
          createdAt?: string | null
          excerptAr?: string | null
          excerptEn?: string | null
          extra?: Json | null
          id?: string
          image?: string | null
          published?: boolean | null
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Update: {
          authorAr?: string | null
          authorEn?: string | null
          categoryAr?: string | null
          categoryEn?: string | null
          contentAr?: string | null
          contentEn?: string | null
          createdAt?: string | null
          excerptAr?: string | null
          excerptEn?: string | null
          extra?: Json | null
          id?: string
          image?: string | null
          published?: boolean | null
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      board_members: {
        Row: {
          bioAr: string | null
          bioEn: string | null
          createdAt: string | null
          extra: Json | null
          id: string
          imageUrl: string | null
          nameAr: string | null
          nameEn: string | null
          order: number | null
          positionAr: string | null
          positionEn: string | null
        }
        Insert: {
          bioAr?: string | null
          bioEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          id?: string
          imageUrl?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          positionAr?: string | null
          positionEn?: string | null
        }
        Update: {
          bioAr?: string | null
          bioEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          id?: string
          imageUrl?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          positionAr?: string | null
          positionEn?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          createdAt: string | null
          email: string
          extra: Json | null
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          createdAt?: string | null
          email: string
          extra?: Json | null
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string
          extra?: Json | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answerAr: string | null
          answerEn: string | null
          categoryAr: string | null
          categoryEn: string | null
          createdAt: string | null
          extra: Json | null
          id: string
          order: number | null
          questionAr: string | null
          questionEn: string | null
        }
        Insert: {
          answerAr?: string | null
          answerEn?: string | null
          categoryAr?: string | null
          categoryEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          id?: string
          order?: number | null
          questionAr?: string | null
          questionEn?: string | null
        }
        Update: {
          answerAr?: string | null
          answerEn?: string | null
          categoryAr?: string | null
          categoryEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          id?: string
          order?: number | null
          questionAr?: string | null
          questionEn?: string | null
        }
        Relationships: []
      }
      gallery: {
        Row: {
          categoryAr: string | null
          categoryEn: string | null
          createdAt: string | null
          extra: Json | null
          id: string
          image: string | null
          order: number | null
          thumbnail: string | null
          titleAr: string | null
          titleEn: string | null
          type: string | null
          url: string | null
        }
        Insert: {
          categoryAr?: string | null
          categoryEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          id?: string
          image?: string | null
          order?: number | null
          thumbnail?: string | null
          titleAr?: string | null
          titleEn?: string | null
          type?: string | null
          url?: string | null
        }
        Update: {
          categoryAr?: string | null
          categoryEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          id?: string
          image?: string | null
          order?: number | null
          thumbnail?: string | null
          titleAr?: string | null
          titleEn?: string | null
          type?: string | null
          url?: string | null
        }
        Relationships: []
      }
      graduates: {
        Row: {
          achievementAr: string | null
          achievementEn: string | null
          bioAr: string | null
          bioEn: string | null
          createdAt: string | null
          extra: Json | null
          graduationYear: number | null
          id: string
          image: string | null
          nameAr: string | null
          nameEn: string | null
          order: number | null
          positionAr: string | null
          positionEn: string | null
          published: boolean | null
          updatedAt: string | null
        }
        Insert: {
          achievementAr?: string | null
          achievementEn?: string | null
          bioAr?: string | null
          bioEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          graduationYear?: number | null
          id?: string
          image?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          positionAr?: string | null
          positionEn?: string | null
          published?: boolean | null
          updatedAt?: string | null
        }
        Update: {
          achievementAr?: string | null
          achievementEn?: string | null
          bioAr?: string | null
          bioEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          graduationYear?: number | null
          id?: string
          image?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          positionAr?: string | null
          positionEn?: string | null
          published?: boolean | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      journey_milestones: {
        Row: {
          createdAt: string | null
          descriptionAr: string | null
          descriptionEn: string | null
          extra: Json | null
          icon: string | null
          id: string
          order: number | null
          titleAr: string | null
          titleEn: string | null
          year: string | null
        }
        Insert: {
          createdAt?: string | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          extra?: Json | null
          icon?: string | null
          id?: string
          order?: number | null
          titleAr?: string | null
          titleEn?: string | null
          year?: string | null
        }
        Update: {
          createdAt?: string | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          extra?: Json | null
          icon?: string | null
          id?: string
          order?: number | null
          titleAr?: string | null
          titleEn?: string | null
          year?: string | null
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          contentAr: string | null
          contentEn: string | null
          id: string
          titleAr: string | null
          titleEn: string | null
          updatedAt: string | null
        }
        Insert: {
          contentAr?: string | null
          contentEn?: string | null
          id: string
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Update: {
          contentAr?: string | null
          contentEn?: string | null
          id?: string
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          authorAr: string | null
          authorEn: string | null
          categoryAr: string | null
          categoryEn: string | null
          contentAr: string | null
          contentEn: string | null
          createdAt: string | null
          excerptAr: string | null
          excerptEn: string | null
          extra: Json | null
          id: string
          image: string | null
          published: boolean | null
          titleAr: string | null
          titleEn: string | null
          updatedAt: string | null
        }
        Insert: {
          authorAr?: string | null
          authorEn?: string | null
          categoryAr?: string | null
          categoryEn?: string | null
          contentAr?: string | null
          contentEn?: string | null
          createdAt?: string | null
          excerptAr?: string | null
          excerptEn?: string | null
          extra?: Json | null
          id?: string
          image?: string | null
          published?: boolean | null
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Update: {
          authorAr?: string | null
          authorEn?: string | null
          categoryAr?: string | null
          categoryEn?: string | null
          contentAr?: string | null
          contentEn?: string | null
          createdAt?: string | null
          excerptAr?: string | null
          excerptEn?: string | null
          extra?: Json | null
          id?: string
          image?: string | null
          published?: boolean | null
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          createdAt: string | null
          curriculumAr: Json | null
          curriculumEn: Json | null
          descriptionAr: string | null
          descriptionEn: string | null
          durationAr: string | null
          durationEn: string | null
          extra: Json | null
          featuresAr: string[] | null
          featuresEn: string[] | null
          id: string
          image: string | null
          isPopular: boolean | null
          nameAr: string | null
          nameEn: string | null
          order: number | null
          price: number | null
          priceLabel: string | null
          published: boolean | null
          requirementsAr: string[] | null
          requirementsEn: string[] | null
          shortDescriptionAr: string | null
          shortDescriptionEn: string | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          curriculumAr?: Json | null
          curriculumEn?: Json | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          durationAr?: string | null
          durationEn?: string | null
          extra?: Json | null
          featuresAr?: string[] | null
          featuresEn?: string[] | null
          id?: string
          image?: string | null
          isPopular?: boolean | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          price?: number | null
          priceLabel?: string | null
          published?: boolean | null
          requirementsAr?: string[] | null
          requirementsEn?: string[] | null
          shortDescriptionAr?: string | null
          shortDescriptionEn?: string | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          curriculumAr?: Json | null
          curriculumEn?: Json | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          durationAr?: string | null
          durationEn?: string | null
          extra?: Json | null
          featuresAr?: string[] | null
          featuresEn?: string[] | null
          id?: string
          image?: string | null
          isPopular?: boolean | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          price?: number | null
          priceLabel?: string | null
          published?: boolean | null
          requirementsAr?: string[] | null
          requirementsEn?: string[] | null
          shortDescriptionAr?: string | null
          shortDescriptionEn?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          createdAt: string | null
          id: string
          page: string
          referrer: string | null
          userAgent: string | null
        }
        Insert: {
          createdAt?: string | null
          id?: string
          page: string
          referrer?: string | null
          userAgent?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          page?: string
          referrer?: string | null
          userAgent?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          createdAt: string | null
          extra: Json | null
          id: string
          logo: string | null
          nameAr: string | null
          nameEn: string | null
          order: number | null
          url: string | null
        }
        Insert: {
          createdAt?: string | null
          extra?: Json | null
          id?: string
          logo?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          url?: string | null
        }
        Update: {
          createdAt?: string | null
          extra?: Json | null
          id?: string
          logo?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          url?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          createdAt: string | null
          email: string
          extra: Json | null
          fullName: string
          id: string
          message: string | null
          phone: string | null
          serviceId: string | null
          serviceName: string | null
          status: string | null
        }
        Insert: {
          createdAt?: string | null
          email: string
          extra?: Json | null
          fullName: string
          id?: string
          message?: string | null
          phone?: string | null
          serviceId?: string | null
          serviceName?: string | null
          status?: string | null
        }
        Update: {
          createdAt?: string | null
          email?: string
          extra?: Json | null
          fullName?: string
          id?: string
          message?: string | null
          phone?: string | null
          serviceId?: string | null
          serviceName?: string | null
          status?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          createdAt: string | null
          descriptionAr: string | null
          descriptionEn: string | null
          extra: Json | null
          featuresAr: string[] | null
          featuresEn: string[] | null
          fullDescriptionAr: string | null
          fullDescriptionEn: string | null
          icon: string | null
          id: string
          image: string | null
          order: number | null
          published: boolean | null
          titleAr: string | null
          titleEn: string | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          extra?: Json | null
          featuresAr?: string[] | null
          featuresEn?: string[] | null
          fullDescriptionAr?: string | null
          fullDescriptionEn?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          order?: number | null
          published?: boolean | null
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          extra?: Json | null
          featuresAr?: string[] | null
          featuresEn?: string[] | null
          fullDescriptionAr?: string | null
          fullDescriptionEn?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          order?: number | null
          published?: boolean | null
          titleAr?: string | null
          titleEn?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          data: Json
          id: string
          updatedAt: string | null
        }
        Insert: {
          data?: Json
          id: string
          updatedAt?: string | null
        }
        Update: {
          data?: Json
          id?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      training_programs: {
        Row: {
          createdAt: string | null
          descriptionAr: string | null
          descriptionEn: string | null
          durationAr: string | null
          durationEn: string | null
          extra: Json | null
          featuresAr: string[] | null
          featuresEn: string[] | null
          icon: string | null
          id: string
          image: string | null
          levelAr: string | null
          levelEn: string | null
          nameAr: string | null
          nameEn: string | null
          order: number | null
          price: number | null
          published: boolean | null
          shortDescriptionAr: string | null
          shortDescriptionEn: string | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          durationAr?: string | null
          durationEn?: string | null
          extra?: Json | null
          featuresAr?: string[] | null
          featuresEn?: string[] | null
          icon?: string | null
          id?: string
          image?: string | null
          levelAr?: string | null
          levelEn?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          price?: number | null
          published?: boolean | null
          shortDescriptionAr?: string | null
          shortDescriptionEn?: string | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          descriptionAr?: string | null
          descriptionEn?: string | null
          durationAr?: string | null
          durationEn?: string | null
          extra?: Json | null
          featuresAr?: string[] | null
          featuresEn?: string[] | null
          icon?: string | null
          id?: string
          image?: string | null
          levelAr?: string | null
          levelEn?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          price?: number | null
          published?: boolean | null
          shortDescriptionAr?: string | null
          shortDescriptionEn?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      training_team: {
        Row: {
          bioAr: string | null
          bioEn: string | null
          createdAt: string | null
          extra: Json | null
          id: string
          imageUrl: string | null
          nameAr: string | null
          nameEn: string | null
          order: number | null
          positionAr: string | null
          positionEn: string | null
          qualificationsAr: string[] | null
          qualificationsEn: string[] | null
        }
        Insert: {
          bioAr?: string | null
          bioEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          id?: string
          imageUrl?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          positionAr?: string | null
          positionEn?: string | null
          qualificationsAr?: string[] | null
          qualificationsEn?: string[] | null
        }
        Update: {
          bioAr?: string | null
          bioEn?: string | null
          createdAt?: string | null
          extra?: Json | null
          id?: string
          imageUrl?: string | null
          nameAr?: string | null
          nameEn?: string | null
          order?: number | null
          positionAr?: string | null
          positionEn?: string | null
          qualificationsAr?: string[] | null
          qualificationsEn?: string[] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    },
  },
} as const
