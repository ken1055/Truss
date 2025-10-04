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
  Shield,
  Users,
  Settings,
} from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role_name: string;
  permissions: string[];
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  assigned_by_user?: {
    id: string;
    name: string;
  };
}

interface RoleDefinition {
  name: string;
  description: string;
  permissions: string[];
  color: string;
}

const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  admin: {
    name: "管理者",
    description: "システム全体の管理権限",
    permissions: ["all"],
    color: "red",
  },
  treasurer: {
    name: "会計担当",
    description: "会費・支払い管理権限",
    permissions: ["manage_payments", "view_financial_reports", "manage_fees"],
    color: "green",
  },
  event_manager: {
    name: "イベント主催者",
    description: "イベント作成・管理権限",
    permissions: ["create_events", "manage_events", "view_participants"],
    color: "blue",
  },
  moderator: {
    name: "モデレーター",
    description: "コンテンツ管理・ユーザーサポート",
    permissions: ["manage_suggestions", "moderate_content", "support_users"],
    color: "purple",
  },
  member: {
    name: "一般会員",
    description: "基本的な会員権限",
    permissions: ["view_events", "join_events", "submit_suggestions"],
    color: "gray",
  },
};

const PERMISSION_LABELS: Record<string, string> = {
  all: "全権限",
  manage_payments: "支払い管理",
  view_financial_reports: "財務レポート閲覧",
  manage_fees: "会費設定管理",
  create_events: "イベント作成",
  manage_events: "イベント管理",
  view_participants: "参加者情報閲覧",
  manage_suggestions: "提案・フィードバック管理",
  moderate_content: "コンテンツモデレーション",
  support_users: "ユーザーサポート",
  view_events: "イベント閲覧",
  join_events: "イベント参加",
  submit_suggestions: "提案・フィードバック投稿",
};

export default function AdminRolesPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    role_name: "member",
    custom_permissions: [] as string[],
    is_active: true,
  });

  const fetchUserRoles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(
          `
          *,
          user:profiles!user_roles_user_id_fkey(id, name, email),
          assigned_by_user:profiles!user_roles_assigned_by_fkey(id, name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserRoles(data as UserRole[]);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  }, [user, supabase]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .order("name");

      if (error) throw error;
      setUsers(data as Array<{ id: string; name: string; email: string }>);
    } catch (error) {
      console.error("Error fetching users:", error);
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

    fetchUserRoles();
    fetchUsers();
  }, [user, profile, loading, router, fetchUserRoles, fetchUsers]);

  const handleSave = async () => {
    try {
      const roleDefinition = ROLE_DEFINITIONS[formData.role_name];
      const permissions = roleDefinition
        ? roleDefinition.permissions
        : formData.custom_permissions;

      if (editingRole) {
        // 更新
        const { error } = await (supabase as any)
          .from("user_roles")
          .update({
            role_name: formData.role_name,
            permissions,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRole.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await (supabase as any).from("user_roles").insert({
          user_id: formData.user_id,
          role_name: formData.role_name,
          permissions,
          assigned_by: user.id,
          is_active: formData.is_active,
        });

        if (error) throw error;
      }

      setEditingRole(null);
      setIsCreating(false);
      setFormData({
        user_id: "",
        role_name: "member",
        custom_permissions: [],
        is_active: true,
      });
      fetchUserRoles();
      alert(
        editingRole ? "役割を更新しました。" : "新しい役割を割り当てました。"
      );
    } catch (error) {
      console.error("Error saving role:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleEdit = (userRole: UserRole) => {
    setEditingRole(userRole);
    setFormData({
      user_id: userRole.user_id,
      role_name: userRole.role_name,
      custom_permissions: userRole.permissions,
      is_active: userRole.is_active,
    });
    setIsCreating(false);
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm("この役割割り当てを削除しますか？")) return;

    try {
      const { error } = await (supabase as any)
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      fetchUserRoles();
      alert("役割割り当てを削除しました。");
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleToggleActive = async (roleId: string, isActive: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("user_roles")
        .update({ is_active: !isActive })
        .eq("id", roleId);

      if (error) throw error;

      fetchUserRoles();
      alert(`役割を${!isActive ? "有効" : "無効"}にしました。`);
    } catch (error) {
      console.error("Error toggling role status:", error);
      alert("エラーが発生しました。");
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
    setIsCreating(false);
    setFormData({
      user_id: "",
      role_name: "member",
      custom_permissions: [],
      is_active: true,
    });
  };

  const getRoleDefinition = (roleName: string) => {
    return (
      ROLE_DEFINITIONS[roleName] || {
        name: roleName,
        description: "カスタム役割",
        permissions: [],
        color: "gray",
      }
    );
  };

  const getPermissionLabels = (permissions: string[]) => {
    return permissions.map((p) => PERMISSION_LABELS[p] || p).join(", ");
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
                役割・権限管理
              </h1>
              <p className="text-sm text-gray-600">
                ユーザーの役割と権限を管理します
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            役割を割り当て
          </button>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">総ユーザー数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">管理者</p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    userRoles.filter(
                      (r) => r.role_name === "admin" && r.is_active
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">アクティブ役割</p>
                <p className="text-2xl font-bold text-green-600">
                  {userRoles.filter((r) => r.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">特別権限</p>
                <p className="text-2xl font-bold text-purple-600">
                  {
                    userRoles.filter(
                      (r) => r.role_name !== "member" && r.is_active
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 役割定義カード */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">役割定義</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-${role.color}-500 mr-2`}
                  ></div>
                  <h3 className="font-medium">{role.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                <div className="text-xs text-gray-500">
                  {getPermissionLabels(role.permissions)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {(isCreating || editingRole) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingRole ? "役割編集" : "新規役割割り当て"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ユーザー
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      user_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingRole}
                >
                  <option value="">ユーザーを選択</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  役割
                </label>
                <select
                  value={formData.role_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      role_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(ROLE_DEFINITIONS).map(([key, role]) => (
                    <option key={key} value={key}>
                      {role.name}
                    </option>
                  ))}
                </select>
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
                  有効な役割
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
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    役割
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    権限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    割り当て者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userRoles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      役割が割り当てられていません。
                    </td>
                  </tr>
                ) : (
                  userRoles.map((userRole) => {
                    const roleDefinition = getRoleDefinition(
                      userRole.role_name
                    );
                    return (
                      <tr key={userRole.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div>
                            <div>{userRole.user?.name}</div>
                            <div className="text-xs text-gray-500">
                              {userRole.user?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full bg-${roleDefinition.color}-100 text-${roleDefinition.color}-800`}
                          >
                            {roleDefinition.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {getPermissionLabels(userRole.permissions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userRole.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {userRole.is_active ? "有効" : "無効"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userRole.assigned_by_user?.name || "システム"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              handleToggleActive(
                                userRole.id,
                                userRole.is_active
                              )
                            }
                            className={`mr-3 ${
                              userRole.is_active
                                ? "text-red-600 hover:text-red-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                          >
                            {userRole.is_active ? "無効化" : "有効化"}
                          </button>
                          <button
                            onClick={() => handleEdit(userRole)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(userRole.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
