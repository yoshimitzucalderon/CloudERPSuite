import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  Settings,
  ArrowUp,
  ArrowDown,
  Calendar,
  Bell,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { AuthorizationMetrics, RecentActivity } from "@/components/AuthorizationDashboard";
import { DelegationManager } from "@/components/DelegationManager";
import { EscalationDashboard } from "@/components/EscalationDashboard";

// Schema for multi-level workflow creation
const multiLevelWorkflowSchema = z.object({
  projectId: z.string().optional(),
  workflowType: z.enum(['pago', 'contratacion', 'orden_cambio', 'liberacion_credito', 'capital_call']),
  title: z.string().min(1, "Título es requerido"),
  description: z.string().optional(),
  amount: z.string().min(1, "Monto es requerido"),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
});

type MultiLevelWorkflowData = z.infer<typeof multiLevelWorkflowSchema>;

// Authorization Matrix Component
function AuthorizationMatrix() {
  const { data: matrix, isLoading } = useQuery({
    queryKey: ['/api/authorization-matrix'],
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded-lg"></div>;
  }

  const groupedMatrix = (matrix as any[])?.reduce((acc: any, item: any) => {
    if (!acc[item.workflowType]) {
      acc[item.workflowType] = [];
    }
    acc[item.workflowType].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Matriz de Autorización</h3>
      <div className="grid gap-4">
        {Object.entries(groupedMatrix || {}).map(([type, rules]: [string, any]) => (
          <Card key={type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize">
                {type.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.map((rule: any) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {rule.requiredLevel}
                      </Badge>
                      <span className="text-gray-600">
                        ${rule.minAmount} - {rule.maxAmount ? `$${rule.maxAmount}` : '∞'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{rule.escalationHours}h</span>
                      {rule.requiresSequential && (
                        <Badge variant="secondary" className="text-xs">
                          Secuencial
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Pending Approvals Component
function PendingApprovals() {
  const { data: pendingWorkflows, isLoading } = useQuery({
    queryKey: ['/api/pending-approvals'],
  });

  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: async ({ workflowId, action, comments }: { workflowId: string; action: string; comments?: string }) => {
      const response = await fetch(`/api/authorization-workflows/${workflowId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments }),
      });
      if (!response.ok) throw new Error('Failed to process approval');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/authorization-workflows'] });
      toast({
        title: "Acción completada",
        description: "La decisión de aprobación ha sido procesada.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo procesar la acción.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pendientes de Aprobación</h3>
      {(pendingWorkflows as any[])?.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-gray-500">
            <CheckCircle className="h-5 w-5 mr-2" />
            No hay autorizaciones pendientes
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(pendingWorkflows as any[])?.map((workflow: any) => (
            <Card key={workflow.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{workflow.title}</h4>
                      <Badge variant="outline" className="capitalize">
                        {workflow.workflowType.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={workflow.priority === 'high' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {workflow.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{workflow.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${workflow.amount}
                      </span>
                      {workflow.dueDate && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(workflow.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => approveMutation.mutate({
                        workflowId: workflow.id,
                        action: 'approve',
                      })}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => approveMutation.mutate({
                        workflowId: workflow.id,
                        action: 'reject',
                        comments: 'Rechazado por el aprobador',
                      })}
                      disabled={approveMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Workflow Notifications Component
function WorkflowNotifications() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/workflow-notifications'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/workflow-notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-notifications'] });
    },
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notificaciones</h3>
      {(notifications as any[])?.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-gray-500">
            <Bell className="h-5 w-5 mr-2" />
            No hay notificaciones
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(notifications as any[])?.map((notification: any) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors ${
                !notification.readAt ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => {
                if (!notification.readAt) {
                  markAsReadMutation.mutate(notification.id);
                }
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {notification.notificationType === 'escalation' ? (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    ) : notification.notificationType === 'reminder' ? (
                      <Clock className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Bell className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.readAt && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Main Advanced Authorizations Component
export default function AuthorizationsAdvanced() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['/api/authorization-workflows'],
  });

  const form = useForm<MultiLevelWorkflowData>({
    resolver: zodResolver(multiLevelWorkflowSchema),
    defaultValues: {
      workflowType: 'pago',
      priority: 'medium',
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: MultiLevelWorkflowData) => {
      const response = await fetch('/api/authorizations/multi-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create workflow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/authorization-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pending-approvals'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Workflow creado",
        description: "El workflow multinivel ha sido creado con éxito.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el workflow.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MultiLevelWorkflowData) => {
    createWorkflowMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'en_revision':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'aprobado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rechazado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case 'pago':
        return <DollarSign className="h-4 w-4" />;
      case 'contratacion':
        return <FileText className="h-4 w-4" />;
      case 'orden_cambio':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sistema de Autorizaciones Avanzado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestión multinivel de workflows con escalamiento automático y delegación de autoridad
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Workflow Multinivel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Workflow Multinivel</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proyecto (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(projects as any[])?.map((project: any) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workflowType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Workflow</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de workflow" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="contratacion">Contratación</SelectItem>
                            <SelectItem value="orden_cambio">Orden de Cambio</SelectItem>
                            <SelectItem value="liberacion_credito">Liberación de Crédito</SelectItem>
                            <SelectItem value="capital_call">Capital Call</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título del workflow" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción detallada" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha límite (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createWorkflowMutation.isPending}>
                    {createWorkflowMutation.isPending ? "Creando..." : "Crear Workflow"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="matrix">Matriz</TabsTrigger>
          <TabsTrigger value="delegations">Delegaciones</TabsTrigger>
          <TabsTrigger value="escalation">Escalamiento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <div className="space-y-6">
            <AuthorizationMetrics />
            <div className="grid gap-6 md:grid-cols-2">
              <RecentActivity />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          <PendingApprovals />
        </TabsContent>
        
        <TabsContent value="workflows">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Todos los Workflows</h3>
            {workflowsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {(workflows as any[])?.map((workflow: any) => (
                  <Card key={workflow.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {getWorkflowIcon(workflow.workflowType)}
                            <h4 className="font-medium">{workflow.title}</h4>
                            <Badge variant="outline" className="capitalize">
                              {workflow.workflowType.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{workflow.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${workflow.amount}
                            </span>
                            <span>
                              Creado: {new Date(workflow.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(workflow.status)}
                          <Badge 
                            variant={
                              workflow.status === 'aprobado' ? 'default' :
                              workflow.status === 'rechazado' ? 'destructive' :
                              'secondary'
                            }
                            className="capitalize"
                          >
                            {workflow.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="matrix">
          <AuthorizationMatrix />
        </TabsContent>
        
        <TabsContent value="delegations">
          <DelegationManager />
        </TabsContent>
        
        <TabsContent value="escalation">
          <EscalationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}