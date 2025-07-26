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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPermitSchema, type Permit, type InsertPermit, type Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function Permits() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: permits, isLoading: permitsLoading } = useQuery({
    queryKey: ["/api/permits"],
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const createPermitMutation = useMutation({
    mutationFn: async (data: InsertPermit) => {
      await apiRequest("POST", "/api/permits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permits"] });
      setIsDialogOpen(false);
      toast({
        title: "Trámite creado",
        description: "El trámite se ha creado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el trámite.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertPermit>({
    resolver: zodResolver(insertPermitSchema),
    defaultValues: {
      name: "",
      type: "licencia_construccion",
      status: "pendiente",
      projectId: "",
      responsiblePerson: "",
      notes: "",
    },
  });

  const onSubmit = (data: InsertPermit) => {
    createPermitMutation.mutate({
      ...data,
      requestDate: data.requestDate ? new Date(data.requestDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      cost: data.cost ? data.cost.toString() : undefined,
    });
  };

  const filteredPermits = permits?.filter((permit: Permit) => {
    const matchesSearch = permit.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || permit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const statusColors = {
      pendiente: "bg-yellow-100 text-yellow-800",
      en_revision: "bg-blue-100 text-blue-800",
      aprobado: "bg-green-100 text-green-800",
      rechazado: "bg-red-100 text-red-800",
      vencido: "bg-gray-100 text-gray-800",
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.pendiente;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pendiente: Clock,
      en_revision: AlertTriangle,
      aprobado: CheckCircle,
      rechazado: XCircle,
      vencido: XCircle,
    };
    const IconComponent = icons[status as keyof typeof icons] || Clock;
    return <IconComponent className="w-4 h-4" />;
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find((p: Project) => p.id === projectId);
    return project?.name || "Proyecto no encontrado";
  };

  if (permitsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Trámites y Permisos</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
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
          <h1 className="text-2xl font-bold text-gray-900">Trámites y Permisos</h1>
          <p className="text-gray-600">Gestión de licencias y documentación legal</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Trámite
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Trámite</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Trámite</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Licencia de Construcción" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="licencia_construccion">Licencia de Construcción</SelectItem>
                              <SelectItem value="factibilidad_servicios">Factibilidad de Servicios</SelectItem>
                              <SelectItem value="impacto_ambiental">Impacto Ambiental</SelectItem>
                              <SelectItem value="proteccion_civil">Protección Civil</SelectItem>
                              <SelectItem value="uso_suelo">Uso de Suelo</SelectItem>
                              <SelectItem value="zonificacion">Zonificación</SelectItem>
                              <SelectItem value="vialidad">Vialidad</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyecto</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proyecto" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects?.map((project: Project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Límite</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="responsiblePerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsable</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del responsable" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observaciones adicionales..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPermitMutation.isPending}>
                    {createPermitMutation.isPending ? "Creando..." : "Crear Trámite"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar trámites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_revision">En Revisión</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Permits Grid */}
      {filteredPermits?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay trámites
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all" ? "No se encontraron trámites con los filtros aplicados." : "Comienza creando tu primer trámite."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPermits?.map((permit: Permit) => (
            <Card key={permit.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{permit.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(permit.status)}>
                        {getStatusIcon(permit.status)}
                        <span className="ml-1">
                          {permit.status.charAt(0).toUpperCase() + permit.status.slice(1).replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-gray-600">Proyecto: </span>
                  <span className="font-medium">{getProjectName(permit.projectId)}</span>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-600">Tipo: </span>
                  <span className="font-medium">
                    {permit.type.replace('_', ' ').charAt(0).toUpperCase() + permit.type.replace('_', ' ').slice(1)}
                  </span>
                </div>
                
                {permit.responsiblePerson && (
                  <div className="text-sm">
                    <span className="text-gray-600">Responsable: </span>
                    <span className="font-medium">{permit.responsiblePerson}</span>
                  </div>
                )}
                
                {permit.dueDate && (
                  <div className="text-sm">
                    <span className="text-gray-600">Fecha límite: </span>
                    <span className="font-medium">
                      {new Date(permit.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {permit.cost && (
                  <div className="text-sm">
                    <span className="text-gray-600">Costo: </span>
                    <span className="font-medium">
                      ${parseFloat(permit.cost).toLocaleString()}
                    </span>
                  </div>
                )}
                
                {permit.notes && (
                  <div className="text-sm">
                    <span className="text-gray-600">Notas: </span>
                    <p className="text-gray-700 mt-1">{permit.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
