import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Zap,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  MessageCircle,
  UserCog,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/chat", label: "AIチャット", icon: MessageCircle },
  { href: "/profile", label: "プロフィール", icon: UserCog },
];

export default function DashboardSidebar() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#F87C62] shrink-0 shadow-lg shadow-orange-500/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-bold text-lg leading-none">Hajimari</span>
            <p className="text-slate-400 text-xs mt-0.5">Dashboard</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p
          className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ${
            collapsed ? "text-center" : "px-2"
          }`}
        >
          {collapsed ? "•••" : "Menu"}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                isActive
                  ? "bg-[#F87C62] text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-700">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700/50 p-3">
        {user && (
          <div
            className={`flex items-center gap-3 px-2 py-2 mb-2 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F87C62] to-[#0F3752] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={signOut}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700/50 shadow-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700/50 transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 z-50 w-6 h-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-md"
        >
          <ChevronLeft
            className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
