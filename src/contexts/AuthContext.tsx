"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { MemberProfile, UserRole, Profile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createProfile: (profileData: Partial<Profile>) => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  isEventOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  const refreshProfileForUser = useCallback(
    async (targetUser: any) => {
      if (!targetUser) {
        console.log("refreshProfileForUser: user not provided");
        return;
      }

      console.log(
        "refreshProfileForUser: Starting profile fetch for user:",
        targetUser.id
      );

      try {
        // プロフィール情報の取得
        console.log("refreshProfileForUser: Fetching profiles...");

         // プロフィール情報の取得（タイムアウトを5秒に短縮）
         const { data: profileData, error: profileError } = await supabase
           .from("profiles")
           .select("*")
           .eq("id", targetUser.id)
           .single();

        console.log("refreshProfileForUser: Profile fetch result:", {
          profileData,
          profileError,
        });

        if (profileError) {
          // プロフィールが存在しない場合（404エラー）は、単純にnullを設定
          if (profileError.code === "PGRST116") {
            console.log(
              "refreshProfileForUser: Profile not found, setting profile to null"
            );
            setProfile(null);
          } else {
            console.error("プロフィール取得エラー:", profileError);
            setProfile(null);
          }
        } else {
          console.log("refreshProfileForUser: Profile found:", profileData);
          setProfile(profileData);
        }

        // 役割情報の取得（現在はprofilesテーブルのみなので空配列を設定）
        console.log("refreshProfileForUser: Setting default roles...");
        setRoles([]);

        console.log("refreshProfileForUser: Profile refresh completed");
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
        setProfile(null);
        setRoles([]);
      }
    },
    [supabase]
  );

  const refreshProfile = async () => {
    if (!user) {
      console.log("refreshProfile: user not available");
      return;
    }
    await refreshProfileForUser(user);
  };

  const createProfile = async (
    profileData: Partial<Profile>
  ): Promise<boolean> => {
    if (!user) {
      console.log("createProfile: user not available");
      return false;
    }

    try {
      console.log("createProfile: Creating profile for user:", user.id);

      // プロフィールデータの検証
      const profileToInsert = {
        id: user.id,
        email: user.email || "",
        name:
          profileData.name?.trim() ||
          user.user_metadata?.name?.trim() ||
          user.email?.split("@")[0] ||
          "ユーザー",
        student_type: profileData.student_type || "international",
        ...(profileData.gender && { gender: profileData.gender }),
        ...(profileData.bio?.trim() && { bio: profileData.bio.trim() }),
      };

      console.log("createProfile: Profile data to insert:", profileToInsert);

      const { data: newProfileData, error: createError } = await (supabase as any)
        .from("profiles")
        .insert(profileToInsert)
        .select()
        .single();

      if (createError) {
        console.error("プロフィール作成エラー:", {
          error: createError,
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          profileData: profileToInsert
        });
        
        // 具体的なエラーメッセージを返す
        if (createError.code === '42501') {
          console.error("権限エラー: RLS (Row Level Security) ポリシーを確認してください");
        } else if (createError.code === '23505') {
          console.error("重複エラー: プロフィールが既に存在します");
        } else if (createError.code === '23502') {
          console.error("必須フィールドエラー: 必要なフィールドが不足しています");
        }
        
        return false;
      } else {
        console.log(
          "createProfile: Profile created successfully:",
          newProfileData
        );
        setProfile(newProfileData);
        return true;
      }
    } catch (error) {
      console.error("プロフィール作成エラー:", error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 初期認証状態の取得
    const getUser = async () => {
      console.log("getUser: Starting initial auth check");

      try {
        console.log("getUser: Fetching current user...");
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        console.log(
          "getUser: Current user:",
          user ? { id: user.id, email: user.email } : null
        );
        setUser(user);

        if (user) {
          console.log("getUser: User found, refreshing profile...");
          await refreshProfileForUser(user);
        } else {
          console.log("getUser: No user found");
        }
      } catch (error) {
        console.error("認証状態取得エラー:", error);
      }

      if (isMounted) {
        console.log("getUser: Setting loading to false");
        setLoading(false);
      }
    };

    getUser();

    // 認証状態の変更を監視
    console.log("Setting up auth state change listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!isMounted) return;

      console.log("Auth state changed:", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
      });

      setUser(session?.user ?? null);

      if (session?.user) {
        console.log("Auth state change: User logged in, refreshing profile...");
        // session.userを直接使用してプロフィールを取得
        await refreshProfileForUser(session.user);
      } else {
        console.log("Auth state change: No user, clearing profile");
        setProfile(null);
        setRoles([]);
      }

      if (isMounted) {
        console.log("Auth state change: Setting loading to false");
        setLoading(false);
      }
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, refreshProfileForUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = hasRole("admin");
  const isAccountant = hasRole("accountant");
  const isEventOrganizer = hasRole("event_organizer");

  const value = {
    user,
    profile,
    roles,
    loading,
    signOut,
    refreshProfile,
    createProfile,
    hasRole,
    isAdmin,
    isAccountant,
    isEventOrganizer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
