"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from "lucide-react";

interface FiscalYear {
  id: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface FeeMaster {
  id: string;
  fiscal_year_id: string;
  member_type:
    | "japanese_student"
    | "international_student"
    | "exchange_student"
    | "regular_student";
  fee_type: "admission" | "annual";
  amount: number;
  is_active: boolean;
  created_at: string;
  fiscal_year?: FiscalYear;
}

export default function AdminFeesPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [fees, setFees] = useState<FeeMaster[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [editingFee, setEditingFee] = useState<FeeMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    fiscal_year_id: "",
    member_type: "japanese_student" as
      | "japanese_student"
      | "international_student"
      | "exchange_student"
      | "regular_student",
    fee_type: "admission" as "admission" | "annual",
    amount: 0,
  });

  const fetchFees = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("fee_master")
        .select(
          `
          *,
          fiscal_year:fiscal_years(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFees(data as FeeMaster[]);
    } catch (error) {
      console.error("Error fetching fees:", error);
    }
  }, [user, supabase]);

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

    fetchFees();
    fetchFiscalYears();
  }, [user, profile, loading, router, fetchFees, fetchFiscalYears]);

  const handleSave = async () => {
    try {
      if (editingFee) {
        // 更新
        const { error } = await (supabase as any)
          .from("fee_master")
          .update({
            fiscal_year_id: formData.fiscal_year_id,
            member_type: formData.member_type,
            fee_type: formData.fee_type,
            amount: formData.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFee.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await (supabase as any).from("fee_master").insert({
          fiscal_year_id: formData.fiscal_year_id,
          member_type: formData.member_type,
          fee_type: formData.fee_type,
          amount: formData.amount,
          is_active: true,
        });

        if (error) throw error;
      }

      setEditingFee(null);
      setIsCreating(false);
      setFormData({
        fiscal_year_id: "",
        member_type: "japanese_student" as
          | "japanese_student"
          | "international_student"
          | "exchange_student"
          | "regular_student",
        fee_type: "admission" as "admission" | "annual",
        amount: 0,
      });
      fetchFees();
      alert(
        editingFee
          ? "会費設定を更新しました。"
          : "新しい会費設定を作成しました。"
      );
    } catch (error) {
      console.error("Error saving fee:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleEdit = (fee: FeeMaster) => {
    setEditingFee(fee);
    setFormData({
      fiscal_year_id: fee.fiscal_year_id,
      member_type: fee.member_type,
      fee_type: fee.fee_type,
      amount: fee.amount,
    });
    setIsCreating(false);
  };

  const handleDelete = async (feeId: string) => {
    if (!confirm("この会費設定を削除しますか？")) return;

    try {
      const { error } = await (supabase as any)
        .from("fee_master")
        .delete()
        .eq("id", feeId);

      if (error) throw error;

      fetchFees();
      alert("会費設定を削除しました。");
    } catch (error) {
      console.error("Error deleting fee:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleCancel = () => {
    setEditingFee(null);
    setIsCreating(false);
    setFormData({
      fiscal_year_id: "",
      member_type: "japanese_student" as
        | "japanese_student"
        | "international_student"
        | "exchange_student"
        | "regular_student",
      fee_type: "admission" as "admission" | "annual",
      amount: 0,
    });
  };

  const getMemberTypeLabel = (type: string) => {
    switch (type) {
      case "japanese_student":
        return "日本人学生";
      case "international_student":
        return "正規留学生";
      case "exchange_student":
        return "交換留学生";
      case "regular_student":
        return "一般学生";
      default:
        return type;
    }
  };

  const getFeeTypeLabel = (type: string) => {
    switch (type) {
      case "admission":
        return "入会費";
      case "annual":
        return "年会費";
      default:
        return type;
    }
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
              <h1 className="text-2xl font-bold text-gray-900">
                会費マスタ管理
              </h1>
              <p className="text-sm text-gray-600">
                年度・会員区分別の会費設定を管理します
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            新規作成
          </button>
        </div>

        {(isCreating || editingFee) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingFee ? "会費設定編集" : "新規会費設定"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年度
                </label>
                <select
                  value={formData.fiscal_year_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fiscal_year_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">年度を選択</option>
                  {fiscalYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year}年度 ({year.start_date} ～ {year.end_date})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会員区分
                </label>
                <select
                  value={formData.member_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      member_type: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="japanese_student">日本人学生</option>
                  <option value="international_student">正規留学生</option>
                  <option value="exchange_student">交換留学生</option>
                  <option value="regular_student">一般学生</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会費種別
                </label>
                <select
                  value={formData.fee_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fee_type: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admission">入会費</option>
                  <option value="annual">年会費</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  金額（円）
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
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
                    会員区分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会費種別
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      会費設定がありません。
                    </td>
                  </tr>
                ) : (
                  fees.map((fee) => (
                    <tr key={fee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fee.fiscal_year?.year}年度
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getMemberTypeLabel(fee.member_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getFeeTypeLabel(fee.fee_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{fee.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            fee.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {fee.is_active ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(fee)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
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
