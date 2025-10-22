"use client";

import BottomNav from "@/components/BottomNav";
import { Users, Clock, MessageSquare } from "lucide-react";

export default function BoardPage() {
  // サンプル掲示板データ
  const posts = [
    {
      id: 1,
      title: "バスケットボールメンバー募集中！",
      author: "田中太郎",
      date: "2時間前",
      participants: 8,
      needed: 12,
      comments: 5,
      category: "スポーツ",
    },
    {
      id: 2,
      title: "英会話練習会のメンバー募集",
      author: "山田花子",
      date: "5時間前",
      participants: 15,
      needed: 20,
      comments: 12,
      category: "語学",
    },
    {
      id: 3,
      title: "週末カラオケに行きませんか？",
      author: "鈴木一郎",
      date: "1日前",
      participants: 5,
      needed: 10,
      comments: 8,
      category: "娯楽",
    },
    {
      id: 4,
      title: "プログラミング勉強会メンバー募集",
      author: "佐藤美咲",
      date: "1日前",
      participants: 10,
      needed: 15,
      comments: 15,
      category: "学習",
    },
    {
      id: 5,
      title: "ハイキング仲間募集",
      author: "高橋健太",
      date: "2日前",
      participants: 6,
      needed: 12,
      comments: 4,
      category: "アウトドア",
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      スポーツ: "bg-blue-100 text-blue-800",
      語学: "bg-green-100 text-green-800",
      娯楽: "bg-purple-100 text-purple-800",
      学習: "bg-yellow-100 text-yellow-800",
      アウトドア: "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">掲示板</h1>
        <p className="text-sm text-gray-600 mt-1">
          イベントメンバーを募集しよう
        </p>
      </div>

      {/* コンテンツ */}
      <div className="max-w-2xl mx-auto p-4">
        {/* 新規投稿ボタン */}
        <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-4 font-medium">
          + 新しい募集を投稿
        </button>

        {/* 投稿リスト */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              {/* カテゴリータグ */}
              <div className="mb-2">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                    post.category
                  )}`}
                >
                  {post.category}
                </span>
              </div>

              {/* タイトル */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {post.title}
              </h3>

              {/* メタ情報 */}
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <span>{post.author}</span>
                <span className="mx-2">•</span>
                <Clock className="w-3 h-3 mr-1" />
                <span>{post.date}</span>
              </div>

              {/* 参加者情報 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-gray-900 font-medium">
                    {post.participants} / {post.needed} 人
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span>{post.comments}</span>
                </div>
              </div>

              {/* 応募ボタン */}
              <button className="w-full mt-3 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                詳細を見る
              </button>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
