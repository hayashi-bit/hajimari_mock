import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface UserProfile {
  name: string;
  jobTitle: string;
  organization: string;
  teamStructure: string;
  mainResponsibilities: string;
  currentChallenges: string;
  goals: string;
  keywords: string;
}

const EMPTY_PROFILE: UserProfile = {
  name: "",
  jobTitle: "",
  organization: "",
  teamStructure: "",
  mainResponsibilities: "",
  currentChallenges: "",
  goals: "",
  keywords: "",
};

interface UserProfileContextValue {
  profile: UserProfile;
  isProfileComplete: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  buildSystemPrompt: () => string;
}

const PROFILE_KEY = "hajimari-user-profile";

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      return stored ? { ...EMPTY_PROFILE, ...JSON.parse(stored) } : EMPTY_PROFILE;
    } catch {
      return EMPTY_PROFILE;
    }
  });

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const isProfileComplete =
    profile.jobTitle.trim() !== "" && profile.mainResponsibilities.trim() !== "";

  const buildSystemPrompt = useCallback((): string => {
    const lines: string[] = [
      "あなたはキャリアコーチングの専門家です。ユーザーの仕事の強みや課題を深く理解し、具体的で実践的なアドバイスを提供してください。",
      "",
      "【ユーザー情報】",
    ];

    if (profile.name) lines.push(`名前: ${profile.name}`);
    if (profile.jobTitle) lines.push(`職種・役職: ${profile.jobTitle}`);
    if (profile.organization) lines.push(`組織・会社: ${profile.organization}`);
    if (profile.teamStructure) lines.push(`チーム構成: ${profile.teamStructure}`);
    if (profile.mainResponsibilities)
      lines.push(`主な業務・責任: ${profile.mainResponsibilities}`);
    if (profile.currentChallenges)
      lines.push(`現在の課題: ${profile.currentChallenges}`);
    if (profile.goals) lines.push(`目標・やりたいこと: ${profile.goals}`);
    if (profile.keywords) lines.push(`キーワード: ${profile.keywords}`);

    lines.push(
      "",
      "【会話の進め方】",
      "- 上記の情報を前提として会話してください。ユーザーに同じことを繰り返し聞かないでください。",
      "- 曖昧な回答には「具体的にはどんな場面ですか？」など深掘りしてください。",
      "- 一度に複数の質問をせず、一つずつ丁寧に掘り下げてください。"
    );

    return lines.join("\n");
  }, [profile]);

  return (
    <UserProfileContext.Provider
      value={{ profile, isProfileComplete, updateProfile, buildSystemPrompt }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
