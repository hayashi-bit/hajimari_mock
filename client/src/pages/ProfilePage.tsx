import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useUserProfile, type UserProfile } from "@/contexts/UserProfileContext";
import { CheckCircle2, AlertCircle, User, Building2, Target, Wrench, Tags } from "lucide-react";

const FIELDS: {
  key: keyof UserProfile;
  label: string;
  placeholder: string;
  multiline?: boolean;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    key: "name",
    label: "名前",
    placeholder: "例：山田 太郎",
    icon: User,
    description: "AIがあなたの名前を呼べるようになります",
  },
  {
    key: "jobTitle",
    label: "職種・役職",
    placeholder: "例：新規事業担当 / コミュニティマネージャー",
    icon: User,
    description: "あなたの仕事の立場を教えてください",
  },
  {
    key: "organization",
    label: "組織・会社",
    placeholder: "例：〇〇株式会社 新規事業部",
    icon: Building2,
    description: "所属している組織や会社",
  },
  {
    key: "teamStructure",
    label: "チーム構成",
    placeholder: "例：事務局3名、プロモ担当2名、外部パートナー複数",
    icon: Building2,
    description: "一緒に働く人たちの構成",
  },
  {
    key: "mainResponsibilities",
    label: "主な業務・責任",
    placeholder: "例：コミュニティの事務局運営、プロモーション、広報。東芝の新規事業担当との連携、関係商材のプロモと広報。",
    multiline: true,
    icon: Wrench,
    description: "日常の業務内容をできるだけ具体的に",
  },
  {
    key: "currentChallenges",
    label: "現在の課題・悩み",
    placeholder: "例：説明コストが高く、初対面の人に仕事を理解してもらうのが難しい",
    multiline: true,
    icon: AlertCircle,
    description: "今感じているしんどさや壁",
  },
  {
    key: "goals",
    label: "目標・やりたいこと",
    placeholder: "例：自分の強みを言語化して、もっと戦略的に動けるようになりたい",
    multiline: true,
    icon: Target,
    description: "これから実現したいこと",
  },
  {
    key: "keywords",
    label: "キーワード（任意）",
    placeholder: "例：コミュニティ、新規事業、広報、プロモーション",
    icon: Tags,
    description: "自分の仕事に関連するキーワード",
  },
];

export default function ProfilePage() {
  const { profile, updateProfile, isProfileComplete } = useUserProfile();
  const [, navigate] = useLocation();
  const [saved, setSaved] = useState(false);

  function handleChange(key: keyof UserProfile, value: string) {
    updateProfile({ [key]: value });
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">プロフィール設定</h1>
          <p className="text-slate-500 mt-1 text-sm">
            ここに登録した情報をもとに、AIがあなたの仕事を理解した状態でチャットを始めます。
            毎回ゼロから説明する手間がなくなります。
          </p>
        </div>

        {/* Completion status */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
            isProfileComplete
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {isProfileComplete ? (
            <>
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>プロフィールが設定されています。チャットで活用できます。</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                「職種・役職」と「主な業務・責任」を入力するとチャットで活用できます。
              </span>
            </>
          )}
        </div>

        {/* Form */}
        <div className="space-y-5">
          {FIELDS.map(({ key, label, placeholder, multiline, icon: Icon, description }) => (
            <div key={key} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-[#F87C62]" />
                <label className="text-sm font-semibold text-slate-700">{label}</label>
              </div>
              <p className="text-xs text-slate-400 mb-3">{description}</p>
              {multiline ? (
                <textarea
                  rows={3}
                  value={profile[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#F87C62]/30 focus:border-[#F87C62] transition"
                />
              ) : (
                <input
                  type="text"
                  value={profile[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm text-slate-700 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F87C62]/30 focus:border-[#F87C62] transition"
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          <div className="h-6">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                保存しました
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#F87C62] text-white text-sm font-semibold rounded-xl hover:bg-[#e66a50] transition shadow-md shadow-orange-200"
            >
              保存する
            </button>
            {isProfileComplete && (
              <button
                onClick={() => navigate("/chat")}
                className="px-5 py-2.5 bg-[#0F3752] text-white text-sm font-semibold rounded-xl hover:bg-[#0d2f46] transition shadow-md shadow-slate-300"
              >
                チャットへ →
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
