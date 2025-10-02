"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { Event, Group } from "@/lib/supabase";
import { createOptimalGroups, getGroupStats } from "@/lib/matching";
import type { ParticipantWithDetails, GroupSuggestion } from "@/lib/matching";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Shuffle,
  Save,
} from "lucide-react";

interface EventDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>(
    []
  );
  const [existingGroups, setExistingGroups] = useState<Group[]>([]);
  const [groupSuggestions, setGroupSuggestions] = useState<GroupSuggestion[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const [isSavingGroups, setIsSavingGroups] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (!eventId) return;

    const fetchEventDetails = async () => {
      try {
        // イベント詳細を取得
        const { data: eventData } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (!eventData) {
          router.push("/events");
          return;
        }

        setEvent(eventData);

        // 参加者情報を取得（プロフィール、言語、空き時間も含む）
        const { data: participantsData } = await supabase
          .from("event_participants")
          .select(
            `
            *,
            profile:profiles(
              *,
              user_languages(*, language:languages(*)),
              availability(*)
            )
          `
          )
          .eq("event_id", eventId)
          .eq("status", "registered");

        if (participantsData) {
          setParticipants(participantsData as ParticipantWithDetails[]);
        }

        // 既存のグループを取得
        const { data: groupsData } = await supabase
          .from("groups")
          .select("*")
          .eq("event_id", eventId);

        if (groupsData) {
          setExistingGroups(groupsData);
        }
      } catch (error) {
        console.error("イベント詳細取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && eventId) {
      fetchEventDetails();
    }
  }, [user, loading, router, eventId, supabase]);

  const generateGroups = async () => {
    setIsGeneratingGroups(true);

    try {
      // マッチングアルゴリズムを実行
      const suggestions = createOptimalGroups(participants, {
        targetInternationalRatio: 0.5,
        targetGenderRatio: 0.5,
        maxGroupSize: 6,
        prioritizeLanguageSkills: true,
        prioritizeScheduleCompatibility: true,
      });

      setGroupSuggestions(suggestions);
    } catch (error) {
      console.error("グループ生成エラー:", error);
      alert("グループ生成に失敗しました");
    } finally {
      setIsGeneratingGroups(false);
    }
  };

  const saveGroups = async () => {
    if (!event || groupSuggestions.length === 0) return;

    setIsSavingGroups(true);

    try {
      // 既存のグループを削除
      await supabase.from("groups").delete().eq("event_id", event.id);

      // 新しいグループを作成
      for (let i = 0; i < groupSuggestions.length; i++) {
        const suggestion = groupSuggestions[i];

        // グループを作成
        const { data: groupData, error: groupError } = await (
          supabase.from("groups") as any
        )
          .insert({
            event_id: event.id,
            name: `グループ ${i + 1}`,
            max_size: suggestion.members.length,
            target_international_ratio: suggestion.internationalRatio,
            target_gender_ratio: suggestion.genderRatio,
            status: "confirmed" as const,
          })
          .select()
          .single();

        if (groupError) throw groupError;

        // グループメンバーを追加
        const memberInserts = suggestion.members.map((member) => ({
          group_id: groupData.id,
          user_id: (member as any).user_id || (member as any).id, // 両方を型キャスト
        }));

        const { error: membersError } = await (
          supabase.from("group_members") as any
        ).insert(memberInserts);

        if (membersError) throw membersError;
      }

      alert("グループが正常に保存されました！");

      // 既存グループを再取得
      const { data: groupsData } = await supabase
        .from("groups")
        .select("*")
        .eq("event_id", event.id);

      if (groupsData) {
        setExistingGroups(groupsData);
        setGroupSuggestions([]); // 提案をクリア
      }
    } catch (error: unknown) {
      console.error("グループ保存エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert("グループ保存に失敗しました: " + errorMessage);
    } finally {
      setIsSavingGroups(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !event) return null;

  const stats = getGroupStats(groupSuggestions);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                戻る
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {event.title}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* イベント詳細 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                イベント詳細
              </h2>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-3" />
                  <span>
                    {new Date(event.event_date).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-3" />
                  <span>
                    {event.start_time.slice(0, 5)} -{" "}
                    {event.end_time.slice(0, 5)}
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3" />
                    <span>{event.location}</span>
                  </div>
                )}

                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-3" />
                  <span>最大 {event.max_participants} 名</span>
                </div>
              </div>

              {event.description && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">説明</h3>
                  <p className="text-gray-600">{event.description}</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                参加者 ({participants.length}名)
              </h2>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={(participant as any).id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">
                        {participant.profile.full_name}
                      </span>
                      <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                        {participant.profile.member_category === "undergraduate"
                          ? "学部生"
                          : participant.profile.member_category === "graduate"
                          ? "大学院生"
                          : "会員"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* グループマッチング */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              グループマッチング
            </h2>

            <div className="flex space-x-3">
              <button
                onClick={generateGroups}
                disabled={isGeneratingGroups || participants.length < 3}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                {isGeneratingGroups ? "グループ生成中..." : "グループを生成"}
              </button>

              {groupSuggestions.length > 0 && (
                <button
                  onClick={saveGroups}
                  disabled={isSavingGroups}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingGroups ? "保存中..." : "グループを保存"}
                </button>
              )}
            </div>
          </div>

          {participants.length < 3 && (
            <div className="text-center py-8 text-gray-500">
              グループ生成には最低3名の参加者が必要です
            </div>
          )}

          {/* マッチング統計 */}
          {groupSuggestions.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">マッチング統計</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">総参加者:</span>
                  <span className="font-medium ml-1">
                    {stats.totalParticipants}名
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">グループ数:</span>
                  <span className="font-medium ml-1">
                    {stats.totalGroups}個
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">平均グループサイズ:</span>
                  <span className="font-medium ml-1">
                    {stats.averageGroupSize.toFixed(1)}名
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">平均スコア:</span>
                  <span className="font-medium ml-1">
                    {(stats.averageScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* グループ提案 */}
          {groupSuggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">生成されたグループ</h3>
              {groupSuggestions.map((group, index) => (
                <GroupCard key={index} group={group} index={index} />
              ))}
            </div>
          )}

          {/* 確定済みグループ */}
          {existingGroups.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">確定済みグループ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {existingGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <h4 className="font-medium text-green-900 mb-2">
                      グループ {group.id}
                    </h4>
                    <div className="text-sm text-green-700">
                      <p>最大サイズ: {group.max_size}名</p>
                      <p>
                        ステータス:{" "}
                        {group.status === "confirmed" ? "確定" : group.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface GroupCardProps {
  group: GroupSuggestion;
  index: number;
}

function GroupCard({ group, index }: GroupCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">グループ {index + 1}</h4>
        <div className="text-sm text-gray-600">
          スコア: {(group.score * 100).toFixed(0)}%
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">留学生比率:</span>
          <span className="font-medium ml-1">
            {(group.internationalRatio * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="text-gray-600">男性比率:</span>
          <span className="font-medium ml-1">
            {(group.genderRatio * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="text-gray-600">言語互換性:</span>
          <span className="font-medium ml-1">
            {(group.languageCompatibility * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="text-gray-600">時間互換性:</span>
          <span className="font-medium ml-1">
            {(group.scheduleCompatibility * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div>
        <h5 className="font-medium text-gray-900 mb-2">
          メンバー ({group.members.length}名)
        </h5>
        <div className="space-y-1">
          {group.members.map((member) => (
            <div
              key={(member as any).user_id || (member as any).id}
              className="flex items-center justify-between text-sm"
            >
              <span>{member.profile.full_name}</span>
              <div className="flex space-x-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    member.profile.member_category === "undergraduate"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {member.profile.member_category === "undergraduate"
                    ? "学部生"
                    : member.profile.member_category === "graduate"
                    ? "大学院生"
                    : "会員"}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  {member.profile.department}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
