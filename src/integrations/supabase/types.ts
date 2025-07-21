export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      application_documents: {
        Row: {
          application_id: string | null
          document_type: string
          file_name: string
          file_path: string
          id: string
          uploaded_at: string
        }
        Insert: {
          application_id?: string | null
          document_type: string
          file_name: string
          file_path: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          application_id?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_data_retention: {
        Row: {
          archive_due_date: string | null
          compliance_type_id: string
          created_at: string
          data_summary: Json | null
          download_available_date: string | null
          id: string
          is_archived: boolean | null
          period_identifier: string
          period_type: string
          updated_at: string
          year: number
        }
        Insert: {
          archive_due_date?: string | null
          compliance_type_id: string
          created_at?: string
          data_summary?: Json | null
          download_available_date?: string | null
          id?: string
          is_archived?: boolean | null
          period_identifier: string
          period_type: string
          updated_at?: string
          year: number
        }
        Update: {
          archive_due_date?: string | null
          compliance_type_id?: string
          created_at?: string
          data_summary?: Json | null
          download_available_date?: string | null
          id?: string
          is_archived?: boolean | null
          period_identifier?: string
          period_type?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_data_retention_compliance_type_id_fkey"
            columns: ["compliance_type_id"]
            isOneToOne: false
            referencedRelation: "compliance_types"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_period_records: {
        Row: {
          completed_by: string | null
          completion_date: string
          compliance_type_id: string
          created_at: string
          employee_id: string
          id: string
          next_due_date: string | null
          notes: string | null
          period_identifier: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_by?: string | null
          completion_date: string
          compliance_type_id: string
          created_at?: string
          employee_id: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          period_identifier: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_by?: string | null
          completion_date?: string
          compliance_type_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          period_identifier?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_period_records_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_period_records_compliance_type_id_fkey"
            columns: ["compliance_type_id"]
            isOneToOne: false
            referencedRelation: "compliance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_period_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_records: {
        Row: {
          completed_by: string | null
          completion_date: string
          compliance_task_id: string
          created_at: string | null
          employee_id: string
          id: string
          next_due_date: string
          notes: string | null
        }
        Insert: {
          completed_by?: string | null
          completion_date: string
          compliance_task_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          next_due_date: string
          notes?: string | null
        }
        Update: {
          completed_by?: string | null
          completion_date?: string
          compliance_task_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          next_due_date?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_records_compliance_task_id_fkey"
            columns: ["compliance_task_id"]
            isOneToOne: false
            referencedRelation: "compliance_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_settings: {
        Row: {
          archive_completed_records: boolean
          auto_generate_periods: boolean
          created_at: string
          email_notifications: boolean
          id: string
          reminder_days_before: number
          updated_at: string
        }
        Insert: {
          archive_completed_records?: boolean
          auto_generate_periods?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          reminder_days_before?: number
          updated_at?: string
        }
        Update: {
          archive_completed_records?: boolean
          auto_generate_periods?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          reminder_days_before?: number
          updated_at?: string
        }
        Relationships: []
      }
      compliance_tasks: {
        Row: {
          created_at: string | null
          frequency: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          frequency: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          frequency?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      compliance_types: {
        Row: {
          created_at: string
          description: string | null
          frequency: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_settings: {
        Row: {
          auto_reminders: boolean
          created_at: string
          email_notifications: boolean
          expiry_threshold_days: number
          id: string
          reminder_frequency: string
          updated_at: string
        }
        Insert: {
          auto_reminders?: boolean
          created_at?: string
          email_notifications?: boolean
          expiry_threshold_days?: number
          id?: string
          reminder_frequency?: string
          updated_at?: string
        }
        Update: {
          auto_reminders?: boolean
          created_at?: string
          email_notifications?: boolean
          expiry_threshold_days?: number
          id?: string
          reminder_frequency?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_tracker: {
        Row: {
          branch_id: string | null
          country: string | null
          created_at: string | null
          document_number: string | null
          document_type_id: string
          employee_id: string
          expiry_date: string
          id: string
          issue_date: string | null
          nationality_status: string | null
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          country?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type_id: string
          employee_id: string
          expiry_date: string
          id?: string
          issue_date?: string | null
          nationality_status?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          country?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type_id?: string
          employee_id?: string
          expiry_date?: string
          id?: string
          issue_date?: string | null
          nationality_status?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_tracker_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tracker_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tracker_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          branch: string
          branch_id: string | null
          created_at: string | null
          email: string | null
          employee_code: string
          employee_type: string | null
          hours_restriction: string | null
          id: string
          job_title: string | null
          leave_allowance: number | null
          leave_taken: number | null
          name: string
          phone: string | null
          remaining_leave_days: number | null
          sponsored: boolean | null
          twenty_hours: boolean | null
          user_id: string | null
          working_hours: number | null
        }
        Insert: {
          branch: string
          branch_id?: string | null
          created_at?: string | null
          email?: string | null
          employee_code: string
          employee_type?: string | null
          hours_restriction?: string | null
          id?: string
          job_title?: string | null
          leave_allowance?: number | null
          leave_taken?: number | null
          name: string
          phone?: string | null
          remaining_leave_days?: number | null
          sponsored?: boolean | null
          twenty_hours?: boolean | null
          user_id?: string | null
          working_hours?: number | null
        }
        Update: {
          branch?: string
          branch_id?: string | null
          created_at?: string | null
          email?: string | null
          employee_code?: string
          employee_type?: string | null
          hours_restriction?: string | null
          id?: string
          job_title?: string | null
          leave_allowance?: number | null
          leave_taken?: number | null
          name?: string
          phone?: string | null
          remaining_leave_days?: number | null
          sponsored?: boolean | null
          twenty_hours?: boolean | null
          user_id?: string | null
          working_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          availability: Json | null
          consent: Json | null
          created_at: string
          declarations: Json | null
          employment_history: Json | null
          id: string
          personal_info: Json
          position_id: string | null
          skills_experience: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          availability?: Json | null
          consent?: Json | null
          created_at?: string
          declarations?: Json | null
          employment_history?: Json | null
          id?: string
          personal_info: Json
          position_id?: string | null
          skills_experience?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          availability?: Json | null
          consent?: Json | null
          created_at?: string
          declarations?: Json | null
          employment_history?: Json | null
          id?: string
          personal_info?: Json
          position_id?: string | null
          skills_experience?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_positions: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          notes: string | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          notes?: string | null
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          notes?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_settings: {
        Row: {
          carry_over_enabled: boolean
          created_at: string
          default_leave_days: number
          id: string
          manager_approval_required: boolean
          max_carry_over_days: number | null
          updated_at: string
        }
        Insert: {
          carry_over_enabled?: boolean
          created_at?: string
          default_leave_days?: number
          id?: string
          manager_approval_required?: boolean
          max_carry_over_days?: number | null
          updated_at?: string
        }
        Update: {
          carry_over_enabled?: boolean
          created_at?: string
          default_leave_days?: number
          id?: string
          manager_approval_required?: boolean
          max_carry_over_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      leave_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
          reduces_allowance: boolean
          reduces_balance: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          reduces_allowance?: boolean
          reduces_balance?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          reduces_allowance?: boolean
          reduces_balance?: boolean | null
        }
        Relationships: []
      }
      leaves: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          created_at: string | null
          created_by: string | null
          days: number
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          manager_notes: string | null
          notes: string | null
          rejected_by: string | null
          rejected_date: string | null
          start_date: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string | null
          created_by?: string | null
          days: number
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          manager_notes?: string | null
          notes?: string | null
          rejected_by?: string | null
          rejected_date?: string | null
          start_date: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string | null
          created_by?: string | null
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          manager_notes?: string | null
          notes?: string | null
          rejected_by?: string | null
          rejected_date?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      test_compliance_records: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_branch_access: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branch_access_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_branch_permissions: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branch_permissions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_menu_permissions: {
        Row: {
          created_at: string
          id: string
          menu_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string | null
          granted: boolean | null
          id: string
          permission_key: string
          permission_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted?: boolean | null
          id?: string
          permission_key: string
          permission_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted?: boolean | null
          id?: string
          permission_key?: string
          permission_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_archive_dates: {
        Args: { frequency: string; base_year?: number }
        Returns: {
          archive_due_date: string
          download_available_date: string
        }[]
      }
      create_user_branch_permissions_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_menu_permissions_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_with_role: {
        Args: {
          email_param: string
          password_param: string
          role_param?: string
        }
        Returns: Json
      }
      get_period_identifier: {
        Args: { frequency: string; target_date?: string }
        Returns: string
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      get_user_accessible_branches: {
        Args: { user_id: string }
        Returns: {
          branch_id: string
        }[]
      }
      get_user_role: {
        Args: { input_user_id: string }
        Returns: string
      }
      increment: {
        Args: { row_id: string; increment_amount: number }
        Returns: number
      }
      is_admin_by_id: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_permission: {
        Args: { user_id: string; perm_type: string; perm_key: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
