"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";

interface Member {
  id: string;
  email: string;
  name: string;
  student_type: "international" | "domestic";
  student_id?: string;
  phone?: string;
  department?: string;
  grade?: string;
  bio?: string;
  approval_status: "pending" | "approved" | "rejected" | "resubmit";
  payment_status: "unpaid" | "pending_cash" | "paid_stripe" | "paid_cash";
  created_at: string;
  updated_at: string;
}

export default function AdminMembersPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    // 管理者権限チェック
    if (profile && !profile.bio?.includes("[ADMIN]")) {
      router.push("/dashboard");
      return;
    }

    fetchMembers();
  }, [user, profile, loading, router, supabase]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // デモデータを含めて表示
      const membersWithDefaults = (data || []).map((member: any) => ({
        ...member,
        approval_status: member.approval_status || "pending",
        payment_status: member.payment_status || "unpaid",
        student_type: member.student_type || "international",
      }));

      setMembers(membersWithDefaults);
      setFilteredMembers(membersWithDefaults);
    } catch (error) {
      console.error("会員データの取得に失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberStatus = async (
    memberId: string,
    status: "approved" | "rejected" | "resubmit"
  ) => {
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ 
          approval_status: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", memberId);

      if (error) throw error;

      // ローカル状態を更新
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? { ...member, approval_status: status }
            : member
        )
      );
      
      setSelectedMember(null);
      alert(`会員の承認状況を「${getStatusLabel(status)}」に更新しました。`);
    } catch (error) {
      console.error("承認状況の更新に失敗しました:", error);
      alert("承認状況の更新に失敗しました。");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "審査中";
      case "approved":
        return "承認済み";
      case "rejected":
        return "却下";
      case "resubmit":
        return "再提出要求";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "approved":
        return "text-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      case "resubmit":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "unpaid":
        return "未払い";
      case "pending_cash":
        return "現金支払い待ち";
      case "paid_stripe":
        return "カード決済完了";
      case "paid_cash":
        return "現金入金確認済";
      default:
        return status;
    }
  };

  const filterMembers = (search: string, status: string) => {
    let filtered = members;

    if (search) {
      filtered = filtered.filter(
        (member) =>
          member.name?.toLowerCase().includes(search.toLowerCase()) ||
          member.email?.toLowerCase().includes(search.toLowerCase()) ||
          member.student_id?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== "all") {
      filtered = filtered.filter((member) => member.approval_status === status);
    }

    setFilteredMembers(filtered);
  };

  useEffect(() => {
    filterMembers(searchTerm, statusFilter);
  }, [searchTerm, statusFilter, members]);

  if (!loading && !user) {
    return null;
  }

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
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-600" />
              会員管理
            </h1>
            <p className="text-sm text-gray-600">
              会員の承認・管理を行います
            </p>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="名前、メール、学籍番号で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全ての状況</option>
                <option value="pending">審査中</option>
                <option value="approved">承認済み</option>
                <option value="rejected">却下</option>
                <option value="resubmit">再提出要求</option>
              </select>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                CSV出力
              </button>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">総会員数</p>
              <p className="text-2xl font-bold text-blue-600">{members.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">審査中</p>
              <p className="text-2xl font-bold text-yellow-600">
                {members.filter((m) => m.approval_status === "pending").length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">承認済み</p>
              <p className="text-2xl font-bold text-green-600">
                {members.filter((m) => m.approval_status === "approved").length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">要対応</p>
              <p className="text-2xl font-bold text-red-600">
                {
                  members.filter(
                    (m) =>
                      m.approval_status === "rejected" ||
                      m.approval_status === "resubmit"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        {/* 会員一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              会員一覧 ({filteredMembers.length}件)
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">該当する会員が見つかりません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会員情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      区分
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      承認状況
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      支払状況
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.name || "未設定"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.email}
                          </div>
                          {member.student_id && (
                            <div className="text-xs text-gray-400">
                              学籍番号: {member.student_id}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.student_type === "international"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {member.student_type === "international"
                            ? "留学生"
                            : "日本人学生"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            member.approval_status
                          )}`}
                        >
                          {getStatusLabel(member.approval_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getPaymentStatusLabel(member.payment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.created_at).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {member.approval_status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                updateMemberStatus(member.id, "approved")
                              }
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                updateMemberStatus(member.id, "rejected")
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 会員詳細モーダル */}
        {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    会員詳細
                  </h3>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      氏名
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedMember.name || "未設定"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      メールアドレス
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedMember.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      学籍番号
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedMember.student_id || "未設定"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      電話番号
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedMember.phone || "未設定"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      学部・学科
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedMember.department || "未設定"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      学年
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedMember.grade || "未設定"}
                    </p>
                  </div>

                  {selectedMember.approval_status === "pending" && (
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={() =>
                          updateMemberStatus(selectedMember.id, "approved")
                        }
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                      >
                        承認する
                      </button>
                      <button
                        onClick={() =>
                          updateMemberStatus(selectedMember.id, "resubmit")
                        }
                        className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"
                      >
                        再提出要求
                      </button>
                      <button
                        onClick={() =>
                          updateMemberStatus(selectedMember.id, "rejected")
                        }
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                      >
                        却下する
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
