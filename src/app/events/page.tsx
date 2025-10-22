"use client";

import BottomNav from "@/components/BottomNav";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

export default function EventsPage() {
  // サンプルイベントデータ
  const events = [
    {
      id: 1,
      title: "春の交流会",
      date: "2025-04-15",
      time: "14:00",
      location: "キャンパスホール",
      participants: 25,
      maxParticipants: 30,
    },
    {
      id: 2,
      title: "国際フードフェスティバル",
      date: "2025-04-22",
      time: "18:00",
      location: "学生食堂",
      participants: 40,
      maxParticipants: 50,
    },
    {
      id: 3,
      title: "スポーツ大会",
      date: "2025-05-10",
      time: "10:00",
      location: "体育館",
      participants: 15,
      maxParticipants: 40,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">イベント情報</h1>
      </div>

      {/* コンテンツ */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {event.title}
              </h3>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{event.date}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{event.time}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{event.location}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>
                    {event.participants} / {event.maxParticipants} 人
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
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
