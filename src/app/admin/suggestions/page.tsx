"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import {
  ArrowLeft,
  MessageSquare,
  Lightbulb,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Reply,
} from "lucide-react";

interface AnonymousSuggestion {
  id: string;
  type: "event_proposal" | "feedback";
  title: string;
  content: string;
  status: "pending" | "reviewed" | "implemented" | "rejected";
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminSuggestionsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [suggestions, setSuggestions] = useState<AnonymousSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AnonymousSuggestion | null>(null);
  const [response, setResponse] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "reviewed">(
    "pending"
  );

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

    const fetchSuggestions = async () => {
      // デモ用データ
      const demoSuggestions: AnonymousSuggestion[] = [
        {
          id: "1",
          type: "event_proposal",
          title: "料理交流イベントの提案",
          content:
            "留学生が自国の料理を紹介し、在校生と一緒に作るイベントはどうでしょうか？文化交流にもなりますし、楽しく交流できると思います。",
          status: "pending",
          created_at: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "2",
          type: "feedback",
          title: "イベント参加の流れについて",
          content:
            "イベント参加の手続きがもう少し分かりやすくなると良いと思います。初回参加者向けのガイドがあると助かります。",
          status: "pending",
          created_at: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "3",
          type: "event_proposal",
          title: "オンライン交流会の提案",
          content:
            "遠隔地の学生も参加できるオンライン交流会があると良いと思います。",
          status: "reviewed",
          admin_response:
            "素晴らしいアイデアです！次回のイベント企画に取り入れさせていただきます。",
          created_at: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      if (user) {
        try {
          const { data } = await supabase
            .from("anonymous_suggestions")
            .select("*")
            .order("created_at", { ascending: false });

          setSuggestions(data || demoSuggestions);
        } catch (error) {
          console.log("Demo mode: Using dummy suggestions");
          setSuggestions(demoSuggestions);
        }
      } else {
        // デモモード
        setSuggestions(demoSuggestions);
      }
    };

    fetchSuggestions();
  }, [user, profile, loading, router, supabase]);

  const updateSuggestionStatus = async (
    suggestionId: string,
    status: AnonymousSuggestion["status"],
    adminResponse?: string
  ) => {
    setUpdatingStatus(true);

    try {
      if (!user) {
        // デモモード
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId
              ? {
                  ...s,
                  status,
                  admin_response: adminResponse,
                  updated_at: new Date().toISOString(),
                }
              : s
          )
        );
        alert("✨ デモモード: ステータスを更新しました！");
      } else {
        const { error } = await (supabase.from("anonymous_suggestions") as any)
          .update({
            status,
            admin_response: adminResponse,
            updated_at: new Date().toISOString(),
          })
          .eq("id", suggestionId);

        if (error) throw error;

        // ローカル状態を更新
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestionId
              ? {
                  ...s,
                  status,
                  admin_response: adminResponse,
                  updated_at: new Date().toISOString(),
                }
              : s
          )
        );
      }

      setSelectedSuggestion(null);
      setResponse("");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "エラーが発生しました";
      alert("更新に失敗しました: " + errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return s.status === "pending";
    if (activeTab === "reviewed") return s.status !== "pending";
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: AnonymousSuggestion["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "reviewed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "implemented":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: AnonymousSuggestion["status"]) => {
    switch (status) {
      case "pending":
        return "未確認";
      case "reviewed":
        return "確認済み";
      case "implemented":
        return "実装済み";
      case "rejected":
        return "却下";
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* デモモード通知 */}
      <div className="bg-yellow-100 border-b px-4 py-2 text-center text-sm text-yellow-800">
        📝 デモモード - 実際のデータは保存されません
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            戻る
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            提案・フィードバック管理
          </h1>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                {
                  key: "pending" as const,
                  label: "未確認",
                  count: suggestions.filter((s) => s.status === "pending")
                    .length,
                },
                {
                  key: "reviewed" as const,
                  label: "確認済み",
                  count: suggestions.filter((s) => s.status !== "pending")
                    .length,
                },
                {
                  key: "all" as const,
                  label: "全て",
                  count: suggestions.length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 提案一覧 */}
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-colors ${
                  selectedSuggestion?.id === suggestion.id
                    ? "ring-2 ring-blue-500"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedSuggestion(suggestion)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {suggestion.type === "event_proposal" ? (
                      <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-blue-500 mr-2" />
                    )}
                    <span className="text-xs text-gray-500 uppercase">
                      {suggestion.type === "event_proposal"
                        ? "イベント提案"
                        : "フィードバック"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(suggestion.status)}
                    <span className="text-xs text-gray-500 ml-1">
                      {getStatusText(suggestion.status)}
                    </span>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {suggestion.content}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(suggestion.created_at)}
                </p>
              </div>
            ))}

            {filteredSuggestions.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  該当する提案・フィードバックはありません
                </p>
              </div>
            )}
          </div>

          {/* 詳細・返信パネル */}
          <div className="bg-white rounded-lg shadow">
            {selectedSuggestion ? (
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {selectedSuggestion.type === "event_proposal" ? (
                      <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-blue-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-500 uppercase">
                      {selectedSuggestion.type === "event_proposal"
                        ? "イベント提案"
                        : "フィードバック"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(selectedSuggestion.status)}
                    <span className="text-sm text-gray-500 ml-1">
                      {getStatusText(selectedSuggestion.status)}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {selectedSuggestion.title}
                </h2>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {selectedSuggestion.content}
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  投稿日時: {formatDate(selectedSuggestion.created_at)}
                </p>

                {selectedSuggestion.admin_response && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <Reply className="h-4 w-4 mr-2" />
                      運営からの返信
                    </h4>
                    <p className="text-blue-800 text-sm">
                      {selectedSuggestion.admin_response}
                    </p>
                  </div>
                )}

                {selectedSuggestion.status === "pending" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      運営からの返信
                    </h4>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                      placeholder="返信内容を入力してください（任意）"
                    />

                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          updateSuggestionStatus(
                            selectedSuggestion.id,
                            "reviewed",
                            response
                          )
                        }
                        disabled={updatingStatus}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        確認済みにする
                      </button>
                      <button
                        onClick={() =>
                          updateSuggestionStatus(
                            selectedSuggestion.id,
                            "implemented",
                            response
                          )
                        }
                        disabled={updatingStatus}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        実装済みにする
                      </button>
                      <button
                        onClick={() =>
                          updateSuggestionStatus(
                            selectedSuggestion.id,
                            "rejected",
                            response
                          )
                        }
                        disabled={updatingStatus}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                      >
                        却下する
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  提案を選択して詳細を確認してください
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
