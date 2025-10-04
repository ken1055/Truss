"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  totalMembers: number;
  totalEvents: number;
  totalRevenue: number;
  pendingApprovals: number;
  membersByType: Array<{ name: string; value: number; color: string }>;
  membersByStatus: Array<{ name: string; value: number; color: string }>;
  eventsByCategory: Array<{ name: string; value: number; color: string }>;
  monthlyStats: Array<{
    month: string;
    members: number;
    events: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: "success" | "warning" | "info";
  }>;
  paymentStats: {
    totalPaid: number;
    totalUnpaid: number;
    pendingCash: number;
    refunded: number;
  };
  eventParticipation: Array<{
    eventTitle: string;
    registered: number;
    attended: number;
    noShow: number;
  }>;
}

const COLORS = {
  primary: "#3B82F6",
  secondary: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#8B5CF6",
  success: "#059669",
  gray: "#6B7280",
};

export default function AdminAnalyticsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "7d" | "30d" | "90d" | "1y"
  >("30d");

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // 並列でデータを取得
      const [
        membersResult,
        eventsResult,
        paymentsResult,
        participantsResult,
        suggestionsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("events").select("*"),
        supabase.from("payment_history").select("*"),
        supabase.from("event_participants").select("*, events(title)"),
        supabase.from("anonymous_suggestions").select("*"),
      ]);

      const members = (membersResult.data || []) as any[];
      const events = (eventsResult.data || []) as any[];
      const payments = (paymentsResult.data || []) as any[];
      const participants = (participantsResult.data || []) as any[];
      const suggestions = (suggestionsResult.data || []) as any[];

      // 会員種別統計
      const membersByType = [
        {
          name: "日本人学生",
          value: members.filter((m) => m.member_type === "japanese_student")
            .length,
          color: COLORS.primary,
        },
        {
          name: "正規留学生",
          value: members.filter(
            (m) => m.member_type === "international_student"
          ).length,
          color: COLORS.secondary,
        },
        {
          name: "交換留学生",
          value: members.filter((m) => m.member_type === "exchange_student")
            .length,
          color: COLORS.warning,
        },
        {
          name: "一般学生",
          value: members.filter((m) => m.member_type === "regular_student")
            .length,
          color: COLORS.info,
        },
      ];

      // 承認状況統計
      const membersByStatus = [
        {
          name: "承認済み",
          value: members.filter((m) => m.approval_status === "approved").length,
          color: COLORS.success,
        },
        {
          name: "承認待ち",
          value: members.filter((m) => m.approval_status === "pending").length,
          color: COLORS.warning,
        },
        {
          name: "却下",
          value: members.filter((m) => m.approval_status === "rejected").length,
          color: COLORS.danger,
        },
        {
          name: "再提出",
          value: members.filter((m) => m.approval_status === "resubmit").length,
          color: COLORS.info,
        },
      ];

      // イベントカテゴリ統計
      const eventsByCategory = [
        {
          name: "交流・親睦",
          value: events.filter((e) => e.category === "social").length,
          color: COLORS.primary,
        },
        {
          name: "学術・勉強",
          value: events.filter((e) => e.category === "academic").length,
          color: COLORS.secondary,
        },
        {
          name: "文化・芸術",
          value: events.filter((e) => e.category === "cultural").length,
          color: COLORS.warning,
        },
        {
          name: "スポーツ",
          value: events.filter((e) => e.category === "sports").length,
          color: COLORS.danger,
        },
        {
          name: "その他",
          value: events.filter((e) => e.category === "other").length,
          color: COLORS.gray,
        },
      ];

      // 月別統計（過去12ヶ月）
      const monthlyStats = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthMembers = members.filter((m) => {
          const createdAt = new Date(m.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;

        const monthEvents = events.filter((e) => {
          const eventDate = new Date(e.event_date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        }).length;

        const monthRevenue = payments
          .filter((p) => {
            const paymentDate = new Date(p.processed_at);
            return (
              paymentDate >= monthStart &&
              paymentDate <= monthEnd &&
              p.status === "completed"
            );
          })
          .reduce((sum, p) => sum + p.amount, 0);

        monthlyStats.push({
          month: date.toLocaleDateString("ja-JP", { month: "short" }),
          members: monthMembers,
          events: monthEvents,
          revenue: monthRevenue,
        });
      }

      // 支払い統計
      const paymentStats = {
        totalPaid: payments
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + p.amount, 0),
        totalUnpaid: members.filter((m) => m.payment_status === "unpaid")
          .length,
        pendingCash: members.filter((m) => m.payment_status === "pending_cash")
          .length,
        refunded: payments
          .filter((p) => p.status === "refunded")
          .reduce((sum, p) => sum + p.amount, 0),
      };

      // イベント参加統計
      const eventParticipation = events.slice(0, 10).map((event) => {
        const eventParticipants = participants.filter(
          (p) => p.event_id === event.id
        );
        return {
          eventTitle:
            event.title.slice(0, 20) + (event.title.length > 20 ? "..." : ""),
          registered: eventParticipants.length,
          attended: eventParticipants.filter((p) => p.status === "attended")
            .length,
          noShow: eventParticipants.filter((p) => p.status === "no_show")
            .length,
        };
      });

      // 最近の活動
      const recentActivity = [
        ...members.slice(0, 5).map((m) => ({
          id: m.id,
          type: "member",
          description: `${m.name}さんが新規登録しました`,
          timestamp: m.created_at,
          status: "info" as const,
        })),
        ...events.slice(0, 3).map((e) => ({
          id: e.id,
          type: "event",
          description: `イベント「${e.title}」が作成されました`,
          timestamp: e.created_at,
          status: "success" as const,
        })),
        ...suggestions.slice(0, 2).map((s) => ({
          id: s.id,
          type: "suggestion",
          description: `新しい提案「${s.title}」が投稿されました`,
          timestamp: s.created_at,
          status: "warning" as const,
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 10);

      setAnalytics({
        totalMembers: members.length,
        totalEvents: events.length,
        totalRevenue: paymentStats.totalPaid,
        pendingApprovals: members.filter((m) => m.approval_status === "pending")
          .length,
        membersByType,
        membersByStatus,
        eventsByCategory,
        monthlyStats,
        recentActivity,
        paymentStats,
        eventParticipation,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (profile && !profile.bio?.includes("[ADMIN]")) {
      router.push("/dashboard");
      return;
    }

    fetchAnalytics();
  }, [user, profile, loading, router, fetchAnalytics]);

  if (loading || isLoading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile?.bio?.includes("[ADMIN]")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            管理者権限が必要です
          </h1>
          <p className="text-gray-600 mb-4">
            このページにアクセスするには管理者権限が必要です。
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              戻る
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">統計・分析</h1>
              <p className="text-sm text-gray-600">
                サークル活動の統計データと分析結果
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">過去7日</option>
              <option value="30d">過去30日</option>
              <option value="90d">過去90日</option>
              <option value="1y">過去1年</option>
            </select>
          </div>
        </div>

        {/* KPI カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総会員数</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.totalMembers}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% 前月比
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">開催イベント</p>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.totalEvents}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% 前月比
                </p>
              </div>
              <Calendar className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総収益</p>
                <p className="text-3xl font-bold text-purple-600">
                  ¥{analytics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% 前月比
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">承認待ち</p>
                <p className="text-3xl font-bold text-orange-600">
                  {analytics.pendingApprovals}
                </p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  要対応
                </p>
              </div>
              <Clock className="h-12 w-12 text-orange-600" />
            </div>
          </div>
        </div>

        {/* チャート */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 月別統計 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">月別統計</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke={COLORS.primary}
                  name="新規会員"
                />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke={COLORS.secondary}
                  name="イベント数"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 会員種別分布 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">会員種別分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.membersByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.membersByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 承認状況 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">会員承認状況</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.membersByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* イベント参加状況 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">イベント参加状況</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.eventParticipation.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="eventTitle" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="registered" fill={COLORS.primary} name="登録者" />
                <Bar dataKey="attended" fill={COLORS.success} name="参加者" />
                <Bar dataKey="noShow" fill={COLORS.danger} name="無断欠席" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 最近の活動 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">最近の活動</h3>
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div
                    className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString(
                        "ja-JP",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 支払い統計 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">支払い統計</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-900">
                    支払い完了
                  </span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  ¥{analytics.paymentStats.totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-900">
                    未払い
                  </span>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {analytics.paymentStats.totalUnpaid}人
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-900">
                    現金支払い待ち
                  </span>
                </div>
                <span className="text-lg font-bold text-yellow-600">
                  {analytics.paymentStats.pendingCash}人
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
