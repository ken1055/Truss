"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { MemberProfile, UserRole } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: MemberProfile | null;
  roles: UserRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  isEventOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  const refreshProfileForUser = async (targetUser: any) => {
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
        console.error("プロフィール取得エラー:", profileError);
        
        // プロフィールが存在しない場合（404エラー）、新しいプロフィールを作成
        if (profileError.code === 'PGRST116') {
          console.log("refreshProfileForUser: Profile not found, creating new profile...");
          
          const { data: newProfileData, error: createError } = await (supabase as any)
            .from("profiles")
            .insert({
              id: targetUser.id,
              email: targetUser.email || '',
              name: targetUser.user_metadata?.name || targetUser.email?.split('@')[0] || 'ユーザー',
              student_type: 'international' // デフォルト値
            })
            .select()
            .single();

          if (createError) {
            console.error("プロフィール作成エラー:", createError);
            setProfile(null);
          } else {
            console.log("refreshProfileForUser: New profile created:", newProfileData);
            setProfile(newProfileData);
          }
        } else {
          setProfile(null);
        }
      } else {
        setProfile(profileData);
      }

      // 役割情報の取得（現在はprofilesテーブルのみなので空配列を設定）
      console.log("refreshProfileForUser: Setting default roles...");
      const rolesData: any[] = [];
      const rolesError: any = null;

      console.log("refreshProfileForUser: Roles fetch result:", {
        rolesData,
        rolesError,
      });

      if (rolesError) {
        console.error("役割取得エラー:", rolesError);
        setRoles([]);
      } else {
        setRoles(rolesData?.map((r: any) => r.role) || []);
      }

      console.log("refreshProfileForUser: Profile refresh completed");
    } catch (error) {
      console.error("プロフィール取得エラー:", error);
      setProfile(null);
      setRoles([]);
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      console.log("refreshProfile: user not available");
      return;
    }
    await refreshProfileForUser(user);
  };

  useEffect(() => {
    // 初期認証状態の取得
    const getUser = async () => {
      console.log("getUser: Starting initial auth check");

      try {
        console.log("getUser: Fetching current user...");
        const {
          data: { user },
        } = await supabase.auth.getUser();

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

      console.log("getUser: Setting loading to false");
      setLoading(false);
    };

    getUser();

    // 認証状態の変更を監視
    console.log("Setting up auth state change listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
        console.log("Auth state changed:", {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
        });

        setUser(session?.user ?? null);

        if (session?.user) {
          console.log(
            "Auth state change: User logged in, refreshing profile..."
          );
          // session.userを直接使用してプロフィールを取得
          await refreshProfileForUser(session.user);
        } else {
          console.log("Auth state change: No user, clearing profile");
          setProfile(null);
          setRoles([]);
        }

        console.log("Auth state change: Setting loading to false");
        setLoading(false);
      });

      return () => {
        console.log("Unsubscribing from auth state changes");
        subscription.unsubscribe();
      };
  }, []);

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
