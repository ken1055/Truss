"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { Event, EventParticipant } from "@/lib/types";
import { Calendar, MapPin, Users, Clock, Plus, ArrowLeft } from "lucide-react";

export default function EventsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [events, setEvents] = useState<Event[]>([]);
  const [userParticipations, setUserParticipations] = useState<EventParticipant[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    const fetchEvents = async () => {
      if (!user) return;

      try {
        setEventsLoading(true);

        // イベント一覧の取得
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("is_public", true)
          .order("event_date", { ascending: true });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

        // ユーザーの参加状況の取得
        const { data: participationsData, error: participationsError } = await supabase
          .from("event_participants")
          .select("*, profile:member_profiles(*)")
          .eq("user_id", user.id);

        if (participationsError) throw participationsError;
        setUserParticipations(participationsData || []);
      } catch (error) {
        console.error("イベントデータの取得に失敗しました:", error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [user, loading, router, supabase]);

  const joinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await (supabase.from("event_participants") as any).insert({
        event_id: eventId,
        user_id: user.id,
        status: "registered",
      });

      if (error) throw error;

      // 参加状況を再取得
      const { data: participationsData } = await supabase
        .from("event_participants")
        .select("*, profile:member_profiles(*)")
        .eq("user_id", user.id);

      setUserParticipations(participationsData || []);
      alert("イベントに参加しました！");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert("参加に失敗しました: " + errorMessage);
    }
  };

  const leaveEvent = async (eventId: string) => {
    if (!user) return;

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
        .select("*, profile:member_profiles(*)")
        .eq("user_id", user.id);

      setUserParticipations(participationsData || []);
      alert("イベントから離脱しました。");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert("離脱に失敗しました: " + errorMessage);
    }
  };

  const isUserParticipating = (eventId: string) => {
    return userParticipations.some((p) => p.event_id === eventId);
  };

  if (loading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="mr-3 p-2 hover:bg-gray-200 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">イベント一覧</h1>
          </div>
          <button
            onClick={() => router.push("/events/create")}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            作成
          </button>
        </div>

        {/* イベントリスト */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">イベントがありません</p>
            </div>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isParticipating={isUserParticipating(event.id)}
                onJoin={() => joinEvent(event.id)}
                onLeave={() => leaveEvent(event.id)}
                onViewDetails={() => router.push(`/events/${event.id}`)}
              />
            ))
          )}
        </div>
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
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
        <div className="flex space-x-2">
          {isParticipating ? (
            <button
              onClick={onLeave}
              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              離脱
            </button>
          ) : (
            <button
              onClick={onJoin}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"
            >
              参加
            </button>
          )}
          <button
            onClick={onViewDetails}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
          >
            詳細
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3">{event.description}</p>

      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{event.event_date}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          <span>
            {event.start_time} - {event.end_time}
          </span>
        </div>
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2" />
          <span>最大 {event.max_participants} 名</span>
        </div>
      </div>
    </div>
  );
}