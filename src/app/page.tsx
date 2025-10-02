"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Users, Globe, Calendar, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* デモモード通知 */}
      <div className="bg-yellow-100 border-b px-4 py-2 text-center text-sm text-yellow-800">
        📝 デモモード - 実際のデータは保存されません
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            サークル交流アプリ
          </h1>
          <p className="text-gray-600 mb-8">
            留学生と在校生のグループミーティングをスマートにマッチング
          </p>
        </div>

        {/* 機能説明 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">🎯 主な機能</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <Globe className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">言語マッチング</h3>
                <p className="text-sm text-gray-600">
                  話せる言語に基づいてグループを形成
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">スケジュール調整</h3>
                <p className="text-sm text-gray-600">
                  空き日程を考慮した自動マッチング
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Users className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">バランス調整</h3>
                <p className="text-sm text-gray-600">
                  留学生・在校生・性別比率の最適化
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ログイン・登録ボタン */}
        <div className="space-y-3">
          <a
            href="/signup"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-center font-medium hover:bg-blue-700"
          >
            アカウント作成
          </a>
          <a
            href="/signin"
            className="block w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg text-center font-medium hover:bg-gray-50"
          >
            ログイン
          </a>
        </div>

        {/* 使い方 */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">📋 使い方</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>1.</strong> アカウント作成・ログイン
            </li>
            <li>
              <strong>2.</strong> プロフィール設定（言語・空き日程）
            </li>
            <li>
              <strong>3.</strong> イベント参加・グループマッチング
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
