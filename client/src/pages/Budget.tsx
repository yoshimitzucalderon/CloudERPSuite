import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function Budget() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control Presupuestal</h1>
          <p className="text-gray-600">Gestión financiera y análisis de costos</p>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Presupuesto Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$450M</p>
                <p className="text-sm text-blue-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +8% vs mes anterior
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gastado</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$285M</p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingDown className="w-3 h-3 inline mr-1" />
                  63% del presupuesto
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calculator className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comprometido</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$95M</p>
                <p className="text-sm text-orange-600 mt-1">
                  21% del presupuesto
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-orange-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disponible</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$70M</p>
                <p className="text-sm text-gray-600 mt-1">
                  16% del presupuesto
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-gray-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="p-12 text-center">
          <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Control Presupuestal
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            El módulo de control presupuestal estará disponible próximamente. 
            Incluirá gestión de partidas, análisis de variaciones y proyecciones financieras.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
