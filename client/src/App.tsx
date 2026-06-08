import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AppPage from "./pages/AppPage";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import StormData from "./pages/StormData";
import Onboarding from "./pages/Onboarding";
import Fulfillment from "./pages/Fulfillment";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"} component={AppPage} />
      <Route path={"/app/:campaignId"} component={AppPage} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/storm-data"} component={StormData} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/fulfillment"} component={Fulfillment} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
