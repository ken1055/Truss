"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
} from "lucide-react";

interface FiscalYear {
  id: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminFiscalYearsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [editingYear, setEditingYear] = useState<FiscalYear | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
    is_active: false,
  });

  const fetchFiscalYears = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("fiscal_years")
        .select("*")
        .order("year", { ascending: false });

      if (error) throw error;
      setFiscalYears(data as FiscalYear[]);
    } catch (error) {
      console.error("Error fetching fiscal years:", error);
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

    fetchFiscalYears();
  }, [user, profile, loading, router, fetchFiscalYears]);

  const generateFiscalYear = (year: number) => {
    const startDate = `${year}-04-01`;
    const endDate = `${year + 1}-03-31`;
    return { startDate, endDate };
  };

  const handleYearChange = (year: number) => {
    const { startDate, endDate } = generateFiscalYear(year);
    setFormData((prev) => ({
      ...prev,
      year,
      start_date: startDate,
      end_date: endDate,
    }));
  };

  const handleSave = async () => {
    try {
      // 同じ年度が既に存在するかチェック
      if (!editingYear) {
        const existingYear = fiscalYears.find(
          (fy) => fy.year === formData.year
        );
        if (existingYear) {
          alert("この年度は既に登録されています。");
          return;
        }
      }

      if (editingYear) {
        // 更新
        const { error } = await (supabase as any)
          .from("fiscal_years")
          .update({
            year: formData.year,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingYear.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await (supabase as any).from("fiscal_years").insert({
          year: formData.year,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_active: formData.is_active,
        });

        if (error) throw error;
      }

      setEditingYear(null);
      setIsCreating(false);
      setFormData({
        year: new Date().getFullYear(),
        start_date: "",
        end_date: "",
        is_active: false,
      });
      fetchFiscalYears();
      alert(
        editingYear ? "年度設定を更新しました。" : "新しい年度を作成しました。"
      );
    } catch (error) {
      console.error("Error saving fiscal year:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleEdit = (fiscalYear: FiscalYear) => {
    setEditingYear(fiscalYear);
    setFormData({
      year: fiscalYear.year,
      start_date: fiscalYear.start_date,
      end_date: fiscalYear.end_date,
      is_active: fiscalYear.is_active,
    });
    setIsCreating(false);
  };

  const handleDelete = async (fiscalYearId: string) => {
    if (
      !confirm(
        "この年度設定を削除しますか？関連する会費設定も削除される可能性があります。"
      )
    )
      return;

    try {
      const { error } = await (supabase as any)
        .from("fiscal_years")
        .delete()
        .eq("id", fiscalYearId);

      if (error) throw error;

      fetchFiscalYears();
      alert("年度設定を削除しました。");
    } catch (error) {
      console.error("Error deleting fiscal year:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleActivate = async (fiscalYearId: string) => {
    try {
      // まず全ての年度を非アクティブにする
      await (supabase as any).from("fiscal_years").update({ is_active: false });

      // 選択した年度をアクティブにする
      const { error } = await (supabase as any)
        .from("fiscal_years")
        .update({ is_active: true })
        .eq("id", fiscalYearId);

      if (error) throw error;

      fetchFiscalYears();
      alert("アクティブ年度を変更しました。");
    } catch (error) {
      console.error("Error activating fiscal year:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleCancel = () => {
    setEditingYear(null);
    setIsCreating(false);
    setFormData({
      year: new Date().getFullYear(),
      start_date: "",
      end_date: "",
      is_active: false,
    });
  };

  const handleCreateNew = () => {
    const currentYear = new Date().getFullYear();
    const { startDate, endDate } = generateFiscalYear(currentYear);
    setFormData({
      year: currentYear,
      start_date: startDate,
      end_date: endDate,
      is_active: false,
    });
    setIsCreating(true);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile.bio?.includes("[ADMIN]")) {
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
              <h1 className="text-2xl font-bold text-gray-900">年度管理</h1>
              <p className="text-sm text-gray-600">
                会計年度（4/1〜翌年3/31）の管理を行います
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            新規作成
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">総年度数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {fiscalYears.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">アクティブ年度</p>
                <p className="text-2xl font-bold text-green-600">
                  {fiscalYears.find((fy) => fy.is_active)?.year || "未設定"}年度
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-amber-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">現在の年度</p>
                <p className="text-2xl font-bold text-amber-600">
                  {new Date().getMonth() >= 3
                    ? new Date().getFullYear()
                    : new Date().getFullYear() - 1}
                  年度
                </p>
              </div>
            </div>
          </div>
        </div>

        {(isCreating || editingYear) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingYear ? "年度設定編集" : "新規年度作成"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年度
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    handleYearChange(
                      parseInt(e.target.value) || new Date().getFullYear()
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2020"
                  max="2050"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  例: 2024年度 = 2024年4月1日〜2025年3月31日
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了日
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-900"
                >
                  アクティブ年度に設定
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                保存
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    年度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fiscalYears.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      年度設定がありません。
                    </td>
                  </tr>
                ) : (
                  fiscalYears.map((fiscalYear) => (
                    <tr key={fiscalYear.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fiscalYear.year}年度
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fiscalYear.start_date} ～ {fiscalYear.end_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            fiscalYear.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {fiscalYear.is_active ? "アクティブ" : "非アクティブ"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(fiscalYear.created_at).toLocaleDateString(
                          "ja-JP"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!fiscalYear.is_active && (
                          <button
                            onClick={() => handleActivate(fiscalYear.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            アクティブ化
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(fiscalYear)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fiscalYear.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
