"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { MemberProfile } from "@/lib/types";
// import type { Language, UserLanguage, Availability } from "@/lib/supabase";
import { ArrowLeft, Plus, Trash2, Save, Clock } from "lucide-react";

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

  const dayNames = [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ];
  const proficiencyLevels = [
    { value: "beginner", label: "初級" },
    { value: "intermediate", label: "中級" },
    { value: "advanced", label: "上級" },
    { value: "native", label: "ネイティブ" },
  ];

  useEffect(() => {
    // デモモードでは認証チェックをスキップ
    if (!loading && !user && process.env.NODE_ENV !== "development") {
      router.push("/signin");
      return;
    }

    // プロフィール情報の設定（デモモード対応）
    const demoProfile = {
      full_name: "デモユーザー",
      department: "情報工学科",
      grade: 3,
      phone_number: "090-1234-5678",
    };

    const displayProfile = profile || demoProfile;
    setFormData({
      full_name: displayProfile.full_name || "",
      department: displayProfile.department || "",
      grade: displayProfile.grade || 1,
      phone_number: displayProfile.phone_number || "",
    });

    // デモモードでのダミーデータ設定
    const demoLanguages = [
      { id: "1", name: "日本語", code: "ja" },
      { id: "2", name: "英語", code: "en" },
      { id: "3", name: "中国語", code: "zh" },
      { id: "4", name: "韓国語", code: "ko" },
      { id: "5", name: "フランス語", code: "fr" },
    ];

    const demoUserLanguages = [
      {
        id: "1",
        user_id: "demo",
        language_id: "1",
        proficiency_level: "native" as const,
        language: { id: "1", name: "日本語", code: "ja" },
      },
      {
        id: "2",
        user_id: "demo",
        language_id: "2",
        proficiency_level: "intermediate" as const,
        language: { id: "2", name: "英語", code: "en" },
      },
    ];

    const demoAvailability = [
      {
        id: "1",
        user_id: "demo",
        day_of_week: 1,
        start_time: "10:00",
        end_time: "12:00",
      },
      {
        id: "2",
        user_id: "demo",
        day_of_week: 3,
        start_time: "14:00",
        end_time: "16:00",
      },
    ];

    // データの取得（デモモードではダミーデータを使用）
    const fetchData = async () => {
      if (user) {
        // 実際のユーザーの場合のみデータベースにアクセス
        try {
          // 言語一覧の取得
          const { data: languagesData } = await supabase
            .from("languages")
            .select("*")
            .order("name");
          setLanguages(languagesData || demoLanguages);

          // ユーザー言語スキルの取得
          const { data: userLanguagesData } = await supabase
            .from("user_languages")
            .select("*, language:languages(*)")
            .eq("user_id", user.id);
          setUserLanguages(
            (userLanguagesData as UserLanguage[]) || demoUserLanguages
          );

          // 空き時間の取得
          const { data: availabilityData } = await supabase
            .from("availability")
            .select("*")
            .eq("user_id", user.id)
            .order("day_of_week")
            .order("start_time");
          setAvailability(availabilityData || demoAvailability);
        } catch (error) {
          console.log("Error fetching data, using demo data:", error);
          setLanguages(demoLanguages);
          setUserLanguages(demoUserLanguages);
          setAvailability(demoAvailability);
        }
      } else {
        // デモモード - ダミーデータを直接設定
        console.log("Demo mode: Using dummy data");
        setLanguages(demoLanguages);
        setUserLanguages(demoUserLanguages);
        setAvailability(demoAvailability);
      }
    };

    fetchData();
  }, [user, profile, loading, router]); // supabaseを依存配列から削除

  const handleSaveProfile = async () => {
    setSaving(true);

    if (!user) {
      // デモモード
      setMessage(
        "✨ デモモード: プロフィールの更新を確認しました！実際のサービスではここでデータが保存されます。"
      );
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

  const addLanguage = async (languageId: string, proficiencyLevel: string) => {
    if (!user) {
      // デモモード
      setMessage(
        "✨ デモモード: 言語の追加を確認しました！実際のサービスではここで言語が追加されます。"
      );
      return;
    }

    try {
      const { error } = await (supabase.from("user_languages") as any).insert({
        user_id: user.id,
        language_id: languageId,
        proficiency_level: proficiencyLevel as
          | "beginner"
          | "intermediate"
          | "advanced"
          | "native",
      });

      if (error) throw error;

      // 再取得
      const { data } = await supabase
        .from("user_languages")
        .select("*, language:languages(*)")
        .eq("user_id", user.id);
      if (data) setUserLanguages(data as UserLanguage[]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessage("言語の追加に失敗しました: " + errorMessage);
    }
  };

  const removeLanguage = async (id: string) => {
    if (!user) {
      // デモモード
      setMessage(
        "✨ デモモード: 言語の削除を確認しました！実際のサービスではここで言語が削除されます。"
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("user_languages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setUserLanguages((prev) => prev.filter((lang) => lang.id !== id));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessage("言語の削除に失敗しました: " + errorMessage);
    }
  };

  const addAvailability = async (
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => {
    if (!user) {
      // デモモード
      setMessage(
        "✨ デモモード: 空き時間の追加を確認しました！実際のサービスではここで空き時間が追加されます。"
      );
      return;
    }

    try {
      const { error } = await (supabase.from("availability") as any).insert({
        user_id: user.id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      });

      if (error) throw error;

      // 再取得
      const { data } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week")
        .order("start_time");
      if (data) setAvailability(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessage("空き時間の追加に失敗しました: " + errorMessage);
    }
  };

  const removeAvailability = async (id: string) => {
    if (!user) {
      // デモモード
      setMessage(
        "✨ デモモード: 空き時間の削除を確認しました！実際のサービスではここで空き時間が削除されます。"
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAvailability((prev) => prev.filter((avail) => avail.id !== id));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessage("空き時間の削除に失敗しました: " + errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // デモモードでは表示を続行
  if (!loading && !user && process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* デモモード通知 */}
      <div className="bg-yellow-100 border-b px-4 py-2 text-center text-sm text-yellow-800">
        📝 デモモード - 実際のデータは保存されません
      </div>

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
          <h1 className="text-xl font-bold text-gray-900">プロフィール設定</h1>
        </div>
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes("成功") || message.includes("更新")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">基本情報</h2>

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
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "基本情報を保存"}
          </button>
        </div>

        {/* 言語スキル */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">言語スキル</h2>

          {/* 言語追加フォーム */}
          <LanguageAddForm
            languages={languages}
            userLanguages={userLanguages}
            proficiencyLevels={proficiencyLevels}
            onAdd={addLanguage}
          />

          {/* 登録済み言語一覧 */}
          <div className="mt-6 space-y-3">
            {userLanguages.map((userLang) => (
              <div
                key={userLang.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{userLang.language.name}</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                    {
                      proficiencyLevels.find(
                        (level) => level.value === userLang.proficiency_level
                      )?.label
                    }
                  </span>
                </div>
                <button
                  onClick={() => removeLanguage(userLang.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 空き時間 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">空き時間</h2>

          {/* 空き時間追加フォーム */}
          <AvailabilityAddForm onAdd={addAvailability} />

          {/* 登録済み空き時間一覧 */}
          <div className="mt-6 space-y-3">
            {availability.map((avail) => (
              <div
                key={avail.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">
                    {dayNames[avail.day_of_week]}
                  </span>
                  <span className="text-gray-600">
                    {avail.start_time} - {avail.end_time}
                  </span>
                </div>
                <button
                  onClick={() => removeAvailability(avail.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 言語追加フォームコンポーネント
function LanguageAddForm({
  languages,
  userLanguages,
  proficiencyLevels,
  onAdd,
}: {
  languages: Language[];
  userLanguages: UserLanguage[];
  proficiencyLevels: { value: string; label: string }[];
  onAdd: (languageId: string, proficiencyLevel: string) => void;
}) {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedProficiency, setSelectedProficiency] = useState("");

  const availableLanguages = languages.filter(
    (lang) =>
      !userLanguages.some((userLang) => userLang.language_id === lang.id)
  );

  const handleAdd = () => {
    if (selectedLanguage && selectedProficiency) {
      onAdd(selectedLanguage, selectedProficiency);
      setSelectedLanguage("");
      setSelectedProficiency("");
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-40">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          言語
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">選択してください</option>
          {availableLanguages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-32">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          レベル
        </label>
        <select
          value={selectedProficiency}
          onChange={(e) => setSelectedProficiency(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">選択してください</option>
          {proficiencyLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAdd}
        disabled={!selectedLanguage || !selectedProficiency}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        <Plus className="h-4 w-4 mr-1" />
        追加
      </button>
    </div>
  );
}

// 空き時間追加フォームコンポーネント
function AvailabilityAddForm({
  onAdd,
}: {
  onAdd: (dayOfWeek: number, startTime: string, endTime: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const dayNames = [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ];

  const handleAdd = () => {
    if (selectedDay && startTime && endTime) {
      onAdd(parseInt(selectedDay), startTime, endTime);
      setSelectedDay("");
      setStartTime("");
      setEndTime("");
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-32">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          曜日
        </label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">選択してください</option>
          {dayNames.map((day, index) => (
            <option key={index} value={index}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-28">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          開始時間
        </label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex-1 min-w-28">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          終了時間
        </label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={!selectedDay || !startTime || !endTime}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        <Plus className="h-4 w-4 mr-1" />
        追加
      </button>
    </div>
  );
}
