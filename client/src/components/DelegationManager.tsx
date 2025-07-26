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
import {
  Plus,
  UserMinus,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const delegationSchema = z.object({
  delegateId: z.string().min(1, "Selecciona un delegado"),
  workflowTypes: z.array(z.string()).min(1, "Selecciona al menos un tipo"),
  maxAmount: z.string().optional(),
  validFrom: z.string().min(1, "Fecha de inicio requerida"),
  validUntil: z.string().min(1, "Fecha de fin requerida"),
  reason: z.string().min(1, "Razón requerida"),
});

type DelegationData = z.infer<typeof delegationSchema>;

export function DelegationManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: delegations, isLoading } = useQuery({
    queryKey: ['/api/authority-delegations'],
  });

  const form = useForm<DelegationData>({
    resolver: zodResolver(delegationSchema),
    defaultValues: {
      workflowTypes: [],
    },
  });

  const createDelegationMutation = useMutation({
    mutationFn: async (data: DelegationData) => {
      const response = await fetch('/api/authority-delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create delegation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/authority-delegations'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Delegación creada",
        description: "La delegación de autoridad ha sido creada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la delegación.",
        variant: "destructive",
      });
    },
  });

  const revokeDelegationMutation = useMutation({
    mutationFn: async (delegationId: string) => {
      const response = await fetch(`/api/authority-delegations/${delegationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to revoke delegation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/authority-delegations'] });
      toast({
        title: "Delegación revocada",
        description: "La delegación ha sido revocada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo revocar la delegación.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DelegationData) => {
    createDelegationMutation.mutate(data);
  };

  const getStatusBadge = (delegation: any) => {
    const now = new Date();
    const validFrom = new Date(delegation.validFrom);
    const validUntil = new Date(delegation.validUntil);

    if (!delegation.isActive) {
      return <Badge variant="secondary">Revocada</Badge>;
    }
    
    if (now < validFrom) {
      return <Badge variant="outline">Programada</Badge>;
    }
    
    if (now > validUntil) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-500">Activa</Badge>;
  };

  const getUserName = (userId: string) => {
    const user = (users as any[])?.find((u: any) => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Usuario';
  };

  const workflowTypeOptions = [
    { value: 'pago', label: 'Pagos' },
    { value: 'contratacion', label: 'Contratación' },
    { value: 'orden_cambio', label: 'Órdenes de Cambio' },
    { value: 'liberacion_credito', label: 'Liberación de Crédito' },
    { value: 'capital_call', label: 'Capital Calls' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Delegaciones</h3>
          <p className="text-sm text-gray-600">
            Administra la delegación temporal de autoridades de aprobación
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Delegación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Delegación de Autoridad</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="delegateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delegado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar usuario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(users as any[])?.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {getUserName(user.id)}
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
                  name="workflowTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipos de Workflow</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {workflowTypeOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={field.value?.includes(option.value)}
                              onChange={(e) => {
                                const current = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...current, option.value]);
                                } else {
                                  field.onChange(current.filter(v => v !== option.value));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Máximo (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="validFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Válido desde</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Válido hasta</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Motivo de la delegación" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createDelegationMutation.isPending}>
                    {createDelegationMutation.isPending ? "Creando..." : "Crear Delegación"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Delegations */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {(delegations as any[])?.map((delegation: any) => (
            <Card key={delegation.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {getUserName(delegation.delegateId)}
                    </CardTitle>
                    <CardDescription>
                      Delegado por: {getUserName(delegation.delegatorId)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(delegation)}
                    {delegation.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeDelegationMutation.mutate(delegation.id)}
                        disabled={revokeDelegationMutation.isPending}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Revocar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {delegation.workflowTypes?.map((type: string) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {workflowTypeOptions.find(opt => opt.value === type)?.label || type}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    {delegation.maxAmount && (
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Hasta ${delegation.maxAmount}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(delegation.validFrom).toLocaleDateString()} - {new Date(delegation.validUntil).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {(() => {
                        const now = new Date();
                        const validUntil = new Date(delegation.validUntil);
                        const diffDays = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return diffDays > 0 ? `${diffDays} días restantes` : 'Expirada';
                      })()}
                    </div>
                  </div>
                  
                  {delegation.reason && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Razón:</strong> {delegation.reason}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {(!delegations || (delegations as any[]).length === 0) && (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-gray-500">
                <Users className="h-5 w-5 mr-2" />
                No hay delegaciones activas
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}