"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { MemberProfile } from "@/lib/types";
import { ArrowLeft, Save } from "lucide-react";

// 一時的な型定義
interface Language {
  id: string;
  name: string;
  code: string;
}

interface UserLanguage {
  id: string;
  user_id: string;
  language_id: string;
  proficiency_level: "beginner" | "intermediate" | "advanced" | "native";
  language: Language;
}

interface Availability {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export default function ProfilePage() {
  const { user, profile, loading, createProfile } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    name: "",
    student_type: "international" as "international" | "domestic",
    gender: undefined as
      | "male"
      | "female"
      | "other"
      | "prefer_not_to_say"
      | undefined,
    bio: "",
  });

  const [languages, setLanguages] = useState<Language[]>([]);
  const [userLanguages, setUserLanguages] = useState<UserLanguage[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (profile) {
      setFormData({
        name: profile.name || "",
        student_type: profile.student_type || "international",
        gender: profile.gender || undefined,
        bio: profile.bio || "",
      });
    } else if (user) {
      // プロフィールが存在しない場合、ユーザー情報から初期値を設定
      setFormData({
        name: user.user_metadata?.name || user.email?.split("@")[0] || "",
        student_type: user.user_metadata?.student_type || "international",
        gender: undefined,
        bio: "",
      });
    }
  }, [user, profile, loading, router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage("");

    if (!user) {
      setMessage("ユーザーが認証されていません。");
      setSaving(false);
      return;
    }

    // フォームバリデーション
    if (!formData.name?.trim()) {
      setMessage("お名前は必須項目です。");
      setSaving(false);
      return;
    }

    if (!formData.student_type) {
      setMessage("学生区分は必須項目です。");
      setSaving(false);
      return;
    }

    try {
      if (profile) {
        // プロフィールが存在する場合は更新
        const { error } = await (supabase as any)
          .from("profiles")
          .update(formData)
          .eq("id", user.id);

        if (error) throw error;
        setMessage("プロフィールを更新しました");
      } else {
        // プロフィールが存在しない場合は作成
        console.log("Profile page: Creating profile with data:", formData);
        const success = await createProfile(formData);
        if (success) {
          setMessage("プロフィールを作成しました！ダッシュボードに戻ります...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          setMessage(
            "プロフィールの作成に失敗しました。コンソールでエラーの詳細を確認してください。"
          );
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessage("エラーが発生しました: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="mr-3 p-2 hover:bg-gray-200 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">プロフィール設定</h1>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {profile ? "プロフィール編集" : "プロフィール作成"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学生区分 *
              </label>
              <select
                value={formData.student_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    student_type: e.target.value as
                      | "international"
                      | "domestic",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="international">留学生</option>
                <option value="domestic">在校生</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別
              </label>
              <select
                value={formData.gender || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gender: e.target.value || (undefined as any),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
                <option value="prefer_not_to_say">回答しない</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自己紹介
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="趣味や興味のあることなどを自由に書いてください"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-6 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving
              ? profile
                ? "更新中..."
                : "作成中..."
              : profile
              ? "更新"
              : "作成"}
          </button>
        </div>

        {/* 言語スキル */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            言語スキル
          </h2>

          {userLanguages.length === 0 ? (
            <p className="text-gray-500">言語スキルが登録されていません</p>
          ) : (
            <div className="space-y-2">
              {userLanguages.map((userLang) => (
                <div
                  key={userLang.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">
                      {userLang.language.name}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      ({userLang.proficiency_level})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 空き時間 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">空き時間</h2>

          {availability.length === 0 ? (
            <p className="text-gray-500">空き時間が登録されていません</p>
          ) : (
            <div className="space-y-2">
              {availability.map((avail) => (
                <div
                  key={avail.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">
                      {
                        ["日", "月", "火", "水", "木", "金", "土"][
                          avail.day_of_week
                        ]
                      }
                      曜日
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {avail.start_time} - {avail.end_time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
