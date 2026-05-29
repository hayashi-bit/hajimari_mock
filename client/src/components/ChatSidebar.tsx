import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Heart, MessageCircle, Plus, Clock, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type HistoryItem = {
  id: number;
  theme: string | null;
  mode: string | null;
  messageCount: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function formatDate(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

function modeLabel(mode: string | null): string {
  const labels: Record<string, string> = {
    strength: "強み発見",
    worry: "悩み整理",
    service: "サービス設計",
    target: "ターゲット",
    decision: "意思決定",
    action: "行動計画",
  };
  return mode ? labels[mode] || mode : "";
}

interface ChatSidebarProps {
  onNewSession: () => void;
  onResumeSession: (sessionId: number) => void;
  currentSessionId: number | null;
}

export function ChatSidebar({ onNewSession, onResumeSession, currentSessionId }: ChatSidebarProps) {
  const { setOpenMobile, isMobile } = useSidebar();
  const { data: history, isLoading, refetch } = trpc.chat.getHistory.useQuery();

  const toggleFavMutation = trpc.chat.toggleFavorite.useMutation({
    onSuccess: () => refetch(),
    onError: () => toast.error("お気に入りの更新に失敗しました"),
  });

  const favorites = history?.filter((item) => item.isFavorite) || [];
  const recent = history?.filter((item) => !item.isFavorite) || [];

  const handleItemClick = (id: number) => {
    onResumeSession(id);
    setOpenMobile(false);
  };

  const handleNewClick = () => {
    onNewSession();
    setOpenMobile(false);
  };

  return (
    <Sidebar side="left" collapsible={isMobile ? "offcanvas" : "none"}>
      <SidebarHeader className="p-4">
        <button
          onClick={handleNewClick}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
          style={{
            background: "#FAF2F4",
            color: "#69565C",
            border: "1px solid #E9DCE0",
          }}
        >
          <Plus className="w-4 h-4" />
          新しい壁打ち
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Favorites (pinned) */}
        {favorites.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium px-3" style={{ color: "#A19097" }}>
              <Heart className="w-3 h-3 mr-1.5 inline" style={{ fill: "#C66A5A", color: "#C66A5A" }} />
              お気に入り
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favorites.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.id === currentSessionId}
                      onClick={() => handleItemClick(item.id)}
                      className="py-2.5"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm truncate">
                          {item.theme || (item.mode ? modeLabel(item.mode) : `壁打ち #${item.id}`)}
                        </span>
                        <span className="text-[10px] opacity-60">
                          {formatDate(item.createdAt)} · {item.messageCount}回
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {favorites.length > 0 && recent.length > 0 && <SidebarSeparator />}

        {/* Recent history */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium px-3" style={{ color: "#A19097" }}>
            <Clock className="w-3 h-3 mr-1.5 inline" />
            最近の壁打ち
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-3 py-4 text-center">
                  <span className="text-xs" style={{ color: "#A19097" }}>読み込み中...</span>
                </div>
              ) : recent.length === 0 && favorites.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <span className="text-xs" style={{ color: "#A19097" }}>まだ履歴がありません</span>
                </div>
              ) : (
                recent.slice(0, 20).map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.id === currentSessionId}
                      onClick={() => handleItemClick(item.id)}
                      className="py-2.5"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm truncate">
                          {item.theme || (item.mode ? modeLabel(item.mode) : `壁打ち #${item.id}`)}
                        </span>
                        <span className="text-[10px] opacity-60">
                          {formatDate(item.createdAt)} · {item.messageCount}回
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1">
        <button
          onClick={() => {
            setOpenMobile(false);
            window.location.href = "/voices";
          }}
          className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition-colors hover:bg-primary/5"
          style={{ color: "#C66A5A" }}
        >
          <Users className="w-3.5 h-3.5" />
          みんなの声
        </button>
        <button
          onClick={() => {
            setOpenMobile(false);
            window.location.href = "/history";
          }}
          className="w-full text-center text-xs py-2 rounded-lg transition-colors hover:bg-gray-50"
          style={{ color: "#A19097" }}
        >
          すべての履歴を見る
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
