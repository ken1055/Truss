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
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    full_name: "",
    department: "",
    grade: 1,
    phone_number: "",
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
        full_name: profile.full_name || "",
        department: profile.department || "",
        grade: profile.grade || 1,
        phone_number: profile.phone_number || "",
      });
    }

    // データの取得
    const fetchData = async () => {
      if (user) {
        try {
          // 言語データの取得
          const { data: languagesData } = await supabase
            .from("languages")
            .select("*")
            .order("name");
          setLanguages(languagesData || []);

          // ユーザー言語スキルの取得
          const { data: userLanguagesData } = await supabase
            .from("user_languages")
            .select(`
              *,
              language:languages(*)
            `)
            .eq("user_id", user.id);
          setUserLanguages(userLanguagesData || []);

          // 空き時間の取得
          const { data: availabilityData } = await supabase
            .from("availability")
            .select("*")
            .eq("user_id", user.id)
            .order("day_of_week");
          setAvailability(availabilityData || []);
        } catch (error) {
          console.error("データ取得エラー:", error);
        }
      }
    };

    fetchData();
  }, [user, profile, loading, router, supabase]);

  const handleSaveProfile = async () => {
    setSaving(true);

    if (!user) {
      setMessage("ユーザーが認証されていません。");
      setSaving(false);
      return;
    }

    try {
      const { error } = await (supabase.from("member_profiles") as any).upsert({
        user_id: user.id,
        ...formData,
      });

      if (error) throw error;
      setMessage("プロフィールを更新しました");
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学部・学科
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, department: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学年
              </label>
              <select
                value={formData.grade}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, grade: parseInt(e.target.value) }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1年生</option>
                <option value={2}>2年生</option>
                <option value={3}>3年生</option>
                <option value={4}>4年生</option>
                <option value={5}>5年生</option>
                <option value={6}>6年生</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-6 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        {/* 言語スキル */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">言語スキル</h2>
          
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
                    <span className="font-medium">{userLang.language.name}</span>
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
                      {["日", "月", "火", "水", "木", "金", "土"][avail.day_of_week]}曜日
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