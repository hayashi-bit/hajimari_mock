import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Docs from "./pages/Docs";
import Ideas from "./pages/Ideas";
import ChatPreview from "./pages/ChatPreview";
import Chat from "./pages/Chat";
import History from "./pages/History";
import Voices from "./pages/Voices";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/docs"} component={Docs} />
      <Route path={"/ideas"} component={Ideas} />
      <Route path={"/chat-preview"} component={ChatPreview} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/history"} component={History} />
      <Route path={"/voices"} component={Voices} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
