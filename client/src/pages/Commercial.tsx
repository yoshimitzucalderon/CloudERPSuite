import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { insertLotSchema, insertClientSchema, insertSalesContractSchema, type Project, type Lot, type Client, type SalesContract, type InsertLot, type InsertClient, type InsertSalesContract } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Home, Users, FileText, TrendingUp, MapPin, Calculator, DollarSign } from "lucide-react";

export default function Commercial() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [viewMode, setViewMode] = useState("lots"); // lots, clients, contracts
  const [isLotDialogOpen, setIsLotDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const { toast } = useToast();

  // Data queries
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: lots = [], isLoading: lotsLoading } = useQuery({
    queryKey: ["/api/lots", selectedProjectId],
    enabled: !!selectedProjectId && viewMode === "lots",
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    enabled: viewMode === "clients" || viewMode === "contracts",
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/contracts", selectedProjectId],
    enabled: !!selectedProjectId && viewMode === "contracts",
  });

  // Forms setup
  const lotForm = useForm<InsertLot>({
    resolver: zodResolver(insertLotSchema),
    defaultValues: {
      projectId: "",
      number: "",
      area: 0,
      price: "0",
      status: "disponible",
      location: "",
    },
  });

  const clientForm = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      identificationType: "cedula",
      identificationNumber: "",
      address: "",
    },
  });

  const contractForm = useForm<InsertSalesContract>({
    resolver: zodResolver(insertSalesContractSchema),
    defaultValues: {
      projectId: "",
      lotId: "",
      clientId: "",
      salePrice: "0",
      downPayment: "0",
      financingType: "contado",
      installments: 0,
      monthlyPayment: "0",
      status: "borrador",
    },
  });

  // Mutations
  const createLotMutation = useMutation({
    mutationFn: async (data: InsertLot) => {
      await apiRequest("POST", "/api/lots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      setIsLotDialogOpen(false);
      lotForm.reset();
      toast({
        title: "Lote creado",
        description: "El lote se ha registrado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el lote.",
        variant: "destructive",
      });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      await apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsClientDialogOpen(false);
      clientForm.reset();
      toast({
        title: "Cliente registrado",
        description: "El cliente se ha registrado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar el cliente.",
        variant: "destructive",
      });
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: InsertSalesContract) => {
      await apiRequest("POST", "/api/contracts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setIsContractDialogOpen(false);
      contractForm.reset();
      toast({
        title: "Contrato creado",
        description: "El contrato de venta se ha creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el contrato.",
        variant: "destructive",
      });
    },
  });

  // Submit handlers
  const onSubmitLot = (data: InsertLot) => {
    createLotMutation.mutate({ ...data, projectId: selectedProjectId });
  };

  const onSubmitClient = (data: InsertClient) => {
    createClientMutation.mutate(data);
  };

  const onSubmitContract = (data: InsertSalesContract) => {
    createContractMutation.mutate({ ...data, projectId: selectedProjectId });
  };

  // Helper functions
  const getProjectName = (projectId: string) => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || "Proyecto";
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Cliente";
  };

  const calculateSalesMetrics = () => {
    if (!lots.length && !contracts.length) {
      return { 
        totalLots: 0, 
        availableLots: 0, 
        soldLots: 0, 
        totalSales: 0, 
        salesRate: 0 
      };
    }

    const totalLots = lots.length;
    const availableLots = lots.filter((lot: Lot) => lot.status === "disponible").length;
    const soldLots = lots.filter((lot: Lot) => lot.status === "vendido").length;
    const totalSales = contracts.reduce((sum: number, contract: SalesContract) => 
      sum + parseFloat(contract.salePrice || "0"), 0);
    const salesRate = totalLots > 0 ? Math.round((soldLots / totalLots) * 100) : 0;

    return { totalLots, availableLots, soldLots, totalSales, salesRate };
  };

  const metrics = calculateSalesMetrics();

  const renderLotsView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lots.map((lot: Lot) => (
          <Card key={lot.id} className={`${
            lot.status === "vendido" ? "border-green-200 bg-green-50" :
            lot.status === "reservado" ? "border-yellow-200 bg-yellow-50" :
            "border-gray-200"
          }`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">Lote {lot.number}</h3>
                  <p className="text-sm text-gray-600">{lot.location}</p>
                </div>
                <Badge variant={
                  lot.status === "vendido" ? "default" :
                  lot.status === "reservado" ? "secondary" : "outline"
                }>
                  {lot.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Área:</span>
                  <span>{lot.area} m²</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio:</span>
                  <span className="font-semibold">${parseFloat(lot.price || "0").toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio por m²:</span>
                  <span>${Math.round(parseFloat(lot.price || "0") / (lot.area || 1)).toLocaleString()}</span>
                </div>
              </div>

              {lot.status === "disponible" && (
                <Button 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => {
                    contractForm.setValue("lotId", lot.id);
                    setIsContractDialogOpen(true);
                  }}
                >
                  Crear Contrato
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderClientsView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client: Client) => (
          <Card key={client.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">
                    {client.firstName} {client.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {client.identificationType}: {client.identificationNumber}
                  </p>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="w-16">Email:</span>
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16">Teléfono:</span>
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-16">Dirección:</span>
                    <span className="flex-1">{client.address}</span>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    contractForm.setValue("clientId", client.id);
                    setIsContractDialogOpen(true);
                  }}
                >
                  Crear Contrato
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContractsView = () => (
    <div className="space-y-4">
      {contracts.map((contract: SalesContract) => (
        <Card key={contract.id}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Información del Contrato</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Cliente:</span> {getClientName(contract.clientId)}
                  </div>
                  <div>
                    <span className="font-medium">Lote:</span> {contract.lotId}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <Badge className="ml-2" variant={
                      contract.status === "firmado" ? "default" :
                      contract.status === "promesa" ? "secondary" : "outline"
                    }>
                      {contract.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Detalles Financieros</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Precio de Venta:</span>
                    <span className="ml-2">${parseFloat(contract.salePrice || "0").toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Cuota Inicial:</span>
                    <span className="ml-2">${parseFloat(contract.downPayment || "0").toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Financiamiento:</span>
                    <span className="ml-2">{contract.financingType}</span>
                  </div>
                  {contract.installments > 0 && (
                    <>
                      <div>
                        <span className="font-medium">Cuotas:</span>
                        <span className="ml-2">{contract.installments}</span>
                      </div>
                      <div>
                        <span className="font-medium">Pago Mensual:</span>
                        <span className="ml-2">${parseFloat(contract.monthlyPayment || "0").toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Fechas</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Creado:</span>
                    <span className="ml-2">
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {contract.signedDate && (
                    <div>
                      <span className="font-medium">Firmado:</span>
                      <span className="ml-2">
                        {new Date(contract.signedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {contract.deliveryDate && (
                    <div>
                      <span className="font-medium">Entrega:</span>
                      <span className="ml-2">
                        {new Date(contract.deliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

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
          <h1 className="text-2xl font-bold">Gestión Comercial</h1>
          <p className="text-gray-600">Administración de lotes, clientes y contratos de venta</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isLotDialogOpen} onOpenChange={setIsLotDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedProjectId}>
                <Home className="w-4 h-4 mr-2" />
                Nuevo Lote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Lote</DialogTitle>
              </DialogHeader>
              <Form {...lotForm}>
                <form onSubmit={lotForm.handleSubmit(onSubmitLot)} className="space-y-4">
                  <FormField
                    control={lotForm.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número del Lote</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: A-101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={lotForm.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área (m²)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={lotForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={lotForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Manzana A, Sector Norte" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsLotDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createLotMutation.isPending}>
                      {createLotMutation.isPending ? "Creando..." : "Crear Lote"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(onSubmitClient)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombres</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="identificationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de ID</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cedula">Cédula</SelectItem>
                                <SelectItem value="pasaporte">Pasaporte</SelectItem>
                                <SelectItem value="nit">NIT</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="identificationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de ID</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={clientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsClientDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createClientMutation.isPending}>
                      {createClientMutation.isPending ? "Registrando..." : "Registrar Cliente"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto para gestión comercial" />
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
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {/* Sales Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalLots}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                <MapPin className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.availableLots}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendidos</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.soldLots}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">% Vendido</CardTitle>
                <Calculator className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{metrics.salesRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${metrics.totalSales.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Mode Selector */}
          <div className="flex space-x-2">
            <Button 
              variant={viewMode === "lots" ? "default" : "outline"}
              onClick={() => setViewMode("lots")}
            >
              <Home className="w-4 h-4 mr-2" />
              Lotes
            </Button>
            <Button 
              variant={viewMode === "clients" ? "default" : "outline"}
              onClick={() => setViewMode("clients")}
            >
              <Users className="w-4 h-4 mr-2" />
              Clientes
            </Button>
            <Button 
              variant={viewMode === "contracts" ? "default" : "outline"}
              onClick={() => setViewMode("contracts")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Contratos
            </Button>
          </div>

          {/* Content based on view mode */}
          {(lotsLoading || clientsLoading || contractsLoading) ? (
            <div className="animate-pulse space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <>
              {viewMode === "lots" && renderLotsView()}
              {viewMode === "clients" && renderClientsView()}
              {viewMode === "contracts" && renderContractsView()}
            </>
          )}
        </>
      )}

      {!selectedProjectId && (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Selecciona un Proyecto</h3>
            <p>Elige un proyecto para gestionar sus aspectos comerciales</p>
          </div>
        </Card>
      )}
    </div>
  );
}