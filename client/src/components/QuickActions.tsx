import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Upload, 
  CalendarPlus, 
  BarChart3, 
  AlertTriangle, 
  Handshake, 
  Settings, 
  HelpCircle 
} from "lucide-react";

const quickActions = [
  {
    title: "Nuevo Proyecto",
    icon: Plus,
    color: "bg-blue-100 text-blue-600",
    action: () => window.location.href = "/projects"
  },
  {
    title: "Subir Documento",
    icon: Upload,
    color: "bg-orange-100 text-orange-600",
    action: () => window.location.href = "/documents"
  },
  {
    title: "Agendar Cita",
    icon: CalendarPlus,
    color: "bg-green-100 text-green-600",
    action: () => window.location.href = "/calendar"
  },
  {
    title: "Ver Reportes",
    icon: BarChart3,
    color: "bg-purple-100 text-purple-600",
    action: () => window.location.href = "/budget"
  },
  {
    title: "Alertas",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-600",
    action: () => window.location.href = "/permits"
  },
  {
    title: "Contratos",
    icon: Handshake,
    color: "bg-blue-100 text-blue-600",
    action: () => window.location.href = "/documents"
  },
  {
    title: "Configuración",
    icon: Settings,
    color: "bg-yellow-100 text-yellow-600",
    action: () => window.location.href = "/users"
  },
  {
    title: "Ayuda",
    icon: HelpCircle,
    color: "bg-indigo-100 text-indigo-600",
    action: () => alert("Centro de ayuda próximamente disponible")
  }
];

export default function QuickActions() {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              onClick={action.action}
            >
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                {action.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
