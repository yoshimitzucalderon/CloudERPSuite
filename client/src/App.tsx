import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Permits from "@/pages/Permits";
import Budget from "@/pages/Budget";
import Calendar from "@/pages/Calendar";
import Documents from "@/pages/Documents";
import Users from "@/pages/Users";
import ProjectManagement from "@/pages/ProjectManagement";
import Commercial from "@/pages/Commercial";
import AuthorizationsAdvanced from "@/pages/AuthorizationsAdvanced";
import WorkflowAutomation from "@/pages/WorkflowAutomation";
import Investors from "@/pages/Investors";
import CapitalCallDetail from "@/pages/CapitalCallDetail";
import CapitalCallApproval from "@/pages/CapitalCallApproval";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/permits" component={Permits} />
          <Route path="/budget" component={Budget} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/documents" component={Documents} />
          <Route path="/users" component={Users} />
          <Route path="/project-management" component={ProjectManagement} />
          <Route path="/commercial" component={Commercial} />
          <Route path="/authorizations" component={AuthorizationsAdvanced} />
          <Route path="/workflow-automation" component={WorkflowAutomation} />
          <Route path="/investors" component={Investors} />
          <Route path="/investors/capital-call/:id" component={CapitalCallDetail} />
          <Route path="/investors/capital-call/:id/approve" component={CapitalCallApproval} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
