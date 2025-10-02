"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { Event, EventParticipant } from "@/lib/supabase";
import { Calendar, MapPin, Users, Clock, Plus, ArrowLeft } from "lucide-react";

export default function EventsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [events, setEvents] = useState<Event[]>([]);
  const [userParticipations, setUserParticipations] = useState<
    EventParticipant[]
  >([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    // デモモードでは認証チェックをスキップ
    if (!loading && !user && process.env.NODE_ENV !== "development") {
      router.push("/signin");
      return;
    }

    const fetchEvents = async () => {
      // デモモード用のダミーデータ
      const demoEvents = [
        {
          id: "1",
          title: "国際交流ランチミーティング",
          description:
            "留学生と在校生でランチを一緒に食べながら交流しましょう！",
          event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 1週間後
          start_time: "12:00",
          end_time: "13:30",
          location: "学生食堂",
          max_participants: 20,
          created_by: "demo-organizer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "active" as const,
          payment_type: "free" as const,
          fee_amount: null as number | null,
          registration_deadline: null as string | null,
          is_public: true,
        },
        {
          id: "2",
          title: "英語・日本語会話練習",
          description:
            "お互いの言語を教え合いながら会話スキルを向上させましょう。",
          event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 10日後
          start_time: "15:00",
          end_time: "17:00",
          location: "図書館グループ学習室",
          max_participants: 16,
          created_by: "demo-organizer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "active" as const,
          payment_type: "free" as const,
          fee_amount: null as number | null,
          registration_deadline: null as string | null,
          is_public: true,
        },
      ];

      const demoParticipations = [
        {
          id: "1",
          event_id: "1",
          user_id: "demo",
          joined_at: new Date().toISOString(),
          status: "confirmed" as const,
          created_at: new Date().toISOString(),
          profile: {
            id: "demo-user",
            user_id: "demo",
            full_name: "デモユーザー",
            student_id: "2024001",
            department: "情報工学科",
            grade: 3,
            phone_number: "090-1234-5678",
            profile_image_url: null as string | null,
            student_id_image_url: null as string | null,
            member_category: "undergraduate" as const,
            status: "active" as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      ];

      if (user) {
        // 実際のユーザーの場合のみデータベースにアクセス
        try {
          // 今後のイベントを取得
          const { data: eventsData } = await supabase
            .from("events")
            .select("*")
            .gte("event_date", new Date().toISOString().split("T")[0])
            .order("event_date")
            .order("start_time");

          setEvents(eventsData || demoEvents);

          // ユーザーの参加状況を取得
          const { data: participationsData } = await supabase
            .from("event_participants")
            .select("*")
            .eq("user_id", user.id);

          setUserParticipations(participationsData || demoParticipations);
        } catch (error) {
          console.error("イベント取得エラー:", error);
          setEvents(demoEvents);
          setUserParticipations(demoParticipations);
        }
      } else {
        // デモモード
        console.log("Demo mode: Using dummy event data");
        setEvents(demoEvents);
        setUserParticipations(demoParticipations);
      }

      setEventsLoading(false);
    };

    fetchEvents();
  }, [user, loading, router]);

  const joinEvent = async (eventId: string) => {
    if (!user) {
      // デモモード
      alert(
        "✨ デモモード: イベント参加を確認しました！実際のサービスではここでイベントに参加できます。"
      );
      return;
    }

    try {
      const { error } = await (
        supabase.from("event_participants") as any
      ).insert({
        event_id: eventId,
        user_id: user.id,
        status: "registered",
      });

      if (error) throw error;

      // 参加状況を再取得
      const { data: participationsData } = await supabase
        .from("event_participants")
        .select("*")
        .eq("user_id", user.id);

      if (participationsData) setUserParticipations(participationsData);
    } catch (error: unknown) {
      console.error("イベント参加エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert("イベント参加に失敗しました: " + errorMessage);
    }
  };

  const leaveEvent = async (eventId: string) => {
    if (!user) {
      // デモモード
      alert(
        "✨ デモモード: イベント離脱を確認しました！実際のサービスではここでイベントから離脱できます。"
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      // 参加状況を再取得
      const { data: participationsData } = await supabase
        .from("event_participants")
        .select("*")
        .eq("user_id", user.id);

      if (participationsData) setUserParticipations(participationsData);
    } catch (error: unknown) {
      console.error("イベント離脱エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert("イベント離脱に失敗しました: " + errorMessage);
    }
  };

  const isUserParticipating = (eventId: string) => {
    return userParticipations.some(
      (p) => p.event_id === eventId && p.status !== "cancelled"
    );
  };

  if (loading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // デモモードでは表示を続行
  if (!loading && !user && process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* デモモード通知 */}
      <div className="bg-yellow-100 border-b px-4 py-2 text-center text-sm text-yellow-800">
        📝 デモモード - 実際のデータは保存されません
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              戻る
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              グループミーティング
            </h1>
          </div>

          <button
            onClick={() => router.push("/events/create")}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            作成
          </button>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              開催予定のイベントはありません
            </h3>
            <p className="text-gray-600 mb-6">
              新しいイベントを作成して交流を始めましょう
            </p>
            <button
              onClick={() => router.push("/events/create")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              イベント作成
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isParticipating={isUserParticipating(event.id)}
                onJoin={() => joinEvent(event.id)}
                onLeave={() => leaveEvent(event.id)}
                onViewDetails={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  isParticipating: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onViewDetails: () => void;
}

function EventCard({
  event,
  isParticipating,
  onJoin,
  onLeave,
  onViewDetails,
}: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM format
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="mb-3">
        <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
        {event.description && (
          <p className="text-gray-600 text-sm">{event.description}</p>
        )}
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{formatDate(event.event_date)}</span>
        </div>

        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          <span>
            {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{event.location}</span>
          </div>
        )}

        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          <span>最大 {event.max_participants} 名</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300"
        >
          詳細
        </button>

        {isParticipating ? (
          <button
            onClick={onLeave}
            className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
          >
            取消
          </button>
        ) : (
          <button
            onClick={onJoin}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
          >
            参加
          </button>
        )}
      </div>
    </div>
  );
}
