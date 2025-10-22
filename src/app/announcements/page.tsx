"use client";

import BottomNav from "@/components/BottomNav";
import { Bell, AlertCircle, Info, CheckCircle } from "lucide-react";

export default function AnnouncementsPage() {
  // サンプルお知らせデータ
  const announcements = [
    {
      id: 1,
      type: "important",
      title: "【重要】システムメンテナンスのお知らせ",
      content:
        "3月25日(火) 2:00～5:00の間、システムメンテナンスを実施します。この時間帯はサービスをご利用いただけません。",
      date: "2025-03-20",
      time: "14:30",
    },
    {
      id: 2,
      type: "update",
      title: "新機能リリースのお知らせ",
      content:
        "ギャラリー機能に動画投稿機能が追加されました。イベントの思い出を動画でも共有できます！",
      date: "2025-03-18",
      time: "10:00",
    },
    {
      id: 3,
      type: "event",
      title: "春の交流イベント開催決定！",
      content:
        "4月15日に大規模な交流イベントを開催します。詳細はイベント情報ページをご確認ください。",
      date: "2025-03-15",
      time: "16:00",
    },
    {
      id: 4,
      type: "info",
      title: "プロフィール更新のお願い",
      content:
        "より良いマッチングのため、プロフィール情報の更新をお願いします。特に言語スキルと興味分野の更新をお願いします。",
      date: "2025-03-10",
      time: "09:00",
    },
    {
      id: 5,
      type: "success",
      title: "月間アクティブユーザー数が150人を突破！",
      content:
        "皆様のご利用により、月間アクティブユーザー数が150人を突破しました。今後もより良いサービスを提供できるよう努めてまいります。",
      date: "2025-03-05",
      time: "12:00",
    },
  ];

  const getAnnouncementStyle = (type: string) => {
    const styles: {
      [key: string]: { bg: string; icon: any; iconColor: string };
    } = {
      important: {
        bg: "bg-red-50 border-red-200",
        icon: AlertCircle,
        iconColor: "text-red-600",
      },
      update: {
        bg: "bg-blue-50 border-blue-200",
        icon: Bell,
        iconColor: "text-blue-600",
      },
      event: {
        bg: "bg-purple-50 border-purple-200",
        icon: Info,
        iconColor: "text-purple-600",
      },
      info: {
        bg: "bg-yellow-50 border-yellow-200",
        icon: Info,
        iconColor: "text-yellow-600",
      },
      success: {
        bg: "bg-green-50 border-green-200",
        icon: CheckCircle,
        iconColor: "text-green-600",
      },
    };
    return (
      styles[type] || {
        bg: "bg-gray-50 border-gray-200",
        icon: Bell,
        iconColor: "text-gray-600",
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">お知らせ</h1>
        <p className="text-sm text-gray-600 mt-1">運営からの連絡事項</p>
      </div>

      {/* コンテンツ */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const style = getAnnouncementStyle(announcement.type);
            const Icon = style.icon;

            return (
              <div
                key={announcement.id}
                className={`${style.bg} border rounded-lg p-4`}
              >
                <div className="flex items-start">
                  <Icon
                    className={`w-5 h-5 ${style.iconColor} mr-3 mt-0.5 flex-shrink-0`}
                  />
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-gray-500">
                      {announcement.date} {announcement.time}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
