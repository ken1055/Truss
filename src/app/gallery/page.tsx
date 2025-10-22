"use client";

import BottomNav from "@/components/BottomNav";
import { Heart, MessageCircle } from "lucide-react";

export default function GalleryPage() {
  // サンプルギャラリーデータ
  const galleryItems = [
    {
      id: 1,
      title: "春のピクニック",
      date: "2025-03-20",
      likes: 45,
      comments: 12,
    },
    {
      id: 2,
      title: "国際交流パーティー",
      date: "2025-03-15",
      likes: 78,
      comments: 23,
    },
    {
      id: 3,
      title: "スポーツ大会",
      date: "2025-03-10",
      likes: 62,
      comments: 18,
    },
    {
      id: 4,
      title: "文化祭",
      date: "2025-03-05",
      likes: 91,
      comments: 34,
    },
    {
      id: 5,
      title: "新入生歓迎会",
      date: "2025-02-28",
      likes: 56,
      comments: 15,
    },
    {
      id: 6,
      title: "料理教室",
      date: "2025-02-20",
      likes: 38,
      comments: 9,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">ギャラリー</h1>
      </div>

      {/* コンテンツ */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* 画像プレースホルダー */}
              <div className="bg-gradient-to-br from-blue-400 to-purple-500 aspect-square flex items-center justify-center">
                <span className="text-white text-4xl font-bold opacity-50">
                  {item.id}
                </span>
              </div>

              {/* 情報 */}
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{item.date}</p>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    <span>{item.likes}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span>{item.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
