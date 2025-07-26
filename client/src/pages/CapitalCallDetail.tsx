import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResizableTable, ResizableTableHeader, ResizableTableHead, TableBody, TableCell, TableRow } from "@/components/ui/resizable-table";
import { Table, TableHeader, TableHead } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle, Download, Send } from "lucide-react";

export default function CapitalCallDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [itemsColumnWidths, setItemsColumnWidths] = useState<number[]>([80, 60, 300, 250, 120, 100, 80, 150]);
  const [budgetColumnWidths, setBudgetColumnWidths] = useState<number[]>([280, 180, 180, 200]);

  const { data: capitalCall, isLoading } = useQuery({
    queryKey: ['/api/capital-calls', id],
    retry: false,
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(num);
  };

  const handleItemsColumnResize = (index: number, width: number) => {
    const newWidths = [...itemsColumnWidths];
    newWidths[index] = width;
    setItemsColumnWidths(newWidths);
  };

  const handleBudgetColumnResize = (index: number, width: number) => {
    const newWidths = [...budgetColumnWidths];
    newWidths[index] = width;
    setBudgetColumnWidths(newWidths);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendiente: { label: "Pendiente", variant: "outline" as const, icon: Clock },
      firmado: { label: "Firmado", variant: "default" as const, icon: CheckCircle },
      rechazado: { label: "Rechazado", variant: "destructive" as const, icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
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
            <h1 className="text-2xl font-bold">Capital Call #{call.callNumber}</h1>
            <p className="text-muted-foreground">
              {call.purpose}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Enviar a Inversores
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumen del Capital Call
              </CardTitle>
              <CardDescription>
                Fecha de vencimiento: {new Date(call.dueDate).toLocaleDateString('es-MX')}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(call.totalAmount)}</div>
              <div className="text-sm text-muted-foreground">Monto total</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium">Fecha de emisión:</div>
              <div>{new Date(call.callDate).toLocaleDateString('es-MX')}</div>
            </div>
            <div>
              <div className="font-medium">Fecha límite:</div>
              <div>{new Date(call.dueDate).toLocaleDateString('es-MX')}</div>
            </div>
            <div>
              <div className="font-medium">Estado:</div>
              <div className="mt-1">{getStatusBadge(call.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Items */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Gastos</CardTitle>
          <CardDescription>
            Desglose detallado de todos los conceptos incluidos en este capital call
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResizableTable>
            <ResizableTableHeader 
              onResize={handleItemsColumnResize}
              columnWidths={itemsColumnWidths}
            >
              <ResizableTableHead>Resp.</ResizableTableHead>
              <ResizableTableHead>#</ResizableTableHead>
              <ResizableTableHead>Concepto</ResizableTableHead>
              <ResizableTableHead>Proveedor</ResizableTableHead>
              <ResizableTableHead className="text-right">Importe</ResizableTableHead>
              <ResizableTableHead>Fecha</ResizableTableHead>
              <ResizableTableHead>IVA</ResizableTableHead>
              <ResizableTableHead>Notas</ResizableTableHead>
            </ResizableTableHeader>
            <TableBody>
              {call.items?.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{item.responsible}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sequence}</TableCell>
                  <TableCell className="font-medium text-sm">{item.concept}</TableCell>
                  <TableCell className="text-sm">{item.provider}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(item.dueDate).toLocaleDateString('es-MX')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.includesVAT ? "default" : "secondary"} className="text-xs">
                      {item.includesVAT ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResizableTable>
        </CardContent>
      </Card>

      {/* Authorization Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Autorización</CardTitle>
          <CardDescription>
            Proceso de firmas requerido para la aprobación del capital call
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {call.authorizations?.map((auth: any, index: number) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusBadge(auth.status)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{auth.userName}</div>
                  <div className="text-sm text-muted-foreground">{auth.userTitle}</div>
                  {auth.company && (
                    <div className="text-xs text-muted-foreground">{auth.company}</div>
                  )}
                </div>
                <div className="text-right text-sm">
                  {auth.signedAt ? (
                    <div>
                      <div className="font-medium">Firmado</div>
                      <div className="text-muted-foreground">
                        {new Date(auth.signedAt).toLocaleDateString('es-MX')}
                      </div>
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

      {/* Budget Execution */}
      <Card>
        <CardHeader>
          <CardTitle>Presupuesto Ejecutado</CardTitle>
          <CardDescription>
            Comparativo del presupuesto por categorías
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResizableTable>
            <ResizableTableHeader
              onResize={handleBudgetColumnResize}
              columnWidths={budgetColumnWidths}
            >
              <ResizableTableHead>Partida</ResizableTableHead>
              <ResizableTableHead className="text-right">Acumulado anterior [A]</ResizableTableHead>
              <ResizableTableHead className="text-right">Este capital call [B]</ResizableTableHead>
              <ResizableTableHead className="text-right">Acumulado actual [C = A + B]</ResizableTableHead>
            </ResizableTableHeader>
            <TableBody>
              {call.budgetExecution?.map((budget: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{budget.budgetCategory}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(budget.previousAccumulated)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(budget.thisCapitalCall)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(budget.currentAccumulated)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(
                    call.budgetExecution?.reduce((sum: number, item: any) => 
                      sum + parseFloat(item.previousAccumulated), 0
                    ) || 0
                  )}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(call.totalAmount)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatCurrency(
                    call.budgetExecution?.reduce((sum: number, item: any) => 
                      sum + parseFloat(item.currentAccumulated), 0
                    ) || 0
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </ResizableTable>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Porcentaje sobre aportación proyectada:</div>
                <div className="text-lg font-bold text-blue-600">164%</div>
              </div>
              <div>
                <div className="font-medium">Porcentaje sobre presupuesto planeación:</div>
                <div className="text-lg font-bold text-green-600">109%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}