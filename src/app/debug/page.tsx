"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@/lib/supabase";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [connectionTest, setConnectionTest] = useState<string>("テスト中...");

  useEffect(() => {
    const runDebugTests = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      setDebugInfo({
        supabaseUrl,
        supabaseKey: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "未設定",
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });

      // Supabase接続テスト
      try {
        const supabase = createClientComponentClient();
        
        // 1. 基本的な接続テスト
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setConnectionTest(`セッション取得エラー: ${sessionError.message}`);
          return;
        }

        // 2. データベース接続テスト（簡単なクエリ）
        const { data: dbTest, error: dbError } = await supabase
          .from('member_profiles')
          .select('count')
          .limit(1);

        if (dbError) {
          setConnectionTest(`データベース接続エラー: ${dbError.message}`);
          return;
        }

        setConnectionTest("✅ Supabase接続成功！");
        
      } catch (error) {
        setConnectionTest(`接続テスト失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    runDebugTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 デバッグ情報</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">環境変数</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="font-semibold">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className={debugInfo.hasUrl ? "text-green-600" : "text-red-600"}>
                {debugInfo.supabaseUrl || "❌ 未設定"}
              </span>
            </div>
            <div>
              <span className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className={debugInfo.hasKey ? "text-green-600" : "text-red-600"}>
                {debugInfo.supabaseKey || "❌ 未設定"}
              </span>
            </div>
            <div>
              <span className="font-semibold">NODE_ENV:</span>
              <span className="text-blue-600">{debugInfo.nodeEnv}</span>
            </div>
            <div>
              <span className="font-semibold">タイムスタンプ:</span>
              <span className="text-gray-600">{debugInfo.timestamp}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">接続テスト</h2>
          <div className="p-4 bg-gray-50 rounded border">
            <pre className="whitespace-pre-wrap">{connectionTest}</pre>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">💡 トラブルシューティング</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 環境変数が正しく設定されているか確認</li>
            <li>• SupabaseプロジェクトURLが有効か確認</li>
            <li>• Supabaseプロジェクトが一時停止されていないか確認</li>
            <li>• RLS（Row Level Security）の設定を確認</li>
            <li>• ネットワーク接続を確認</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
