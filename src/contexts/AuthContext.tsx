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

  const refreshProfile = async () => {
    if (!user) return;

    try {
      // プロフィール情報の取得
      const { data: profileData } = await supabase
        .from("member_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);

      // 役割情報の取得
      const { data: rolesData } = await supabase
        .from("member_roles")
        .select("role")
        .eq("user_id", user.id);

      setRoles(rolesData?.map((r: any) => r.role) || []);
    } catch (error) {
      console.error("プロフィール取得エラー:", error);
    }
  };

  useEffect(() => {
    // 初期認証状態の取得
    const getUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          await refreshProfile();
        }
      } catch (error) {
        console.error("認証状態取得エラー:", error);
      }

      setLoading(false);
    };

    getUser();


    // 認証状態の変更を監視
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
          setRoles([]);
        }

        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, [supabase]);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
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
