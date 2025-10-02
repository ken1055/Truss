import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// TypeScript型定義
export interface Profile {
  id: string;
  email: string;
  name: string;
  student_type: "international" | "domestic";
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Language {
  id: string;
  name: string;
  code: string;
}

export interface UserLanguage {
  id: string;
  user_id: string;
  language_id: string;
  proficiency_level: "beginner" | "intermediate" | "advanced" | "native";
  language: Language;
}

export interface Availability {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  max_participants: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  event_id: string;
  name: string;
  max_size: number;
  target_international_ratio: number;
  target_gender_ratio: number;
  primary_language_id?: string;
  status: "forming" | "confirmed" | "completed";
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profile: Profile;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: "registered" | "confirmed" | "cancelled";
  preferences?: Record<string, unknown>;
  created_at: string;
  profile: Profile;
}

// Database type definition
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      languages: {
        Row: Language;
        Insert: Omit<Language, "id">;
        Update: Partial<Omit<Language, "id">>;
      };
      user_languages: {
        Row: UserLanguage;
        Insert: Omit<UserLanguage, "id" | "language">;
        Update: Partial<Omit<UserLanguage, "id" | "language">>;
      };
      availability: {
        Row: Availability;
        Insert: Omit<Availability, "id">;
        Update: Partial<Omit<Availability, "id">>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Event, "id" | "created_at" | "updated_at">>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Group, "id" | "created_at" | "updated_at">>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, "id" | "joined_at" | "profile">;
        Update: Partial<Omit<GroupMember, "id" | "joined_at" | "profile">>;
      };
      event_participants: {
        Row: EventParticipant;
        Insert: Omit<EventParticipant, "id" | "created_at" | "profile">;
        Update: Partial<
          Omit<EventParticipant, "id" | "created_at" | "profile">
        >;
      };
    };
  };
}

// Supabaseクライアントの作成（クライアントサイド用）
export const createClientComponentClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("createClientComponentClient: Environment variables", {
    supabaseUrl: supabaseUrl ? "SET" : "NOT SET",
    supabaseKey: supabaseKey ? "SET" : "NOT SET",
  });

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase environment variables not found. Using demo mode.");

    // デモモード用のダミークライアントを返す
    const createMockQueryBuilder = () => {
      const mockBuilder = {
        select: (columns?: string) => mockBuilder,
        insert: (data: any) => mockBuilder,
        update: (data: any) => mockBuilder,
        delete: () => mockBuilder,
        upsert: (data: any) => mockBuilder,
        eq: (column: string, value: any) => mockBuilder,
        gte: (column: string, value: any) => mockBuilder,
        order: (column: string, options?: any) => mockBuilder,
        single: () =>
          Promise.resolve({
            data: null,
            error: new Error("Demo mode - database not available"),
          }),
        // Promiseライクな振る舞いを追加
        then: (onFulfilled?: any, onRejected?: any) => {
          return Promise.resolve({
            data: [],
            error: new Error("Demo mode - database not available"),
          }).then(onFulfilled, onRejected);
        },
        catch: (onRejected?: any) => {
          return Promise.resolve({
            data: [],
            error: new Error("Demo mode - database not available"),
          }).catch(onRejected);
        },
      };
      return mockBuilder;
    };

    const mockClient = {
      auth: {
        signUp: (credentials: any) => {
          console.log("Demo mode: signUp called", credentials);
          return Promise.resolve({
            data: { user: null },
            error: new Error("Demo mode - authentication not available"),
          });
        },
        signInWithPassword: (credentials: any) => {
          console.log("Demo mode: signInWithPassword called", credentials);
          return Promise.resolve({
            data: { user: null },
            error: new Error("Demo mode - authentication not available"),
          });
        },
        signOut: () => {
          console.log("Demo mode: signOut called");
          return Promise.resolve({ error: null });
        },
        getUser: () => {
          console.log("Demo mode: getUser called");
          return Promise.resolve({ data: { user: null }, error: null });
        },
        onAuthStateChange: (callback: any) => {
          console.log("Demo mode: onAuthStateChange called");
          return {
            data: {
              subscription: {
                unsubscribe: () =>
                  console.log("Demo mode: Auth state change unsubscribed"),
              },
            },
          };
        },
      },
      from: (table: string) => {
        console.log("Demo mode: from called with table:", table);
        return createMockQueryBuilder();
      },
    };

    return mockClient as any;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};

// Supabaseクライアントの作成（サーバーサイド用）
export const supabase = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // ビルド時は null を返す
    return null as any;
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
})();
