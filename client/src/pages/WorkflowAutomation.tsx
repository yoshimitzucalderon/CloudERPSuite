import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Brain, 
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function WorkflowAutomation() {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch workflow templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/workflow-templates'],
  });

  // Fetch workflow instances
  const { data: instances, isLoading: instancesLoading } = useQuery({
    queryKey: ['/api/workflow-instances'],
  });

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/notifications'],
  });

  // Fetch AI automation rules
  const { data: aiRules, isLoading: aiRulesLoading } = useQuery({
    queryKey: ['/api/ai-automation-rules'],
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (workflow: any) => {
      return await apiRequest('/api/workflow-templates', {
        method: 'POST',
        body: JSON.stringify(workflow),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-templates'] });
      setShowCreateDialog(false);
    },
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: async ({ templateId, context }: any) => {
      return await apiRequest(`/api/workflow-templates/${templateId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ context }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-instances'] });
    },
  });

  if (templatesLoading || instancesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automatización de Procesos</h1>
          <p className="text-gray-600">Workflows inteligentes y automatización con IA</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Workflow</DialogTitle>
            </DialogHeader>
            <WorkflowTemplateForm 
              onSubmit={(data) => createWorkflowMutation.mutate(data)}
              isLoading={createWorkflowMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="instances">Ejecuciones</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="ai-rules">Reglas IA</TabsTrigger>
        </TabsList>

        {/* Workflow Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(templates as any[])?.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Settings className="h-4 w-4 mr-2" />
                      {template.triggerType} • {template.steps?.length || 0} pasos
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => executeWorkflowMutation.mutate({
                          templateId: template.id,
                          context: { entityType: 'manual', entityId: 'test' }
                        })}
                        disabled={executeWorkflowMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Ejecutar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!templates || templates.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No hay plantillas de workflow</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera plantilla para automatizar procesos
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Plantilla
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Workflow Instances */}
        <TabsContent value="instances" className="space-y-6">
          <div className="space-y-4">
            {(instances as any[])?.map((instance) => (
              <Card key={instance.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{instance.name}</h3>
                        <Badge variant={getStatusColor(instance.status)}>
                          {instance.status}
                        </Badge>
                        <Badge variant={getPriorityColor(instance.priority)}>
                          {instance.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Iniciado: {new Date(instance.startedAt).toLocaleString()}
                        {instance.completedAt && (
                          <span className="ml-4">
                            Completado: {new Date(instance.completedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {instance.status === 'running' && (
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 animate-pulse text-blue-500" />
                          <span className="text-sm">Paso {instance.currentStep + 1}</span>
                        </div>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Detalles
                      </Button>
                    </div>
                  </div>
                  
                  {instance.status === 'running' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progreso</span>
                        <span>{Math.round((instance.currentStep / (instance.totalSteps || 5)) * 100)}%</span>
                      </div>
                      <Progress value={(instance.currentStep / (instance.totalSteps || 5)) * 100} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {(!instances || instances.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No hay ejecuciones activas</h3>
                <p className="text-muted-foreground">
                  Las ejecuciones de workflows aparecerán aquí
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Smart Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="space-y-4">
            {(notifications as any[])?.map((notification) => (
              <Card key={notification.id} className={notification.isRead ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'ai_insight' ? (
                        <Brain className="h-5 w-5 text-purple-500" />
                      ) : (
                        <Bell className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{notification.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      {notification.actionRequired && (
                        <Button size="sm" className="mt-2">
                          Tomar Acción
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!notifications || notifications.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No hay notificaciones</h3>
                <p className="text-muted-foreground">
                  Las notificaciones inteligentes aparecerán aquí
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Automation Rules */}
        <TabsContent value="ai-rules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(aiRules as any[])?.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-purple-500" />
                        {rule.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.description}
                      </p>
                    </div>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confianza mínima:</span>
                        <span>{(rule.confidence_threshold * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Activaciones:</span>
                        <span>{rule.triggerCount}</span>
                      </div>
                      {rule.lastTriggered && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Última activación:</span>
                          <span>{new Date(rule.lastTriggered).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!aiRules || aiRules.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No hay reglas de IA configuradas</h3>
                <p className="text-muted-foreground mb-4">
                  Configura reglas inteligentes para automatizar decisiones
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Regla IA
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

// Component for creating workflow templates
function WorkflowTemplateForm({ onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    triggerType: 'manual',
    steps: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nombre del workflow"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción del workflow"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Categoría</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">Financiero</SelectItem>
              <SelectItem value="project">Proyecto</SelectItem>
              <SelectItem value="permit">Permisos</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Tipo de Activación</label>
          <Select
            value={formData.triggerType}
            onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="scheduled">Programado</SelectItem>
              <SelectItem value="event">Por Evento</SelectItem>
              <SelectItem value="ai_driven">Dirigido por IA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Workflow'}
        </Button>
      </div>
    </form>
  );
}