import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Calendar, 
  Users, 
  BarChart3, 
  Target, 
  AlertCircle, 
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  Network,
  PlayCircle,
  Calculator,
  Layers,
  Share2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectTask {
  id: string;
  taskName: string;
  wbsCode: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number;
  percentComplete: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  isOnCriticalPath: boolean;
  totalFloat: number;
  assignedToId?: string;
  estimatedCost?: string;
  actualCost?: string;
}

interface ProjectMilestone {
  id: string;
  milestoneName: string;
  targetDate: string;
  status: 'pending' | 'achieved' | 'delayed' | 'cancelled';
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function ProjectManagement() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Fetch project tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'tasks'],
    enabled: !!selectedProject,
  });

  // Fetch project milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'milestones'],
    enabled: !!selectedProject,
  });

  // Fetch project resources
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'resources'],
    enabled: !!selectedProject,
  });

  // Fetch project analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'analytics'],
    enabled: !!selectedProject,
  });

  // Fetch EVM data
  const { data: evmData } = useQuery({
    queryKey: ['/api/projects', selectedProject, 'evm'],
    enabled: !!selectedProject,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return apiRequest('POST', `/api/projects/${selectedProject}/tasks`, taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject, 'tasks'] });
      setShowNewTaskDialog(false);
      toast({
        title: "Tarea creada exitosamente",
        description: "La nueva tarea ha sido agregada al cronograma."
      });
    },
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      return apiRequest('POST', `/api/projects/${selectedProject}/resources`, resourceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject, 'resources'] });
      setShowResourceDialog(false);
      toast({
        title: "Recurso creado exitosamente",
        description: "El nuevo recurso ha sido agregado al proyecto."
      });
    },
  });

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (milestoneData: any) => {
      return apiRequest('POST', `/api/projects/${selectedProject}/milestones`, milestoneData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject, 'milestones'] });
      setShowMilestoneDialog(false);
      toast({
        title: "Hito creado exitosamente",
        description: "El nuevo hito ha sido agregado al proyecto."
      });
    },
  });

  // Calculate critical path mutation
  const calculateCriticalPathMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/projects/${selectedProject}/calculate-critical-path`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject, 'tasks'] });
      toast({
        title: "Ruta crítica calculada",
        description: "El análisis de ruta crítica se ha actualizado."
      });
    },
  });

  // Auto-schedule tasks mutation
  const autoScheduleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/projects/${selectedProject}/auto-schedule`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject, 'tasks'] });
      toast({
        title: "Tareas reprogramadas",
        description: "El cronograma se ha actualizado automáticamente."
      });
    },
  });

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const taskData = {
      wbsCode: formData.get('wbsCode') as string,
      taskName: formData.get('taskName') as string,
      description: formData.get('description') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      priority: formData.get('priority') as string,
      assignedToId: formData.get('assignedToId') as string,
      estimatedCost: formData.get('estimatedCost') as string,
      duration: Math.ceil((new Date(formData.get('endDate') as string).getTime() - new Date(formData.get('startDate') as string).getTime()) / (1000 * 60 * 60 * 24)),
    };

    createTaskMutation.mutate(taskData);
  };

  const handleCreateResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const resourceData = {
      resourceName: formData.get('resourceName') as string,
      resourceType: formData.get('resourceType') as string,
      costPerHour: formData.get('costPerHour') as string,
      maxUnitsAvailable: formData.get('maxUnitsAvailable') as string,
    };

    createResourceMutation.mutate(resourceData);
  };

  const handleCreateMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const milestoneData = {
      milestoneName: formData.get('milestoneName') as string,
      description: formData.get('description') as string,
      targetDate: formData.get('targetDate') as string,
      criticalityLevel: formData.get('criticalityLevel') as string,
    };

    createMilestoneMutation.mutate(milestoneData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Proyectos</h1>
            <p className="text-gray-600">Sistema avanzado con Microsoft Project Integration, Gantt y ruta crítica</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => calculateCriticalPathMutation.mutate()} disabled={!selectedProject || calculateCriticalPathMutation.isPending}>
              <Calculator className="w-4 h-4 mr-2" />
              {calculateCriticalPathMutation.isPending ? 'Calculando...' : 'Calcular CPM'}
            </Button>
            <Button variant="outline" onClick={() => autoScheduleMutation.mutate()} disabled={!selectedProject || autoScheduleMutation.isPending}>
              <PlayCircle className="w-4 h-4 mr-2" />
              {autoScheduleMutation.isPending ? 'Programando...' : 'Auto-Schedule'}
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar MS Project
            </Button>
            <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
              <DialogTrigger asChild>
                <Button disabled={!selectedProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Tarea
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Tarea</DialogTitle>
                  <DialogDescription>
                    Agrega una nueva tarea al cronograma del proyecto
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <Label htmlFor="wbsCode">Código WBS</Label>
                    <Input id="wbsCode" name="wbsCode" placeholder="1.2.3" required />
                  </div>
                  <div>
                    <Label htmlFor="taskName">Nombre de la Tarea</Label>
                    <Input id="taskName" name="taskName" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Fecha Inicio</Label>
                      <Input id="startDate" name="startDate" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Fecha Fin</Label>
                      <Input id="endDate" name="endDate" type="date" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignedToId">Responsable</Label>
                    <Input id="assignedToId" name="assignedToId" placeholder="ID del usuario" />
                  </div>
                  <div>
                    <Label htmlFor="estimatedCost">Costo Estimado</Label>
                    <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending ? 'Creando...' : 'Crear Tarea'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Project Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar un proyecto para gestionar" />
              </SelectTrigger>
              <SelectContent>
                {(projects as any[]).map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedProject && (
          <Tabs defaultValue="gantt" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="gantt">Diagrama Gantt</TabsTrigger>
              <TabsTrigger value="tasks">Lista de Tareas</TabsTrigger>
              <TabsTrigger value="resources">Recursos</TabsTrigger>
              <TabsTrigger value="milestones">Hitos</TabsTrigger>
              <TabsTrigger value="critical-path">Ruta Crítica</TabsTrigger>
              <TabsTrigger value="analytics">Analíticas EVM</TabsTrigger>
            </TabsList>

            <TabsContent value="gantt">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Diagrama de Gantt Interactivo
                  </CardTitle>
                  <CardDescription>
                    Vista cronológica con ruta crítica y dependencias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-8 rounded-lg text-center">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Diagrama de Gantt</h3>
                    <p className="text-gray-600 mb-4">
                      Visualización interactiva del cronograma con drag & drop para reprogramación
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>Tareas Críticas</span>
                        </div>
                        <p className="text-gray-600">Ruta crítica calculada automáticamente</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>Dependencias</span>
                        </div>
                        <p className="text-gray-600">Relaciones FS, SS, FF, SF</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Tareas WBS</CardTitle>
                  <CardDescription>
                    Work Breakdown Structure con jerarquía y dependencias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (tasks as any[]).length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tareas</h3>
                      <p className="text-gray-600 mb-4">Crea la primera tarea para comenzar el cronograma</p>
                      <Button onClick={() => setShowNewTaskDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primera Tarea
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(tasks as ProjectTask[]).map((task: ProjectTask) => (
                        <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <span className="font-mono text-sm text-gray-500">{task.wbsCode}</span>
                              <h3 className="font-medium">{task.taskName}</h3>
                              {task.isOnCriticalPath && (
                                <Badge variant="destructive">Crítica</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Duración:</span> {task.duration} días
                            </div>
                            <div>
                              <span className="font-medium">Inicio:</span> {new Date(task.startDate).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Fin:</span> {new Date(task.endDate).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Float:</span> {task.totalFloat} días
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progreso</span>
                              <span>{task.percentComplete}%</span>
                            </div>
                            <Progress value={task.percentComplete} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gestión de Recursos
                  </CardTitle>
                  <CardDescription>
                    Personas, equipos y materiales asignados al proyecto
                  </CardDescription>
                  <Button onClick={() => setShowResourceDialog(true)} className="w-fit">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Recurso
                  </Button>
                </CardHeader>
                <CardContent>
                  {(resources as any[]).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recursos</h3>
                      <p className="text-gray-600">Agrega recursos para comenzar la asignación</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(resources as any[]).map((resource: any) => (
                        <Card key={resource.id}>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">{resource.resourceName}</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>Tipo: {resource.resourceType}</p>
                              <p>Costo/hora: ${resource.costPerHour}</p>
                              <p>Disponibilidad: {resource.maxUnitsAvailable}%</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Recurso</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateResource} className="space-y-4">
                    <div>
                      <Label htmlFor="resourceName">Nombre del Recurso</Label>
                      <Input id="resourceName" name="resourceName" required />
                    </div>
                    <div>
                      <Label htmlFor="resourceType">Tipo</Label>
                      <Select name="resourceType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="human">Persona</SelectItem>
                          <SelectItem value="equipment">Equipo</SelectItem>
                          <SelectItem value="material">Material</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="costPerHour">Costo por Hora</Label>
                      <Input id="costPerHour" name="costPerHour" type="number" step="0.01" />
                    </div>
                    <div>
                      <Label htmlFor="maxUnitsAvailable">Disponibilidad (%)</Label>
                      <Input id="maxUnitsAvailable" name="maxUnitsAvailable" type="number" min="0" max="100" defaultValue="100" />
                    </div>
                    <Button type="submit" className="w-full" disabled={createResourceMutation.isPending}>
                      {createResourceMutation.isPending ? 'Creando...' : 'Crear Recurso'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="milestones">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Hitos del Proyecto
                  </CardTitle>
                  <Button onClick={() => setShowMilestoneDialog(true)} className="w-fit">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Hito
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(milestones as any[]).length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay hitos definidos</h3>
                        <p className="text-gray-600">Los hitos ayudan a trackear el progreso del proyecto</p>
                      </div>
                    ) : (
                      (milestones as ProjectMilestone[]).map((milestone: ProjectMilestone) => (
                        <div key={milestone.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${milestone.status === 'achieved' ? 'bg-green-500' : milestone.status === 'delayed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                              <h3 className="font-medium">{milestone.milestoneName}</h3>
                              <Badge className={getMilestoneStatusColor(milestone.status)}>
                                {milestone.status}
                              </Badge>
                              <Badge variant="outline">
                                {milestone.criticalityLevel}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-600">
                              {new Date(milestone.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Hito</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateMilestone} className="space-y-4">
                    <div>
                      <Label htmlFor="milestoneName">Nombre del Hito</Label>
                      <Input id="milestoneName" name="milestoneName" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea id="description" name="description" />
                    </div>
                    <div>
                      <Label htmlFor="targetDate">Fecha Objetivo</Label>
                      <Input id="targetDate" name="targetDate" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="criticalityLevel">Nivel de Criticidad</Label>
                      <Select name="criticalityLevel" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Bajo</SelectItem>
                          <SelectItem value="medium">Medio</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                          <SelectItem value="critical">Crítico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={createMilestoneMutation.isPending}>
                      {createMilestoneMutation.isPending ? 'Creando...' : 'Crear Hito'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="critical-path">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Análisis de Ruta Crítica (CPM)
                  </CardTitle>
                  <CardDescription>
                    Critical Path Method con análisis de float y optimización
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(analytics as any)?.criticalPath?.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h3 className="font-medium text-red-800 mb-2">Tareas en Ruta Crítica</h3>
                        <p className="text-sm text-red-600 mb-3">
                          Estas tareas determinan la duración mínima del proyecto. Cualquier retraso aquí afecta la fecha de finalización.
                        </p>
                        <div className="space-y-2">
                          {((analytics as any).criticalPath as ProjectTask[]).map((task: ProjectTask) => (
                            <div key={task.id} className="bg-white p-3 rounded border border-red-300">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-sm text-gray-500">{task.wbsCode}</span>
                                  <h4 className="font-medium">{task.taskName}</h4>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {task.duration} días | Float: {task.totalFloat}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-8 rounded-lg text-center">
                      <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Ruta Crítica No Calculada</h3>
                      <p className="text-gray-600 mb-4">
                        Ejecuta el análisis CPM para identificar las tareas críticas del proyecto
                      </p>
                      <Button onClick={() => calculateCriticalPathMutation.mutate()} disabled={calculateCriticalPathMutation.isPending}>
                        <Calculator className="w-4 h-4 mr-2" />
                        {calculateCriticalPathMutation.isPending ? 'Calculando...' : 'Calcular Ruta Crítica'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Earned Value Management (EVM)
                  </CardTitle>
                  <CardDescription>
                    Análisis de valor ganado y métricas de performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {evmData ? (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {(parseFloat((evmData as any).schedulePerformanceIndex) * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-blue-600">Schedule Performance Index</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {(parseFloat((evmData as any).costPerformanceIndex) * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-green-600">Cost Performance Index</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            ${parseFloat((evmData as any).scheduleVariance).toFixed(0)}
                          </div>
                          <div className="text-sm text-orange-600">Schedule Variance</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            ${parseFloat((evmData as any).costVariance).toFixed(0)}
                          </div>
                          <div className="text-sm text-purple-600">Cost Variance</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Planned Value (PV)</h4>
                          <div className="text-xl font-bold">${parseFloat((evmData as any).plannedValue).toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Earned Value (EV)</h4>
                          <div className="text-xl font-bold">${parseFloat((evmData as any).earnedValue).toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Actual Cost (AC)</h4>
                          <div className="text-xl font-bold">${parseFloat((evmData as any).actualCost).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-8 rounded-lg text-center">
                      <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Métricas EVM</h3>
                      <p className="text-gray-600 mb-4">
                        Se requiere un baseline activo para calcular las métricas de Earned Value Management
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
