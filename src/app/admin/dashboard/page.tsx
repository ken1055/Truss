"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import {
  Users,
  MessageSquare,
  Calendar,
  Settings,
  BarChart3,
  Shield,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    pendingSuggestions: 0,
    activeGroups: 0,
  });

  useEffect(() => {
    // デモモードでは認証チェックをスキップ
    if (!loading && !user && process.env.NODE_ENV !== "development") {
      router.push("/signin");
      return;
    }

    // 管理者権限チェック（実際の運用時）
    if (profile && profile.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const fetchStats = async () => {
      // デモ用統計データ
      const demoStats = {
        totalUsers: 45,
        totalEvents: 8,
        pendingSuggestions: 3,
        activeGroups: 12,
      };

      if (user) {
        try {
          // 実際のデータを取得
          const [usersResult, eventsResult, suggestionsResult, groupsResult] =
            await Promise.all([
              supabase.from("profiles").select("id", { count: "exact" }),
              supabase.from("events").select("id", { count: "exact" }),
              supabase
                .from("anonymous_suggestions")
                .select("id", { count: "exact" })
                .eq("status", "pending"),
              supabase.from("groups").select("id", { count: "exact" }),
            ]);

          setStats({
            totalUsers: usersResult.count || demoStats.totalUsers,
            totalEvents: eventsResult.count || demoStats.totalEvents,
            pendingSuggestions:
              suggestionsResult.count || demoStats.pendingSuggestions,
            activeGroups: groupsResult.count || demoStats.activeGroups,
          });
        } catch (error) {
          console.log("Demo mode: Using dummy stats");
          setStats(demoStats);
        }
      } else {
        // デモモード
        setStats(demoStats);
      }
    };

    fetchStats();
  }, [user, profile, loading, router, supabase]);

  // デモモードでは表示を続行
  if (!loading && !user && process.env.NODE_ENV !== "development") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "メンバー管理",
      description: "ユーザーの管理と権限設定",
      icon: Users,
      href: "/admin/members",
      color: "blue",
    },
    {
      title: "提案・フィードバック",
      description: "匿名の提案とフィードバックの確認",
      icon: MessageSquare,
      href: "/admin/suggestions",
      color: "green",
      badge:
        stats.pendingSuggestions > 0 ? stats.pendingSuggestions : undefined,
    },
    {
      title: "イベント管理",
      description: "イベントの作成・編集・削除",
      icon: Calendar,
      href: "/admin/events",
      color: "purple",
    },
    {
      title: "統計・分析",
      description: "参加状況とマッチング分析",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "orange",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* デモモード通知 */}
      <div className="bg-yellow-100 border-b px-4 py-2 text-center text-sm text-yellow-800">
        📝 デモモード - 実際のデータは保存されません
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              戻る
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" />
                管理者ダッシュボード
              </h1>
              <p className="text-sm text-gray-600">サークル運営管理システム</p>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総メンバー数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">開催イベント</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalEvents}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未確認提案</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pendingSuggestions}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">活動グループ</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.activeGroups}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 管理メニュー */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <item.icon
                    className={`h-8 w-8 text-${item.color}-600 mr-4 mt-1`}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 重要な通知 */}
        {stats.pendingSuggestions > 0 && (
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900">
                  新しい提案・フィードバックがあります
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  {stats.pendingSuggestions}
                  件の未確認の提案・フィードバックが届いています。
                  <button
                    onClick={() => router.push("/admin/suggestions")}
                    className="underline ml-1 hover:no-underline"
                  >
                    今すぐ確認する
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
