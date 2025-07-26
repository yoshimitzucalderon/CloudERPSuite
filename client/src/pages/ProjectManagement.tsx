import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWbsItemSchema, type Project, type WbsItem, type InsertWbsItem, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, BarChart3, Target, Clock, TrendingUp, Users } from "lucide-react";

export default function ProjectManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [viewMode, setViewMode] = useState("gantt"); // gantt, wbs, critical
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: wbsItems = [], isLoading: wbsLoading } = useQuery({
    queryKey: ["/api/wbs", selectedProjectId],
    queryFn: () => selectedProjectId ? fetch(`/api/wbs/${selectedProjectId}`).then(res => res.json()) : [],
    enabled: !!selectedProjectId,
  });

  const createWbsItemMutation = useMutation({
    mutationFn: async (data: InsertWbsItem) => {
      await apiRequest("POST", "/api/wbs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wbs"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Actividad creada",
        description: "La actividad WBS se ha creado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la actividad WBS.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertWbsItem>({
    resolver: zodResolver(insertWbsItemSchema),
    defaultValues: {
      projectId: "",
      parentId: "",
      wbsCode: "",
      name: "",
      description: "",
      level: 1,
      duration: 1,
      progress: 0,
      budgetedCost: "0",
      actualCost: "0",
      isMilestone: false,
      isCritical: false,
      assignedTo: "",
    },
  });

  const onSubmit = (data: InsertWbsItem) => {
    // Auto-generate WBS code based on level and project
    const wbsCode = generateWbsCode(data.level || 1, wbsItems.length + 1);
    createWbsItemMutation.mutate({ ...data, wbsCode, projectId: selectedProjectId });
  };

  const generateWbsCode = (level: number, sequence: number) => {
    const levelCode = level.toString().padStart(2, '0');
    const seqCode = sequence.toString().padStart(3, '0');
    return `${levelCode}.${seqCode}`;
  };

  const getAssignedUserName = (userId: string) => {
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Sin asignar";
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || "Seleccionar proyecto";
  };

  const calculateProjectMetrics = () => {
    if (!wbsItems.length) return { totalTasks: 0, completedTasks: 0, criticalTasks: 0, totalBudget: 0 };
    
    const totalTasks = wbsItems.length;
    const completedTasks = wbsItems.filter((item: WbsItem) => item.progress === 100).length;
    const criticalTasks = wbsItems.filter((item: WbsItem) => item.isCritical).length;
    const totalBudget = wbsItems.reduce((sum: number, item: WbsItem) => 
      sum + parseFloat(item.budgetedCost || "0"), 0);
    
    return { totalTasks, completedTasks, criticalTasks, totalBudget };
  };

  const metrics = calculateProjectMetrics();

  const renderGanttView = () => {
    const sortedItems = [...wbsItems].sort((a: WbsItem, b: WbsItem) => 
      (a.wbsCode || "").localeCompare(b.wbsCode || ""));

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Diagrama de Gantt - Vista Simplificada</h3>
          <div className="space-y-2">
            {sortedItems.map((item: WbsItem) => (
              <div key={item.id} className="flex items-center space-x-4 p-3 bg-white rounded border">
                <div className="w-20 text-sm font-mono">{item.wbsCode}</div>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
                <div className="w-32 text-sm">
                  <div>Duración: {item.duration} días</div>
                  <div>Asignado: {getAssignedUserName(item.assignedTo || "")}</div>
                </div>
                <div className="w-24">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.progress === 100 ? 'bg-green-500' : 
                          item.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{item.progress}%</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {item.isMilestone && (
                    <Badge variant="outline" className="text-purple-600">Hito</Badge>
                  )}
                  {item.isCritical && (
                    <Badge variant="destructive">Crítica</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWbsView = () => {
    const groupedByLevel = wbsItems.reduce((acc: any, item: WbsItem) => {
      const level = item.level || 1;
      if (!acc[level]) acc[level] = [];
      acc[level].push(item);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(groupedByLevel).map(([level, items]: [string, any]) => (
          <div key={level} className="space-y-3">
            <h3 className="text-lg font-semibold">Nivel {level}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item: WbsItem) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm text-gray-500">{item.wbsCode}</span>
                      <div className="flex space-x-1">
                        {item.isMilestone && (
                          <Badge variant="outline" className="text-purple-600 text-xs">Hito</Badge>
                        )}
                        {item.isCritical && (
                          <Badge variant="destructive" className="text-xs">Crítica</Badge>
                        )}
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">{item.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Duración:</span>
                        <span>{item.duration} días</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Progreso:</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Presupuesto:</span>
                        <span>${parseFloat(item.budgetedCost || "0").toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Asignado:</span>
                        <span className="text-xs">{getAssignedUserName(item.assignedTo || "")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCriticalPathView = () => {
    const criticalItems = wbsItems.filter((item: WbsItem) => item.isCritical);
    
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Ruta Crítica del Proyecto</h3>
          <p className="text-red-700 text-sm">
            Actividades que no pueden retrasarse sin afectar la fecha de entrega del proyecto.
          </p>
        </div>
        {criticalItems.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No hay actividades críticas identificadas</h3>
              <p>Marca las actividades críticas en la vista WBS o Gantt</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {criticalItems.map((item: WbsItem) => (
              <Card key={item.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                          {item.wbsCode}
                        </span>
                        <h4 className="font-semibold">{item.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Duración:</span>
                          <div>{item.duration} días</div>
                        </div>
                        <div>
                          <span className="font-medium">Progreso:</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 bg-red-500 rounded-full"
                                style={{ width: `${item.progress}%` }}
                              ></div>
                            </div>
                            <span>{item.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Presupuesto:</span>
                          <div>${parseFloat(item.budgetedCost || "0").toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="font-medium">Responsable:</span>
                          <div>{getAssignedUserName(item.assignedTo || "")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (projectsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Proyectos</h1>
          <p className="text-gray-600">WBS, Gantt y Ruta Crítica para desarrollos inmobiliarios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedProjectId}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nueva Actividad WBS</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Actividad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Excavación y cimentación" {...field} value={field.value || ""} />
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
                        <Textarea placeholder="Descripción detallada..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel WBS</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" {...field} 
                            value={field.value || 1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (días)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} 
                            value={field.value || 1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="budgetedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo Presupuestado</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar responsable" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="isMilestone"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Es un Hito</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isCritical"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Actividad Crítica</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createWbsItemMutation.isPending}>
                    {createWbsItemMutation.isPending ? "Creando..." : "Crear Actividad"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto para gestionar" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: Project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {/* Project Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Actividades</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTasks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
                <div className="text-sm text-gray-500">
                  {metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0}% del total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ruta Crítica</CardTitle>
                <Target className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.criticalTasks}</div>
                <div className="text-sm text-gray-500">actividades críticas</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.totalBudget.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* View Mode Selector */}
          <div className="flex space-x-2">
            <Button 
              variant={viewMode === "gantt" ? "default" : "outline"}
              onClick={() => setViewMode("gantt")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Vista Gantt
            </Button>
            <Button 
              variant={viewMode === "wbs" ? "default" : "outline"}
              onClick={() => setViewMode("wbs")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Vista WBS
            </Button>
            <Button 
              variant={viewMode === "critical" ? "default" : "outline"}
              onClick={() => setViewMode("critical")}
            >
              <Target className="w-4 h-4 mr-2" />
              Ruta Crítica
            </Button>
          </div>

          {/* Content based on view mode */}
          {wbsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <>
              {viewMode === "gantt" && renderGanttView()}
              {viewMode === "wbs" && renderWbsView()}
              {viewMode === "critical" && renderCriticalPathView()}
            </>
          )}
        </>
      )}

      {!selectedProjectId && (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Selecciona un Proyecto</h3>
            <p>Elige un proyecto para gestionar su cronograma y actividades WBS</p>
          </div>
        </Card>
      )}
    </div>
  );
}