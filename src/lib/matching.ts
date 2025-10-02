import type {
  Profile,
  UserLanguage,
  Availability,
  EventParticipant,
} from "./types";

export interface MatchingPreferences {
  targetInternationalRatio?: number; // 0.0-1.0
  targetGenderRatio?: number; // 0.0-1.0 (male ratio)
  primaryLanguageId?: string;
  maxGroupSize?: number;
  prioritizeLanguageSkills?: boolean;
  prioritizeScheduleCompatibility?: boolean;
}

export interface ParticipantWithDetails {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
  status: "registered" | "confirmed" | "cancelled";
  created_at: string;
  profile: (Profile | any) & {
    user_languages?: UserLanguage[];
    availability?: Availability[];
  };
}

export interface GroupSuggestion {
  members: ParticipantWithDetails[];
  score: number;
  internationalRatio: number;
  genderRatio: number;
  languageCompatibility: number;
  scheduleCompatibility: number;
}

/**
 * イベント参加者をグループにマッチングする
 */
export function createOptimalGroups(
  participants: ParticipantWithDetails[],
  preferences: MatchingPreferences = {}
): GroupSuggestion[] {
  const {
    targetInternationalRatio = 0.5,
    targetGenderRatio = 0.5,
    maxGroupSize = 6,
    prioritizeLanguageSkills = true,
    prioritizeScheduleCompatibility = true,
  } = preferences;

  // 参加者をシャッフルしてランダム性を追加
  const shuffledParticipants = [...participants].sort(
    () => Math.random() - 0.5
  );
  const groups: GroupSuggestion[] = [];
  const usedParticipants = new Set<string>();

  while (shuffledParticipants.length - usedParticipants.size >= 3) {
    const availableParticipants = shuffledParticipants.filter(
      (p) => !usedParticipants.has(p.user_id)
    );

    if (availableParticipants.length < 3) break;

    const bestGroup = findBestGroupCombination(
      availableParticipants,
      maxGroupSize,
      {
        targetInternationalRatio,
        targetGenderRatio,
        primaryLanguageId: preferences.primaryLanguageId,
        prioritizeLanguageSkills,
        prioritizeScheduleCompatibility,
      }
    );

    if (bestGroup) {
      groups.push(bestGroup);
      bestGroup.members.forEach((member) => {
        usedParticipants.add(member.user_id);
      });
    } else {
      break;
    }
  }

  return groups.sort((a, b) => b.score - a.score);
}

/**
 * 最適なグループの組み合わせを見つける
 */
function findBestGroupCombination(
  participants: ParticipantWithDetails[],
  maxSize: number,
  preferences: {
    targetInternationalRatio: number;
    targetGenderRatio: number;
    primaryLanguageId?: string;
    prioritizeLanguageSkills: boolean;
    prioritizeScheduleCompatibility: boolean;
  }
): GroupSuggestion | null {
  let bestGroup: GroupSuggestion | null = null;
  let bestScore = 0;

  // 異なるサイズのグループを試す（3人から最大サイズまで）
  for (let size = 3; size <= Math.min(maxSize, participants.length); size++) {
    const combinations = generateCombinations(participants, size);

    for (const combination of combinations) {
      const groupScore = calculateGroupScore(combination, preferences);

      if (groupScore.score > bestScore) {
        bestScore = groupScore.score;
        bestGroup = groupScore;
      }
    }
  }

  return bestGroup;
}

/**
 * グループのスコアを計算する
 */
function calculateGroupScore(
  members: ParticipantWithDetails[],
  preferences: {
    targetInternationalRatio: number;
    targetGenderRatio: number;
    primaryLanguageId?: string;
    prioritizeLanguageSkills: boolean;
    prioritizeScheduleCompatibility: boolean;
  }
): GroupSuggestion {
  const internationalCount = members.filter(
    (m) => m.profile.student_type === "international"
  ).length;
  const maleCount = members.filter((m) => m.profile.gender === "male").length;

  const internationalRatio = internationalCount / members.length;
  const genderRatio = maleCount / members.length;

  // 比率スコア（目標値に近いほど高スコア）
  const internationalRatioScore =
    1 - Math.abs(internationalRatio - preferences.targetInternationalRatio);
  const genderRatioScore =
    1 - Math.abs(genderRatio - preferences.targetGenderRatio);

  // 言語互換性スコア
  const languageCompatibility = calculateLanguageCompatibility(
    members,
    preferences.primaryLanguageId
  );

  // スケジュール互換性スコア
  const scheduleCompatibility = calculateScheduleCompatibility(members);

  // 総合スコアの計算（重み付け）
  let totalScore = 0;
  totalScore += internationalRatioScore * 0.3; // 留学生比率の重み
  totalScore += genderRatioScore * 0.2; // 性別比率の重み

  if (preferences.prioritizeLanguageSkills) {
    totalScore += languageCompatibility * 0.3; // 言語互換性の重み
  }

  if (preferences.prioritizeScheduleCompatibility) {
    totalScore += scheduleCompatibility * 0.2; // スケジュール互換性の重み
  }

  return {
    members,
    score: totalScore,
    internationalRatio,
    genderRatio,
    languageCompatibility,
    scheduleCompatibility,
  };
}

/**
 * 言語互換性を計算する
 */
function calculateLanguageCompatibility(
  members: ParticipantWithDetails[],
  primaryLanguageId?: string
): number {
  if (!members.some((m) => m.profile.user_languages?.length)) {
    return 0.5; // 言語情報がない場合は中間スコア
  }

  const allLanguages = new Set<string>();
  const languageUsers = new Map<string, number>();

  members.forEach((member) => {
    member.profile.user_languages?.forEach((userLang: any) => {
      allLanguages.add(userLang.language_id);
      languageUsers.set(
        userLang.language_id,
        (languageUsers.get(userLang.language_id) || 0) + 1
      );
    });
  });

  let compatibilityScore = 0;

  // 共通言語があるかチェック
  for (const [languageId, userCount] of languageUsers) {
    if (userCount >= 2) {
      // 2人以上が話せる言語にボーナス
      compatibilityScore += (userCount / members.length) * 0.5;

      // 主要言語の場合はさらにボーナス
      if (primaryLanguageId && languageId === primaryLanguageId) {
        compatibilityScore += 0.3;
      }
    }
  }

  // 言語の多様性ボーナス
  const languageDiversity = Math.min(allLanguages.size / members.length, 1);
  compatibilityScore += languageDiversity * 0.2;

  return Math.min(compatibilityScore, 1);
}

/**
 * スケジュール互換性を計算する
 */
function calculateScheduleCompatibility(
  members: ParticipantWithDetails[]
): number {
  const memberAvailabilities = members
    .map((m) => m.profile.availability || [])
    .filter((avail) => avail.length > 0);

  if (memberAvailabilities.length < 2) {
    return 0.5; // 十分な情報がない場合は中間スコア
  }

  let commonTimeSlots = 0;
  let totalTimeSlots = 0;

  // 各曜日ごとに重複する時間帯を計算
  for (let day = 0; day < 7; day++) {
    const dayAvailabilities = memberAvailabilities
      .map((availability: any) =>
        availability.filter((a: any) => a.day_of_week === day)
      )
      .filter((dayAvail: any) => dayAvail.length > 0);

    if (dayAvailabilities.length < 2) continue;

    // その日の時間帯の重複を計算
    const timeSlots = findCommonTimeSlots(dayAvailabilities);
    commonTimeSlots += timeSlots.common;
    totalTimeSlots += timeSlots.total;
  }

  return totalTimeSlots > 0 ? commonTimeSlots / totalTimeSlots : 0.5;
}

/**
 * 共通の時間帯を見つける
 */
function findCommonTimeSlots(dayAvailabilities: Availability[][]): {
  common: number;
  total: number;
} {
  // 簡略化: 1時間単位で時間帯を分割して重複を計算
  const timeSlots = Array(24).fill(0);

  dayAvailabilities.forEach((availability: any) => {
    availability.forEach((avail: any) => {
      const startHour = parseInt(avail.start_time.split(":")[0]);
      const endHour = parseInt(avail.end_time.split(":")[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        timeSlots[hour]++;
      }
    });
  });

  const commonSlots = timeSlots.filter((count) => count >= 2).length;
  const totalSlots = timeSlots.filter((count) => count > 0).length;

  return { common: commonSlots, total: Math.max(totalSlots, 1) };
}

/**
 * 組み合わせを生成する
 */
function generateCombinations<T>(array: T[], size: number): T[][] {
  if (size === 1) return array.map((item) => [item]);
  if (size === array.length) return [array];

  const combinations: T[][] = [];

  function backtrack(start: number, current: T[]) {
    if (current.length === size) {
      combinations.push([...current]);
      return;
    }

    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return combinations;
}

/**
 * グループの統計情報を取得する
 */
export function getGroupStats(groups: GroupSuggestion[]) {
  if (groups.length === 0) {
    return {
      totalParticipants: 0,
      totalGroups: 0,
      averageGroupSize: 0,
      averageScore: 0,
      averageInternationalRatio: 0,
      averageGenderRatio: 0,
    };
  }

  const totalParticipants = groups.reduce(
    (sum, group) => sum + group.members.length,
    0
  );
  const averageGroupSize = totalParticipants / groups.length;
  const averageScore =
    groups.reduce((sum, group) => sum + group.score, 0) / groups.length;
  const averageInternationalRatio =
    groups.reduce((sum, group) => sum + group.internationalRatio, 0) /
    groups.length;
  const averageGenderRatio =
    groups.reduce((sum, group) => sum + group.genderRatio, 0) / groups.length;

  return {
    totalParticipants,
    totalGroups: groups.length,
    averageGroupSize,
    averageScore,
    averageInternationalRatio,
    averageGenderRatio,
  };
}
