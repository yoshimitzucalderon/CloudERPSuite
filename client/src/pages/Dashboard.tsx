import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/MetricCard";
import ProjectTable from "@/components/ProjectTable";
import CriticalActivities from "@/components/CriticalActivities";
import QuickActions from "@/components/QuickActions";
import ProjectChart from "@/components/ProjectChart";
import BudgetChart from "@/components/BudgetChart";
import { Building, DollarSign, FileText, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  if (metricsLoading || projectsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(0)}M`;
    }
    return `$${num.toLocaleString()}`;
  };

  return (
    <main className="p-6 space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Proyectos Activos"
          value={metrics?.activeProjects?.toString() || "0"}
          icon={Building}
          trend="+2 este mes"
          trendUp={true}
          color="blue"
        />
        
        <MetricCard
          title="Presupuesto Total"
          value={formatCurrency(metrics?.totalBudget || "0")}
          icon={DollarSign}
          trend="+15% vs anterior"
          trendUp={true}
          color="green"
        />
        
        <MetricCard
          title="Trámites Pendientes"
          value={metrics?.pendingPermits?.toString() || "0"}
          icon={FileText}
          trend="3 críticos"
          trendUp={false}
          color="orange"
        />
        
        <MetricCard
          title="Unidades Vendidas"
          value="156"
          icon={Home}
          trend="78% del objetivo"
          trendUp={true}
          color="purple"
        />
      </div>

      {/* Charts and Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectChart />
        <BudgetChart />
      </div>

      {/* Recent Projects and Critical Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectTable projects={projects || []} />
        </div>
        <CriticalActivities activities={metrics?.criticalActivities || []} />
      </div>

      {/* Quick Actions Grid */}
      <QuickActions />
    </main>
  );
}
