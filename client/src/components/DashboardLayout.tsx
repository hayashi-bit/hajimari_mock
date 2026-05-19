import type { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import ProtectedRoute from "./ProtectedRoute";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        {/* Main content - offset for desktop sidebar */}
        <main className="flex-1 lg:ml-60 transition-all duration-300">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
