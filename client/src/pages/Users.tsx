import { Card, CardContent } from "@/components/ui/card";
import { Users as UsersIcon } from "lucide-react";

export default function Users() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gestión de usuarios y roles del sistema</p>
        </div>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Gestión de Usuarios
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            El módulo de gestión de usuarios estará disponible próximamente. 
            Incluirá control de roles, permisos y administración de cuentas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
