"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
} from "lucide-react";

export default function CreateEventPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    max_participants: 20,
    participation_fee: 0,
    application_deadline: "",
    category: "social" as
      | "social"
      | "academic"
      | "cultural"
      | "sports"
      | "other",
    requires_approval: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      // バリデーション
      if (
        !formData.title ||
        !formData.event_date ||
        !formData.start_time ||
        !formData.end_time
      ) {
        throw new Error("必須項目を入力してください");
      }

      if (formData.start_time >= formData.end_time) {
        throw new Error("終了時間は開始時間より後に設定してください");
      }

      const eventDate = new Date(formData.event_date);
      if (eventDate < new Date()) {
        throw new Error("過去の日付は選択できません");
      }

      // 申込締切日のバリデーション
      if (formData.application_deadline) {
        const deadlineDate = new Date(formData.application_deadline);
        if (deadlineDate >= eventDate) {
          throw new Error("申込締切日はイベント開催日より前に設定してください");
        }
      }

      // イベントを作成
      const { data, error } = await (supabase.from("events") as any)
        .insert({
          ...formData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setMessage("イベントが正常に作成されました！");

      // 3秒後にイベント詳細ページに遷移
      setTimeout(() => {
        router.push(`/events/${data.id}`);
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "イベント作成に失敗しました";
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? parseInt(value) || 0
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              新しいイベントを作成
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("成功") || message.includes("作成")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* イベントタイトル */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <FileText className="inline h-4 w-4 mr-1" />
                イベントタイトル *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="例: 国際交流ランチミーティング"
              />
            </div>

            {/* 説明 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                イベント説明
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="イベントの詳細や目的を記載してください..."
              />
            </div>

            {/* 日付と時間 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="event_date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Calendar className="inline h-4 w-4 mr-1" />
                  開催日 *
                </label>
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  required
                  value={formData.event_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="start_time"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Clock className="inline h-4 w-4 mr-1" />
                  開始時間 *
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  required
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="end_time"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Clock className="inline h-4 w-4 mr-1" />
                  終了時間 *
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  required
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 場所と参加者数 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <MapPin className="inline h-4 w-4 mr-1" />
                  開催場所
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例: 学生食堂、オンライン"
                />
              </div>

              <div>
                <label
                  htmlFor="max_participants"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Users className="inline h-4 w-4 mr-1" />
                  最大参加者数
                </label>
                <input
                  type="number"
                  id="max_participants"
                  name="max_participants"
                  min="3"
                  max="100"
                  value={formData.max_participants}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 参加費と申込締切 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="participation_fee"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  参加費（円）
                </label>
                <input
                  type="number"
                  id="participation_fee"
                  name="participation_fee"
                  min="0"
                  value={formData.participation_fee}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0円の場合は無料イベントとして表示されます
                </p>
              </div>

              <div>
                <label
                  htmlFor="application_deadline"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  申込締切日
                </label>
                <input
                  type="date"
                  id="application_deadline"
                  name="application_deadline"
                  value={formData.application_deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  設定しない場合は開催日前日まで申込可能
                </p>
              </div>
            </div>

            {/* カテゴリと承認設定 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  カテゴリ
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="social">交流・親睦</option>
                  <option value="academic">学術・勉強</option>
                  <option value="cultural">文化・芸術</option>
                  <option value="sports">スポーツ</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requires_approval"
                  name="requires_approval"
                  checked={formData.requires_approval}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="requires_approval"
                  className="ml-2 block text-sm text-gray-900"
                >
                  参加に主催者の承認が必要
                </label>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                イベント作成のポイント
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 明確で魅力的なタイトルを付けましょう</li>
                <li>• イベントの目的や内容を詳しく説明しましょう</li>
                <li>• 参加者が集まりやすい日時を選択しましょう</li>
                <li>
                  • グループマッチングは参加者が3名以上集まってから実行できます
                </li>
              </ul>
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? "作成中..." : "イベントを作成"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
