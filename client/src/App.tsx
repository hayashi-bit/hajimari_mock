import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProfileProvider } from "./contexts/UserProfileContext";
import Home from "./pages/Home";
import Docs from "./pages/Docs";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import TasksPage from "./pages/Tasks";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";

function Router() {
  return (
    <Switch>
      {/* Auth */}
      <Route path="/login" component={LoginPage} />

      {/* Dashboard routes */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/chat" component={ChatPage} />

      {/* Legacy / existing routes */}
      <Route path="/" component={Home} />
      <Route path="/docs" component={Docs} />
      <Route path="/404" component={NotFound} />

      {/* Final fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserProfileProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
        </UserProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
