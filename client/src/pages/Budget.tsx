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
import { insertBudgetItemSchema, type Project, type BudgetItem, type BudgetCategory, type InsertBudgetItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, TrendingUp, TrendingDown, Calculator } from "lucide-react";

export default function Budget() {
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/budget/categories"],
  });

  const { data: budgetItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/budget/items", projectFilter],
    queryFn: () => projectFilter === "all" ? [] : fetch(`/api/budget/items/${projectFilter}`).then(res => res.json()),
    enabled: projectFilter !== "all",
  });

  const createBudgetItemMutation = useMutation({
    mutationFn: async (data: InsertBudgetItem) => {
      await apiRequest("POST", "/api/budget/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/items"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Partida creada",
        description: "La partida presupuestal se ha creado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la partida presupuestal.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertBudgetItem>({
    resolver: zodResolver(insertBudgetItemSchema),
    defaultValues: {
      name: "",
      projectId: "",
      categoryId: "",
      budgetedAmount: "0",
      actualAmount: "0",
      commitedAmount: "0",
      description: "",
    },
  });

  const onSubmit = (data: InsertBudgetItem) => {
    createBudgetItemMutation.mutate(data);
  };

  const filteredItems = budgetItems.filter((item: BudgetItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c: BudgetCategory) => c.id === categoryId);
    return category?.name || "Categoría no encontrada";
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || "Proyecto no encontrado";
  };

  const calculateTotals = () => {
    const totals = filteredItems.reduce((acc: any, item: BudgetItem) => {
      const budgeted = parseFloat(item.budgetedAmount || "0");
      const actual = parseFloat(item.actualAmount || "0");
      const committed = parseFloat(item.commitedAmount || "0");
      
      return {
        budgeted: acc.budgeted + budgeted,
        actual: acc.actual + actual,
        committed: acc.committed + committed,
      };
    }, { budgeted: 0, actual: 0, committed: 0 });

    return {
      ...totals,
      variance: totals.actual - totals.budgeted,
      available: totals.budgeted - totals.committed,
    };
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (projectsLoading || categoriesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Presupuestos</h1>
        </div>
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
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Partida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Partida Presupuestal</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            {projects.map((project: Project) => (
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

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category: BudgetCategory) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Partida</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Excavación y cimentación" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Presupuestado</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} value={field.value || ""} />
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
                        <Textarea placeholder="Descripción de la partida..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createBudgetItemMutation.isPending}>
                    {createBudgetItemMutation.isPending ? "Creando..." : "Crear Partida"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.budgeted)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Real</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.actual)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comprometido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.committed)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variación</CardTitle>
            {totals.variance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.variance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Buscar partidas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por proyecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proyectos</SelectItem>
            {projects.map((project: Project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category: BudgetCategory) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget Items */}
      {projectFilter === "all" ? (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Selecciona un Proyecto</h3>
            <p>Selecciona un proyecto para ver las partidas presupuestales</p>
          </div>
        </Card>
      ) : itemsLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No hay partidas presupuestales</h3>
            <p>Crea la primera partida presupuestal para este proyecto</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item: BudgetItem) => (
            <Card key={item.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{getCategoryName(item.categoryId)}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Presupuestado</p>
                      <p className="font-semibold">{formatCurrency(parseFloat(item.budgetedAmount || "0"))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Real</p>
                      <p className="font-semibold">{formatCurrency(parseFloat(item.actualAmount || "0"))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Comprometido</p>
                      <p className="font-semibold">{formatCurrency(parseFloat(item.commitedAmount || "0"))}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    {getProjectName(item.projectId)}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {(() => {
                      const budgeted = parseFloat(item.budgetedAmount || "0");
                      const actual = parseFloat(item.actualAmount || "0");
                      const variance = actual - budgeted;
                      const percentage = budgeted > 0 ? ((variance / budgeted) * 100) : 0;
                      
                      return variance === 0 ? (
                        <span className="text-gray-600">En presupuesto</span>
                      ) : variance > 0 ? (
                        <span className="text-red-600">+{percentage.toFixed(1)}%</span>
                      ) : (
                        <span className="text-green-600">{percentage.toFixed(1)}%</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}