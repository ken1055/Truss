"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LogOut,
  Calendar,
  Users,
  Settings,
  Plus,
  MessageSquare,
  Shield,
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">プロフィール情報を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-2xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">
                こんにちは、{profile.full_name}さん
              </h1>
              <p className="text-sm text-gray-600">
                {profile.member_category === "undergraduate"
                  ? "学部生"
                  : profile.member_category === "graduate"
                  ? "大学院生"
                  : profile.member_category === "faculty"
                  ? "教職員"
                  : "会員"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* メインメニュー */}
        <div className="space-y-4">
          <button
            onClick={() => router.push("/profile")}
            className="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium">プロフィール設定</h3>
                  <p className="text-sm text-gray-600">
                    言語・空き日程・個人情報
                  </p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push("/events")}
            className="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium">グループミーティング</h3>
                  <p className="text-sm text-gray-600">イベント参加・作成</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push("/suggestions")}
            className="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium">提案・フィードバック</h3>
                  <p className="text-sm text-gray-600">
                    匿名で運営に意見を送信
                  </p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </button>
        </div>

        {/* 管理者メニュー */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-3 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            運営メニュー
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/admin/promote")}
              className="w-full bg-white rounded-lg shadow-sm p-3 text-left hover:bg-gray-50 text-sm"
            >
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-blue-600 mr-2" />
                <span className="font-medium">管理者権限を取得</span>
              </div>
            </button>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="w-full bg-blue-600 text-white rounded-lg p-3 text-left hover:bg-blue-700 text-sm"
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span className="font-medium">管理者ダッシュボード</span>
              </div>
            </button>
          </div>
        </div>

        {/* 簡単な説明 */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">📋 使い方</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>1.</strong> プロフィール設定で言語と空き日程を登録
            </li>
            <li>
              <strong>2.</strong> グループミーティングでイベントに参加
            </li>
            <li>
              <strong>3.</strong> 自動マッチング機能でグループが決定
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
