import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database, MemberProfile, EventParticipant } from "./types";

// 型定義は@/lib/typesに移動済み

// グローバルなシングルトンパターンでSupabaseクライアントを管理
declare global {
  var __supabase_client__:
    | ReturnType<typeof createBrowserClient<Database>>
    | undefined;
}

// Supabaseクライアントの作成（クライアントサイド用）
export const createClientComponentClient = () => {
  // グローバルな既存のインスタンスがある場合はそれを返す
  if (globalThis.__supabase_client__) {
    console.log("Using existing Supabase client instance");
    return globalThis.__supabase_client__;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  console.log("Creating new Supabase client instance");
  // 新しいインスタンスを作成してグローバルにキャッシュ
  globalThis.__supabase_client__ = createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  );
  return globalThis.__supabase_client__;
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
