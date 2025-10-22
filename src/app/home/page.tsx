"use client";

import BottomNav from "@/components/BottomNav";
import { Users, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">ホーム</h1>
      </div>

      {/* コンテンツ */}
      <div className="max-w-2xl mx-auto p-4">
        {/* ウェルカムカード */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-2">ようこそ！</h2>
          <p className="text-sm opacity-90">
            サークル交流アプリへようこそ。今日も素敵な出会いがありますように！
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">
                参加者数
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">150</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">
                今月のイベント
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">8</p>
          </div>
        </div>

        {/* 最近のアクティビティ */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            最近のアクティビティ
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <div>
                <p className="text-sm text-gray-900">
                  新しいイベントが追加されました
                </p>
                <p className="text-xs text-gray-500">2時間前</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
              <div>
                <p className="text-sm text-gray-900">
                  新しいメンバーが参加しました
                </p>
                <p className="text-xs text-gray-500">5時間前</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
              <div>
                <p className="text-sm text-gray-900">
                  ギャラリーに新しい写真が追加されました
                </p>
                <p className="text-xs text-gray-500">1日前</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
