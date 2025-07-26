import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/MetricCard";
import ProjectTable from "@/components/ProjectTable";
import CriticalActivities from "@/components/CriticalActivities";
import QuickActions from "@/components/QuickActions";
import ProjectChart from "@/components/ProjectChart";
import BudgetChart from "@/components/BudgetChart";
import { Building, DollarSign, FileText, Home, Zap, Shield, BarChart3, Users, Settings, Building2, Calendar, TrendingUp } from "lucide-react";
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

      {/* Tareas Pendientes para Implementar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Zap className="h-3 w-3 mr-2 text-yellow-500" />
            Tareas Pendientes - Selecciona una para continuar
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Funcionalidades disponibles para implementar en el ERP inmobiliario
          </p>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {/* Funcionalidades del Core ERP */}
            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <Shield className="h-3 w-3 text-blue-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">Sistema de Roles y Permisos</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gestión granular de roles, permisos por módulo y jerarquías organizacionales
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <BarChart3 className="h-3 w-3 text-green-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">Reportes y Analytics</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dashboard ejecutivo, reportes financieros y análisis de rendimiento
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <FileText className="h-3 w-3 text-purple-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">Gestión Documental Avanzada</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    OCR, versionado, flujos de aprobación y firma digital
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <DollarSign className="h-3 w-3 text-emerald-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">Módulo Financiero Completo</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contabilidad, facturación, cuentas por pagar/cobrar y flujo de caja
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <Users className="h-3 w-3 text-indigo-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">CRM Inmobiliario</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gestión de clientes, leads, seguimiento de ventas y marketing
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <Settings className="h-3 w-3 text-orange-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">Automatización de Procesos</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Workflows automáticos, notificaciones inteligentes y AI
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <Building2 className="h-3 w-3 text-cyan-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">Gestión de Inventarios</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Control de materiales, proveedores, órdenes de compra y almacén
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <Calendar className="h-3 w-3 text-pink-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">Planificación Avanzada</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gantt interactivo, gestión de recursos y cronogramas dinámicos
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-3 w-3 text-red-500 mt-1" />
                <div>
                  <h4 className="text-xs font-medium">Business Intelligence</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Predicciones, análisis de mercado y KPIs ejecutivos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
