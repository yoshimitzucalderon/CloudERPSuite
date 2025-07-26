import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle, XCircle, Clock, FileText, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AuthorizationWorkflow, Project, InsertAuthorizationWorkflow } from "@shared/schema";
import { insertAuthorizationWorkflowSchema } from "@shared/schema";

export default function Authorizations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workflows = [], isLoading } = useQuery<AuthorizationWorkflow[]>({
    queryKey: ["/api/authorizations", selectedProject],
    enabled: !!selectedProject,
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (data: InsertAuthorizationWorkflow) => apiRequest("/api/authorizations", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorizations"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Éxito",
        description: "Workflow de autorización creado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el workflow de autorización",
        variant: "destructive",
      });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertAuthorizationWorkflow> }) =>
      apiRequest(`/api/authorizations/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorizations"] });
      toast({
        title: "Éxito",
        description: "Estado de autorización actualizado",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el workflow",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertAuthorizationWorkflow>({
    resolver: zodResolver(insertAuthorizationWorkflowSchema),
    defaultValues: {
      projectId: "",
      workflowType: "presupuesto",
      title: "",
      description: "",
      amount: "0",
      requestedBy: "",
      currentApprover: "",
      status: "pendiente",
      priority: "media",
    },
  });

  const onSubmit = (data: InsertAuthorizationWorkflow) => {
    createWorkflowMutation.mutate(data);
  };

  const handleApprove = (workflowId: string) => {
    updateWorkflowMutation.mutate({
      id: workflowId,
      data: { status: "aprobado" }
    });
  };

  const handleReject = (workflowId: string) => {
    updateWorkflowMutation.mutate({
      id: workflowId,
      data: { status: "rechazado" }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprobado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "rechazado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "en_revision":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case "presupuesto":
        return <DollarSign className="h-4 w-4" />;
      case "contrato":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Autorizaciones</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona workflows de autorización para presupuestos, contratos y pagos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Autorización
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Workflow de Autorización</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proyecto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
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
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de workflow" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="presupuesto">Presupuesto</SelectItem>
                            <SelectItem value="contrato">Contrato</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="cambio_orden">Cambio de Orden</SelectItem>
                            <SelectItem value="compra">Compra</SelectItem>
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
                        <Textarea placeholder="Descripción detallada" {...field} value={field.value || ""} />
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
                          <Input type="number" placeholder="0.00" {...field} value={field.value || ""} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value || "media"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
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

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-filter">Proyecto</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los proyectos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los proyectos</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-9">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Cargando workflows...</div>
            </div>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No hay workflows de autorización
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedProject ? "Este proyecto no tiene workflows de autorización" : "Selecciona un proyecto para ver los workflows"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          {getWorkflowIcon(workflow.workflowType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{workflow.title}</h3>
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline">
                              {workflow.workflowType.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {workflow.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Monto: ${workflow.amount || "0"}</span>
                            <span>Prioridad: {workflow.priority || "media"}</span>
                            <span>
                              Creado: {new Date(workflow.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {workflow.status === "pendiente" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(workflow.id)}
                            disabled={updateWorkflowMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(workflow.id)}
                            disabled={updateWorkflowMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}