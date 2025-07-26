import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowUp
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface EscalationStats {
  total: number;
  byType: Array<{
    type: string;
    count: number;
  }>;
}

interface WorkflowAtRisk {
  id: string;
  title: string;
  workflowType: string;
  amount: string;
  createdAt: string;
  status: string;
  currentApprover?: string;
}

export function EscalationDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch escalation statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<EscalationStats>({
    queryKey: ['/api/escalations/stats'],
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  // Fetch workflows at risk
  const { data: workflowsAtRisk, isLoading: workflowsLoading } = useQuery<WorkflowAtRisk[]>({
    queryKey: ['/api/escalations/at-risk'],
    refetchInterval: 60000, // Refrescar cada minuto
  });

  // Manual escalation trigger
  const triggerEscalationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/escalations/trigger', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to trigger escalations');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/escalations/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/escalations/at-risk'] });
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
    },
  });

  const handleTriggerEscalation = () => {
    setIsProcessing(true);
    triggerEscalationMutation.mutate();
  };

  const getPriorityColor = (hours: number) => {
    if (hours >= 72) return "destructive";
    if (hours >= 48) return "secondary";
    if (hours >= 24) return "default";
    return "outline";
  };

  const getPriorityIcon = (hours: number) => {
    if (hours >= 72) return <AlertTriangle className="h-4 w-4" />;
    if (hours >= 48) return <Clock className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const getHoursElapsed = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
  };

  const getTypeDisplayName = (type: string) => {
    const names: Record<string, string> = {
      reminder: 'Recordatorios',
      escalation: 'Escalamientos',
      final_escalation: 'Escalamientos Críticos',
    };
    return names[type] || type;
  };

  if (statsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar las estadísticas de escalamiento. Intente nuevamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Sistema de Escalamiento</h2>
          <p className="text-sm text-muted-foreground">
            Monitoreo automático y gestión de escalamientos
          </p>
        </div>
        <Button 
          size="sm"
          onClick={handleTriggerEscalation}
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Zap className="h-3 w-3" />
          )}
          {isProcessing ? 'Procesando...' : 'Procesar'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Escalamientos</CardTitle>
            <ArrowUp className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-semibold">
              {statsLoading ? '...' : stats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Histórico acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Workflows en Riesgo</CardTitle>
            <Clock className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-semibold">
              {workflowsLoading ? '...' : workflowsAtRisk?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención urgente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Recordatorios</CardTitle>
            <CheckCircle className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-semibold">
              {statsLoading ? '...' : stats?.byType?.find(t => t.type === 'reminder')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Notificaciones enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Escalamientos Críticos</CardTitle>
            <XCircle className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-semibold">
              {statsLoading ? '...' : stats?.byType?.find(t => t.type === 'final_escalation')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren acción ejecutiva
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Escalation Types Breakdown */}
      {stats && stats.byType && stats.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Escalamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byType.map((item) => {
                const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                return (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{getTypeDisplayName(item.type)}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows at Risk */}
      {workflowsAtRisk && workflowsAtRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Workflows Próximos a Escalamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflowsAtRisk.map((workflow) => {
                const hoursElapsed = getHoursElapsed(workflow.createdAt);
                return (
                  <div 
                    key={workflow.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{workflow.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Tipo: {workflow.workflowType.replace('_', ' ').toUpperCase()} • 
                        Monto: ${workflow.amount}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getPriorityColor(hoursElapsed)} className="flex items-center gap-1">
                        {getPriorityIcon(hoursElapsed)}
                        {hoursElapsed}h pendiente
                      </Badge>
                      <Badge variant="outline">{workflow.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No workflows at risk message */}
      {workflowsAtRisk && workflowsAtRisk.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-medium">¡Excelente!</h3>
              <p className="text-muted-foreground">
                No hay workflows en riesgo de escalamiento en este momento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Indicator */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">Sistema de escalamiento activo</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Última verificación: {new Date().toLocaleTimeString()}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}