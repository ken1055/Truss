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
  const ADMIN_PASSWORD = "circle-admin-2024";

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
      setMessage("管理者パスワードが正しくありません");
      setLoading(false);
      return;
    }

    try {
      if (!user) {
        // デモモード
        setMessage(
          "✨ デモモード: 管理者昇格を確認しました！実際のサービスではここで管理者権限が付与されます。"
        );
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 2000);
      } else {
        // プロフィールを管理者に昇格
        const { error } = await (supabase.from("profiles") as any)
          .update({
            role: "admin",
          })
          .eq("id", user.id);

        if (error) throw error;

        // ログを記録
        await (supabase.from("admin_logs") as any).insert({
          admin_id: user.id,
          action: "admin_promotion",
          target_type: "user",
          target_id: user.id,
          details: { promoted_at: new Date().toISOString() },
        });

        setMessage(
          "管理者権限が付与されました！管理画面にリダイレクトします..."
        );
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 2000);
      }
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
      {/* デモモード通知 */}
      <div className="bg-yellow-100 border-b px-4 py-2 text-center text-sm text-yellow-800">
        📝 デモモード - 実際のデータは保存されません
      </div>

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
                message.includes("成功") ||
                message.includes("付与") ||
                message.includes("デモモード")
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

          {/* デモ用ヒント */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>デモ用パスワード:</strong> circle-admin-2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
