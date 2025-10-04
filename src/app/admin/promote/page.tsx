"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminPromotePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 管理者昇格用のパスワード（実際の運用では環境変数から取得）
  const ADMIN_PASSWORD = "truss_admin_2024";

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!user) {
      setMessage("ログインが必要です");
      setLoading(false);
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      console.log("Password mismatch:", {
        entered: password,
        expected: ADMIN_PASSWORD,
        enteredLength: password.length,
        expectedLength: ADMIN_PASSWORD.length,
      });
      setMessage("管理者パスワードが正しくありません");
      setLoading(false);
      return;
    }

    try {
      // user_rolesテーブルにadminロールを追加
      const { error: roleError } = await (supabase as any)
        .from("user_roles")
        .insert({
          user_id: user.id,
          role_name: "admin",
          is_active: true,
        });

      if (roleError) {
        // 既にロールが存在する場合は更新
        if (roleError.code === "23505") {
          const { error: updateError } = await (supabase as any)
            .from("user_roles")
            .update({ is_active: true })
            .eq("user_id", user.id)
            .eq("role_name", "admin");

          if (updateError) {
            console.error("Role update error:", updateError);
            throw updateError;
          }
        } else {
          console.error("Role insert error:", roleError);
          throw roleError;
        }
      }

      // 互換性のため、bioフィールドにも[ADMIN]を追加（既に追加されていない場合）
      if (!profile?.bio?.includes("[ADMIN]")) {
        await (supabase as any)
          .from("profiles")
          .update({
            bio: (profile?.bio || "") + " [ADMIN]",
          })
          .eq("id", user.id);
      }

      setMessage("管理者権限が付与されました！管理画面にリダイレクトします...");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "エラーが発生しました";
      setMessage("昇格に失敗しました: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            戻る
          </button>
          <h1 className="text-xl font-bold text-gray-900">管理者昇格</h1>
        </div>

        {/* 昇格フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              管理者権限の申請
            </h2>
            <p className="text-sm text-gray-600">
              管理者パスワードを入力して権限を取得してください
            </p>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes("成功") || message.includes("付与")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handlePromote}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理者パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="管理者パスワードを入力"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                "処理中..."
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  管理者権限を取得
                </>
              )}
            </button>
          </form>

          {/* セキュリティ注意事項 */}
          <div className="mt-6 p-3 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700">
              <strong>注意:</strong> 管理者権限は慎重に取り扱ってください。
              不正使用は禁止されています。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
