"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { ArrowLeft, MessageSquare, Lightbulb, Send } from "lucide-react";

export default function SuggestionsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [activeTab, setActiveTab] = useState<"event_proposal" | "feedback">(
    "event_proposal"
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!title.trim() || !content.trim()) {
      setMessage("タイトルと内容を入力してください");
      setLoading(false);
      return;
    }

    try {
      // データベースに匿名提案を保存
      const { error: insertError } = await (supabase as any)
        .from("anonymous_suggestions")
        .insert({
          type: activeTab,
          title: title.trim(),
          content: content.trim(),
        });

      if (insertError) {
        console.error("Anonymous suggestion insert error:", insertError);
        throw insertError;
      }

      setMessage(
        "✅ 提案を受け付けました！運営に匿名で送信されました。ご協力ありがとうございます。"
      );

      // フォームをリセット
      setTitle("");
      setContent("");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "エラーが発生しました";
      setMessage("送信に失敗しました: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      key: "event_proposal" as const,
      title: "イベント提案",
      icon: Lightbulb,
      description: "新しいイベントのアイデアを提案",
    },
    {
      key: "feedback" as const,
      title: "フィードバック",
      icon: MessageSquare,
      description: "サークル活動へのご意見・改善案",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            戻る
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            匿名提案・フィードバック
          </h1>
        </div>

        {/* 説明 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h2 className="font-medium text-blue-900 mb-2">
            📢 運営への匿名メッセージ
          </h2>
          <p className="text-sm text-blue-800">
            サークル活動の改善のため、匿名でご意見やアイデアをお聞かせください。
            個人を特定されることなく、運営に直接伝わります。
          </p>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-1">
                {tabs.find((t) => t.key === activeTab)?.title}
              </h3>
              <p className="text-sm text-gray-600">
                {tabs.find((t) => t.key === activeTab)?.description}
              </p>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes("受け付けました") ||
                  message.includes("✅")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    activeTab === "event_proposal"
                      ? "例: 料理交流イベントの提案"
                      : "例: イベント参加の流れについて"
                  }
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    activeTab === "event_proposal"
                      ? "どのようなイベントを提案されますか？詳しく教えてください。"
                      : "改善点やご意見を詳しく教えてください。"
                  }
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  "送信中..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    匿名で送信
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">
            🔒 プライバシーについて
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 送信者の情報は一切記録されません</li>
            <li>• 運営は内容のみを確認し、個人を特定することはできません</li>
            <li>• 建設的なご意見・提案をお待ちしています</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
