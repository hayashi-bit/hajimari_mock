import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import BarChartWidget from "@/components/dashboard/BarChartWidget";
import LineChartWidget from "@/components/dashboard/LineChartWidget";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import {
  DollarSign,
  Users,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";

const stats = [
  {
    label: "Total Revenue",
    value: "$94,200",
    change: "+12.5% from last month",
    positive: true,
    Icon: DollarSign,
    color: "bg-[#F87C62]/10 text-[#F87C62]",
  },
  {
    label: "Active Users",
    value: "3,842",
    change: "+8.2% from last month",
    positive: true,
    Icon: Users,
    color: "bg-[#0F3752]/10 text-[#0F3752]",
  },
  {
    label: "Completed Tasks",
    value: "1,284",
    change: "+3.7% from last month",
    positive: true,
    Icon: CheckCircle2,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    label: "Bounce Rate",
    value: "24.8%",
    change: "-2.1% from last month",
    positive: true,
    Icon: TrendingDown,
    color: "bg-amber-500/10 text-amber-600",
  },
];

const recentActivity = [
  {
    id: 1,
    user: "Alice Johnson",
    action: "Completed task",
    target: "Q3 Report Draft",
    time: "2 minutes ago",
    avatar: "AJ",
    color: "bg-[#F87C62]",
  },
  {
    id: 2,
    user: "Bob Chen",
    action: "Added event",
    target: "Team Sync Meeting",
    time: "15 minutes ago",
    avatar: "BC",
    color: "bg-[#0F3752]",
  },
  {
    id: 3,
    user: "Carol Smith",
    action: "Updated task",
    target: "Website Redesign",
    time: "1 hour ago",
    avatar: "CS",
    color: "bg-emerald-500",
  },
  {
    id: 4,
    user: "David Park",
    action: "Commented on",
    target: "Sprint Planning",
    time: "3 hours ago",
    avatar: "DP",
    color: "bg-amber-500",
  },
  {
    id: 5,
    user: "Elena Torres",
    action: "Created task",
    target: "API Integration",
    time: "5 hours ago",
    avatar: "ET",
    color: "bg-purple-500",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "User";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4"
            >
              <div className={`p-3 rounded-xl ${stat.color} shrink-0`}>
                <stat.Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500 truncate">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">
                  {stat.value}
                </p>
                <p
                  className={`text-xs mt-1 font-medium ${
                    stat.positive ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BarChartWidget />
          <LineChartWidget />
        </div>

        {/* Charts + Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <PieChartWidget />
          </div>

          {/* Recent Activity */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Recent Activity
              </h3>
              <p className="text-slate-500 text-sm mt-0.5">
                Latest actions from your team
              </p>
            </div>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div
                    className={`w-9 h-9 rounded-full ${item.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                  >
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">
                      <span className="font-semibold">{item.user}</span>{" "}
                      <span className="text-slate-500">{item.action}</span>{" "}
                      <span className="font-medium text-[#F87C62]">
                        {item.target}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
