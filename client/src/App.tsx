import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Docs from "./pages/Docs";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import TasksPage from "./pages/Tasks";
import CalendarPage from "./pages/CalendarPage";
import GitViewer from "./pages/GitViewer";

function Router() {
  return (
    <Switch>
      {/* Auth */}
      <Route path="/login" component={LoginPage} />

      {/* Dashboard routes */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/calendar" component={CalendarPage} />

      {/* Legacy / existing routes */}
      <Route path="/" component={Home} />
      <Route path="/docs" component={Docs} />
      <Route path="/git" component={GitViewer} />
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
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
