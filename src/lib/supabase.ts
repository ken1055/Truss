import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database, MemberProfile, EventParticipant } from "./types";

// 型定義は@/lib/typesに移動済み

// シングルトンパターンでSupabaseクライアントを管理
let supabaseClientInstance: ReturnType<
  typeof createBrowserClient<Database>
> | null = null;

// Supabaseクライアントの作成（クライアントサイド用）
export const createClientComponentClient = () => {
  // 既存のインスタンスがある場合はそれを返す
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables are required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  // 新しいインスタンスを作成してキャッシュ
  supabaseClientInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  );
  return supabaseClientInstance;
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
