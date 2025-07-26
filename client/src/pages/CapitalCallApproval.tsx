import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, FileText, User, Building2, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CapitalCallApproval() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [comments, setComments] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: capitalCall, isLoading } = useQuery({
    queryKey: ['/api/capital-calls', id],
    retry: false,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const approvalMutation = useMutation({
    mutationFn: async (data: { action: 'approve' | 'reject', comments?: string }) => {
      return await apiRequest(`/api/capital-calls/${id}/approve`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/capital-calls', id] });
      setShowApprovalDialog(false);
      setShowRejectionDialog(false);
      setShowReverseDialog(false);
      setComments("");
      toast({
        title: "Acción completada",
        description: "Su decisión de autorización ha sido registrada.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo procesar la autorización. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(num);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'firmado':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rechazado':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { label: "Pendiente", variant: "outline" as const },
      firmado: { label: "Firmado", variant: "default" as const },
      rechazado: { label: "Rechazado", variant: "destructive" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    );
  };

  const getCurrentUserStep = () => {
    if (!capitalCall || !currentUser) return null;
    
    const call = capitalCall as any;
    const user = currentUser as any;
    
    return call.authorizations?.find((auth: any) => 
      auth.userName === `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
      auth.userName.includes(user.firstName || '')
    );
  };

  const canUserApprove = () => {
    const userStep = getCurrentUserStep();
    return userStep && userStep.status === 'pendiente';
  };

  const canUserReverse = () => {
    if (!capitalCall || !currentUser) return false;
    
    const call = capitalCall as any;
    const userStep = getCurrentUserStep();
    
    // Solo puede revertir si ya aprobó
    if (!userStep || userStep.status !== 'firmado') return false;
    
    // Buscar el índice del usuario actual en el flujo
    const userIndex = call.authorizations?.findIndex((auth: any) => 
      auth.userName === userStep.userName
    );
    
    if (userIndex === -1) return false;
    
    // Verificar que no haya aprobaciones posteriores
    const hasSubsequentApprovals = call.authorizations
      ?.slice(userIndex + 1)
      ?.some((auth: any) => auth.status === 'firmado');
    
    return !hasSubsequentApprovals;
  };

  const handleApprove = () => {
    approvalMutation.mutate({ action: 'approve', comments });
  };

  const handleReject = () => {
    approvalMutation.mutate({ action: 'reject', comments });
  };

  const handleReverse = () => {
    approvalMutation.mutate({ action: 'reverse', comments });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!capitalCall) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Capital Call no encontrado</h2>
            <p className="text-muted-foreground mb-4">
              El capital call solicitado no existe o no tienes permisos para verlo.
            </p>
            <Button onClick={() => setLocation("/investors")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Inversores
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const call = capitalCall as any;
  const userStep = getCurrentUserStep();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/investors")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Autorización - Capital Call #{call.callNumber}</h1>
            <p className="text-muted-foreground">
              {call.purpose}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{formatCurrency(call.totalAmount)}</div>
          <div className="text-sm text-muted-foreground">Monto total</div>
        </div>
      </div>

      {/* User Status Alert */}
      {userStep && (
        <Alert className={userStep.status === 'pendiente' ? 'border-yellow-500 bg-yellow-50' : 
                         userStep.status === 'firmado' ? 'border-green-500 bg-green-50' : 
                         'border-red-500 bg-red-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {userStep.status === 'pendiente' && 
              <span className="font-medium">Acción requerida:</span>
            }
            {userStep.status === 'firmado' && 
              <span className="font-medium">Ya aprobado:</span>
            }
            {userStep.status === 'rechazado' && 
              <span className="font-medium">Rechazado:</span>
            }
            {userStep.status === 'pendiente' ? 
              " Este capital call requiere su autorización." :
              userStep.status === 'firmado' ?
              " Usted ya ha aprobado este capital call." :
              " Usted ha rechazado este capital call."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumen del Capital Call
          </CardTitle>
          <CardDescription>
            Detalles del capital call pendiente de autorización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="font-medium text-sm text-muted-foreground">Propósito:</div>
                <div className="text-sm">{call.purpose}</div>
              </div>
              <div>
                <div className="font-medium text-sm text-muted-foreground">Fecha de emisión:</div>
                <div className="text-sm">{new Date(call.callDate).toLocaleDateString('es-MX')}</div>
              </div>
              <div>
                <div className="font-medium text-sm text-muted-foreground">Fecha límite:</div>
                <div className="text-sm">{new Date(call.dueDate).toLocaleDateString('es-MX')}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-sm text-muted-foreground">Monto total:</div>
                <div className="text-lg font-bold">{formatCurrency(call.totalAmount)}</div>
              </div>
              <div>
                <div className="font-medium text-sm text-muted-foreground">Estado general:</div>
                <div className="mt-1">{getStatusBadge(call.status)}</div>
              </div>
              <div>
                <div className="font-medium text-sm text-muted-foreground">Número de conceptos:</div>
                <div className="text-sm">{call.items?.length || 0} partidas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorization Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Autorización</CardTitle>
          <CardDescription>
            Progreso del proceso de firmas requerido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {call.authorizations?.map((auth: any, index: number) => (
              <div 
                key={index} 
                className={`flex items-center space-x-4 p-4 border rounded-lg transition-colors ${
                  auth.userName === userStep?.userName ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(auth.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{auth.userName}</div>
                    {auth.userName === userStep?.userName && (
                      <Badge variant="outline" className="text-xs">
                        Su turno
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {auth.userTitle}
                  </div>
                  {auth.company && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {auth.company}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm">
                  {auth.signedAt ? (
                    <div className="space-y-1">
                      <div className="font-medium text-green-600">
                        {auth.status === 'firmado' ? 'Aprobado' : 'Rechazado'}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(auth.signedAt).toLocaleDateString('es-MX')}
                      </div>
                      {/* Mostrar si puede revertir */}
                      {auth.userName === userStep?.userName && canUserReverse() && (
                        <div className="text-xs text-orange-600 font-medium">
                          Puede revertir
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Pendiente</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canUserApprove() && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Su Aprobación es Requerida
            </CardTitle>
            <CardDescription>
              Este capital call requiere su autorización para continuar con el proceso. Revise los detalles y tome una decisión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Resumen de la decisión:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Aprobar:</strong> El capital call continuará al siguiente nivel de autorización</li>
                  <li>• <strong>Rechazar:</strong> El proceso se detendrá y requerirá revisión</li>
                </ul>
              </div>
              <div className="flex space-x-4">
                <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar Capital Call
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Aprobación</DialogTitle>
                      <DialogDescription>
                        ¿Está seguro que desea aprobar este capital call por {formatCurrency(call.totalAmount)}?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="approval-comments" className="text-sm font-medium">
                          Comentarios (opcional)
                        </Label>
                        <Textarea
                          id="approval-comments"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Agregue comentarios sobre su aprobación..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleApprove} 
                        disabled={approvalMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approvalMutation.isPending ? "Procesando..." : "Confirmar Aprobación"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Rechazar Capital Call
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Rechazo</DialogTitle>
                      <DialogDescription>
                        ¿Está seguro que desea rechazar este capital call? Esta acción detendrá el proceso de aprobación.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rejection-comments" className="text-sm font-medium">
                          Motivo del rechazo *
                        </Label>
                        <Textarea
                          id="rejection-comments"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Explique el motivo del rechazo..."
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={handleReject} 
                        disabled={approvalMutation.isPending || !comments.trim()}
                      >
                        {approvalMutation.isPending ? "Procesando..." : "Confirmar Rechazo"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={() => setLocation(`/investors/capital-call/${id}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Detalle Completo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information for users who already acted */}
      {userStep && userStep.status !== 'pendiente' && (
        <Card className={userStep.status === 'firmado' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {userStep.status === 'firmado' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              {userStep.status === 'firmado' ? 'Capital Call Aprobado' : 'Capital Call Rechazado'}
            </CardTitle>
            <CardDescription>
              {userStep.status === 'firmado' 
                ? 'Usted ya ha aprobado este capital call.' 
                : 'Usted ha rechazado este capital call.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">
                <strong>Fecha de decisión:</strong> {userStep.signedAt ? new Date(userStep.signedAt).toLocaleDateString('es-MX') : 'N/A'}
                {userStep.comments && (
                  <div className="mt-2">
                    <strong>Comentarios:</strong>
                    <div className="mt-1 p-2 bg-white rounded border text-sm">
                      {userStep.comments}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Reverse approval option */}
              {canUserReverse() && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">¿Necesita revertir su aprobación?</h4>
                      <p className="text-xs text-muted-foreground">
                        Puede revertir su aprobación mientras no haya aprobaciones posteriores en el flujo.
                      </p>
                    </div>
                    <Dialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Revertir Aprobación
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmar Reversión</DialogTitle>
                          <DialogDescription>
                            ¿Está seguro que desea revertir su aprobación? Esta acción regresará el capital call a estado pendiente para su revisión.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reverse-comments" className="text-sm font-medium">
                              Motivo de la reversión *
                            </Label>
                            <Textarea
                              id="reverse-comments"
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="Explique por qué necesita revertir su aprobación..."
                              className="mt-1"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowReverseDialog(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            variant="outline"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            onClick={handleReverse} 
                            disabled={approvalMutation.isPending || !comments.trim()}
                          >
                            {approvalMutation.isPending ? "Procesando..." : "Confirmar Reversión"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information for users not in the workflow */}
      {!userStep && (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              Solo Lectura
            </CardTitle>
            <CardDescription>
              Usted no está incluido en el flujo de autorización de este capital call.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Puede revisar los detalles pero no tiene permisos para aprobar o rechazar este documento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}