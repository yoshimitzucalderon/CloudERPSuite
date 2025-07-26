import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, DollarSign, TrendingUp, Users, Plus, Calendar, FileText, PieChart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Investor {
  id: string;
  investorCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  investorType: string;
  riskProfile?: string;
  totalCommitment: string;
  totalContributed: string;
  status: string;
  kycCompleted: boolean;
  preferredLanguage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CapitalCall {
  id: string;
  projectId: string;
  callNumber: number;
  totalAmount: string;
  callDate: Date;
  dueDate: Date;
  purpose?: string;
  status: string;
  createdBy: string;
  createdAt: Date;
}

interface InvestorStatistics {
  totalInvestors: number;
  activeInvestors: number;
  totalCommitments: string;
  totalContributions: string;
  pendingCapitalCalls: number;
  averageROI: number;
}

export default function Investors() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showNewInvestorDialog, setShowNewInvestorDialog] = useState(false);
  const [showCapitalCallDialog, setShowCapitalCallDialog] = useState(false);
  const [newInvestor, setNewInvestor] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    taxId: "",
    investorType: "individual",
    totalCommitment: "",
    address: "",
    city: "",
    state: "",
    country: "Mexico"
  });
  const [newCapitalCall, setNewCapitalCall] = useState({
    projectId: "",
    totalAmount: "",
    callDate: "",
    dueDate: "",
    purpose: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/investor-statistics'],
    retry: false,
  });

  const { data: investors = [], isLoading: investorsLoading } = useQuery({
    queryKey: ['/api/investors'],
    retry: false,
  });

  const { data: capitalCalls = [], isLoading: capitalCallsLoading } = useQuery({
    queryKey: ['/api/capital-calls'],
    retry: false,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    retry: false,
  });

  // Mutations
  const createInvestorMutation = useMutation({
    mutationFn: async (investorData: any) => {
      return await apiRequest('/api/investors', 'POST', investorData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investor-statistics'] });
      setShowNewInvestorDialog(false);
      setNewInvestor({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        taxId: "",
        investorType: "individual",
        totalCommitment: "",
        address: "",
        city: "",
        state: "",
        country: "Mexico"
      });
      toast({
        title: "Inversor creado",
        description: "El nuevo inversor ha sido registrado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el inversor. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const createCapitalCallMutation = useMutation({
    mutationFn: async (capitalCallData: any) => {
      return await apiRequest('/api/capital-calls', 'POST', capitalCallData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/capital-calls'] });
      setShowCapitalCallDialog(false);
      setNewCapitalCall({
        projectId: "",
        totalAmount: "",
        callDate: "",
        dueDate: "",
        purpose: ""
      });
      toast({
        title: "Capital Call creado",
        description: "El capital call ha sido programado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el capital call. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvestor = () => {
    if (!newInvestor.firstName || !newInvestor.lastName || !newInvestor.email) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    createInvestorMutation.mutate({
      ...newInvestor,
      investorCode: `INV-${Date.now()}`, // Auto-generated code
    });
  };

  const handleCreateCapitalCall = () => {
    if (!newCapitalCall.projectId || !newCapitalCall.totalAmount || !newCapitalCall.callDate || !newCapitalCall.dueDate) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    createCapitalCallMutation.mutate({
      ...newCapitalCall,
      callNumber: (capitalCalls as any[]).length + 1, // Auto-increment
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(num || 0);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      activo: { label: "Activo", color: "bg-green-100 text-green-800" },
      inactivo: { label: "Inactivo", color: "bg-gray-100 text-gray-800" },
      suspendido: { label: "Suspendido", color: "bg-red-100 text-red-800" },
      pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
      pagado_completo: { label: "Pagado", color: "bg-green-100 text-green-800" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (statsLoading || investorsLoading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Capital Calls e Inversionistas
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gestión completa de inversores, capital calls y distribuciones
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showNewInvestorDialog} onOpenChange={setShowNewInvestorDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Inversor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Inversor</DialogTitle>
                <DialogDescription>
                  Complete la información básica del inversor
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={newInvestor.firstName}
                    onChange={(e) => setNewInvestor({ ...newInvestor, firstName: e.target.value })}
                    placeholder="Nombre del inversor"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={newInvestor.lastName}
                    onChange={(e) => setNewInvestor({ ...newInvestor, lastName: e.target.value })}
                    placeholder="Apellido del inversor"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newInvestor.email}
                    onChange={(e) => setNewInvestor({ ...newInvestor, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={newInvestor.phone}
                    onChange={(e) => setNewInvestor({ ...newInvestor, phone: e.target.value })}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                
                <div>
                  <Label htmlFor="taxId">RFC/ID Fiscal</Label>
                  <Input
                    id="taxId"
                    value={newInvestor.taxId}
                    onChange={(e) => setNewInvestor({ ...newInvestor, taxId: e.target.value })}
                    placeholder="RFC123456789"
                  />
                </div>
                
                <div>
                  <Label htmlFor="investorType">Tipo de Inversor</Label>
                  <Select value={newInvestor.investorType} onValueChange={(value) => setNewInvestor({ ...newInvestor, investorType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                      <SelectItem value="fund">Fondo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="totalCommitment">Compromiso Total</Label>
                  <Input
                    id="totalCommitment"
                    type="number"
                    value={newInvestor.totalCommitment}
                    onChange={(e) => setNewInvestor({ ...newInvestor, totalCommitment: e.target.value })}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={newInvestor.country}
                    onChange={(e) => setNewInvestor({ ...newInvestor, country: e.target.value })}
                    placeholder="Mexico"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewInvestorDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateInvestor}
                  disabled={createInvestorMutation.isPending}
                >
                  {createInvestorMutation.isPending ? "Creando..." : "Crear Inversor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCapitalCallDialog} onOpenChange={setShowCapitalCallDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Nuevo Capital Call
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programar Capital Call</DialogTitle>
                <DialogDescription>
                  Configure un nuevo capital call para un proyecto
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="projectId">Proyecto *</Label>
                  <Select value={newCapitalCall.projectId} onValueChange={(value) => setNewCapitalCall({ ...newCapitalCall, projectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {(projects as any[]).map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="totalAmount">Monto Total *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={newCapitalCall.totalAmount}
                    onChange={(e) => setNewCapitalCall({ ...newCapitalCall, totalAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="callDate">Fecha de Call *</Label>
                  <Input
                    id="callDate"
                    type="date"
                    value={newCapitalCall.callDate}
                    onChange={(e) => setNewCapitalCall({ ...newCapitalCall, callDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dueDate">Fecha de Vencimiento *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newCapitalCall.dueDate}
                    onChange={(e) => setNewCapitalCall({ ...newCapitalCall, dueDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="purpose">Propósito</Label>
                  <Textarea
                    id="purpose"
                    value={newCapitalCall.purpose}
                    onChange={(e) => setNewCapitalCall({ ...newCapitalCall, purpose: e.target.value })}
                    placeholder="Describe el propósito del capital call..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCapitalCallDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateCapitalCall}
                  disabled={createCapitalCallMutation.isPending}
                >
                  {createCapitalCallMutation.isPending ? "Creando..." : "Crear Capital Call"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inversionistas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(statistics as any)?.totalInvestors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(statistics as any)?.activeInvestors || 0} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compromisos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency((statistics as any)?.totalCommitments || 0)}</div>
            <p className="text-xs text-muted-foreground">
              En inversiones comprometidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Contribuido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency((statistics as any)?.totalContributions || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Efectivamente recibido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Calls Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(statistics as any)?.pendingCapitalCalls || 0}</div>
            <p className="text-xs text-muted-foreground">
              ROI promedio: {(statistics as any)?.averageROI || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="investors">Inversionistas</TabsTrigger>
          <TabsTrigger value="capital-calls">Capital Calls</TabsTrigger>
          <TabsTrigger value="reports">Reportes ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inversionistas Recientes</CardTitle>
                <CardDescription>Últimos inversionistas registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(investors as Investor[]).slice(0, 5).map((investor: Investor) => (
                    <div key={investor.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{investor.firstName} {investor.lastName}</p>
                        <p className="text-sm text-gray-500">{investor.email}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(investor.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capital Calls Activos</CardTitle>
                <CardDescription>Capital calls pendientes de pago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(capitalCalls as CapitalCall[]).filter((call: CapitalCall) => call.status === 'pendiente').slice(0, 5).map((call: CapitalCall) => (
                    <div key={call.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Call #{call.callNumber}</p>
                        <p className="text-sm text-gray-500">
                          Vence: {new Date(call.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(call.totalAmount)}</p>
                        {getStatusBadge(call.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Base de Inversionistas</CardTitle>
              <CardDescription>
                Gestión completa de la base de datos de inversionistas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Compromiso</TableHead>
                    <TableHead>Contribuido</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(investors as Investor[]).map((investor: Investor) => (
                    <TableRow key={investor.id}>
                      <TableCell className="font-mono text-sm">{investor.investorCode}</TableCell>
                      <TableCell className="font-medium">
                        {investor.firstName} {investor.lastName}
                      </TableCell>
                      <TableCell>{investor.email}</TableCell>
                      <TableCell className="capitalize">{investor.investorType}</TableCell>
                      <TableCell>{formatCurrency(investor.totalCommitment)}</TableCell>
                      <TableCell>{formatCurrency(investor.totalContributed)}</TableCell>
                      <TableCell>{getStatusBadge(investor.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capital-calls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Capital Calls Programados</CardTitle>
              <CardDescription>
                Gestión de llamadas de capital y seguimiento de pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Call #</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha Call</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Propósito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(capitalCalls as CapitalCall[]).map((call: CapitalCall) => (
                    <TableRow 
                      key={call.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => window.location.href = `/investors/capital-call/${call.id}`}
                    >
                      <TableCell className="font-mono">#{call.callNumber}</TableCell>
                      <TableCell>
                        {(projects as any[]).find((p: any) => p.id === call.projectId)?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(call.totalAmount)}</TableCell>
                      <TableCell>{new Date(call.callDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(call.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">{call.purpose || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reportes ROI por Inversionista</CardTitle>
              <CardDescription>
                Análisis de retorno de inversión y distribuciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Funcionalidad de reportes ROI en desarrollo</p>
                <p className="text-sm">Pronto disponible para análisis detallado</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}