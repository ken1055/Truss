// Truss会員管理システム型定義

// ENUM型定義
export type MemberCategory =
  | "undergraduate"
  | "graduate"
  | "faculty"
  | "staff"
  | "alumni"
  | "external";
export type MemberStatus = "pending" | "active" | "suspended" | "inactive";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type EventStatus = "draft" | "active" | "cancelled" | "completed";
export type EventPaymentType = "free" | "paid" | "optional";
export type NotificationType = "info" | "warning" | "success" | "error";
export type UserRole = "admin" | "accountant" | "event_organizer" | "member";

// 基本型定義
export interface FiscalYear {
  id: string;
  year: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeMaster {
  id: string;
  fiscal_year_id: string;
  member_category: MemberCategory;
  annual_fee: number;
  created_at: string;
  updated_at: string;
}

export interface MemberProfile {
  id: string;
  user_id: string;
  full_name: string;
  student_id: string;
  department: string;
  grade: number;
  phone_number: string;
  profile_image_url: string | null;
  student_id_image_url: string | null;
  member_category: MemberCategory;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
}

export interface MemberRole {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string;
  granted_at: string;
  created_at: string;
}

export interface MemberDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface MemberPayment {
  id: string;
  user_id: string;
  fiscal_year_id: string;
  amount: number;
  payment_method: string;
  payment_date: string | null;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  max_participants: number;
  status: EventStatus;
  payment_type: EventPaymentType;
  fee_amount: number | null;
  registration_deadline: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
  status: "registered" | "confirmed" | "cancelled";
  created_at: string;
  profile: MemberProfile;
}

export interface EventCheckin {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  checked_in_by: string;
}

export interface EventFee {
  id: string;
  event_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_date: string | null;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface LineToken {
  id: string;
  user_id: string;
  line_user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Database型定義
export interface Database {
  public: {
    Tables: {
      fiscal_years: {
        Row: FiscalYear;
        Insert: Omit<FiscalYear, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FiscalYear, "id" | "created_at" | "updated_at">>;
      };
      fee_master: {
        Row: FeeMaster;
        Insert: Omit<FeeMaster, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FeeMaster, "id" | "created_at" | "updated_at">>;
      };
      member_profiles: {
        Row: MemberProfile;
        Insert: Omit<MemberProfile, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<MemberProfile, "id" | "created_at" | "updated_at">
        >;
      };
      member_roles: {
        Row: MemberRole;
        Insert: Omit<MemberRole, "id" | "created_at">;
        Update: Partial<Omit<MemberRole, "id" | "created_at">>;
      };
      member_documents: {
        Row: MemberDocument;
        Insert: Omit<MemberDocument, "id">;
        Update: Partial<Omit<MemberDocument, "id">>;
      };
      member_payments: {
        Row: MemberPayment;
        Insert: Omit<MemberPayment, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<MemberPayment, "id" | "created_at" | "updated_at">
        >;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Event, "id" | "created_at" | "updated_at">>;
      };
      event_participants: {
        Row: EventParticipant;
        Insert: Omit<EventParticipant, "id" | "created_at">;
        Update: Partial<Omit<EventParticipant, "id" | "created_at">>;
      };
      event_checkins: {
        Row: EventCheckin;
        Insert: Omit<EventCheckin, "id">;
        Update: Partial<Omit<EventCheckin, "id">>;
      };
      event_fees: {
        Row: EventFee;
        Insert: Omit<EventFee, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<EventFee, "id" | "created_at" | "updated_at">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<Omit<AuditLog, "id" | "created_at">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Notification, "id" | "created_at" | "updated_at">>;
      };
      line_tokens: {
        Row: LineToken;
        Insert: Omit<LineToken, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<LineToken, "id" | "created_at" | "updated_at">>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      member_category: MemberCategory;
      member_status: MemberStatus;
      payment_status: PaymentStatus;
      event_status: EventStatus;
      event_payment_type: EventPaymentType;
      notification_type: NotificationType;
      user_role: UserRole;
    };
  };
}
