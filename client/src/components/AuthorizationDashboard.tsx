import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Timer,
  FileText,
} from "lucide-react";

export function AuthorizationMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/authorization-metrics'],
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const {
    totalWorkflows = 0,
    pendingWorkflows = 0,
    approvedWorkflows = 0,
    rejectedWorkflows = 0,
    averageApprovalTime = 0,
    escalatedWorkflows = 0,
    activeApprovers = 0,
    approvalRate = 0,
  } = metrics || {};

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Todos los workflows creados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Completados exitosamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              No aprobados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageApprovalTime}h</div>
            <p className="text-xs text-muted-foreground">
              Para completar aprobaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{escalatedWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Workflows escalados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadores Activos</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{activeApprovers}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios con permisos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tasa de Aprobación
          </CardTitle>
          <CardDescription>
            Porcentaje de workflows aprobados vs rechazados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aprobación</span>
              <span className="text-sm text-muted-foreground">{approvalRate}%</span>
            </div>
            <Progress value={approvalRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RecentActivity() {
  const { data: recentWorkflows, isLoading } = useQuery({
    queryKey: ['/api/authorization-workflows/recent'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'aprobado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rechazado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>
          Últimos workflows procesados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(recentWorkflows as any[])?.map((workflow: any) => (
            <div key={workflow.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getStatusIcon(workflow.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {workflow.title}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Badge variant="outline" className="text-xs capitalize">
                    {workflow.workflowType.replace('_', ' ')}
                  </Badge>
                  <span>${workflow.amount}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-xs text-gray-500">
                {getTimeAgo(workflow.updatedAt)}
              </div>
            </div>
          ))}
          
          {(!recentWorkflows || (recentWorkflows as any[]).length === 0) && (
            <div className="text-center py-4 text-gray-500">
              No hay actividad reciente
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}