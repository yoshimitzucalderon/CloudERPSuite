import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-600">Programación de actividades críticas</p>
        </div>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Calendario de Actividades
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            El módulo de calendario estará disponible próximamente. 
            Incluirá programación de tareas, recordatorios y sincronización con Google Calendar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
