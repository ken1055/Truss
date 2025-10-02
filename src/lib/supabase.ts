import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database, MemberProfile, EventParticipant } from "./types";

// 型定義は@/lib/typesに移動済み



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
