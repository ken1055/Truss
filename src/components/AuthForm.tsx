"use client";

import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studentType, setStudentType] = useState<"international" | "domestic">(
    "international"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const router = useRouter();
  
  // 環境変数の確認
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("Environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlPrefix: supabaseUrl?.substring(0, 20) + "...",
    keyPrefix: supabaseKey?.substring(0, 20) + "..."
  });

  // Supabaseクライアントの作成（エラーハンドリング付き）
  let supabase: ReturnType<typeof createClientComponentClient> | null = null;
  try {
    supabase = createClientComponentClient();
  } catch (error) {
    console.error("Supabase client creation failed:", error);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!supabase) {
      setMessage("エラー: Supabaseクライアントが初期化されていません。環境変数を確認してください。");
      setLoading(false);
      return;
    }

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              student_type: studentType,
            },
          },
        });

        if (error) {
          throw error;
        } else if (data.user) {
          setMessage(
            "確認メールを送信しました。メールをチェックしてアカウントを有効化してください。"
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        } else if (data.user) {
          router.push("/dashboard");
        }
      }
    } catch (error: unknown) {
      console.error("AuthForm: Caught error", error);
      let errorMessage = "エラーが発生しました";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // ネットワークエラーの詳細を追加
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "ネットワーク接続エラー: Supabaseサーバーに接続できません。以下を確認してください:\n" +
                        "1. インターネット接続\n" +
                        "2. Supabase環境変数の設定\n" +
                        "3. SupabaseプロジェクトのURL";
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "メールアドレスまたはパスワードが正しくありません";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "メールアドレスが確認されていません。確認メールをチェックしてください";
        }
      }
      
      setMessage("エラー: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {mode === "signin" ? "ログイン" : "アカウント作成"}
            </h2>
            <p className="mt-2 text-gray-600">
              {mode === "signin"
                ? "サークル交流アプリへようこそ"
                : "留学生と在校生の交流を始めましょう"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "signup" && (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    お名前
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="山田太郎"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="studentType"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    学生区分
                  </label>
                  <select
                    id="studentType"
                    value={studentType}
                    onChange={(e) =>
                      setStudentType(
                        e.target.value as "international" | "domestic"
                      )
                    }
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="international">留学生</option>
                    <option value="domestic">在校生</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="example@university.ac.jp"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes("確認メール") || message.includes("成功")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading
                ? "処理中..."
                : mode === "signin"
                ? "ログイン"
                : "アカウント作成"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {mode === "signin"
                ? "アカウントをお持ちでない方は"
                : "すでにアカウントをお持ちの方は"}
              <a
                href={mode === "signin" ? "/signup" : "/signin"}
                className="ml-1 text-indigo-600 hover:text-indigo-500 font-medium"
              >
                {mode === "signin" ? "こちら" : "ログイン"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
