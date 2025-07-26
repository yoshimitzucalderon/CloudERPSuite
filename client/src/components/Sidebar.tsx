import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { 
  Building2, 
  BarChart3, 
  FileText, 
  Calculator, 
  Calendar, 
  FolderOpen, 
  Users, 
  Settings,
  BarChart,
  ShoppingCart,
  CheckSquare
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Proyectos', href: '/projects', icon: Building2 },
  { name: 'Gestión de Proyectos', href: '/project-management', icon: BarChart },
  { name: 'Gestión Comercial', href: '/commercial', icon: ShoppingCart },
  { name: 'Autorizaciones', href: '/authorizations', icon: CheckSquare },
  { name: 'Trámites y Permisos', href: '/permits', icon: FileText },
  { name: 'Control Presupuestal', href: '/budget', icon: Calculator },
  { name: 'Calendario', href: '/calendar', icon: Calendar },
  { name: 'Documentos', href: '/documents', icon: FolderOpen },
  { name: 'Usuarios', href: '/users', icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center h-20 px-4 border-b border-gray-200">
          <Logo className="h-8 w-auto mb-1" />
          <span className="text-xs font-medium text-gray-600">ERP Inmobiliario</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <img 
              src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
              alt="Usuario" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {(user as any)?.firstName && (user as any)?.lastName 
                  ? `${(user as any).firstName} ${(user as any).lastName}` 
                  : (user as any)?.email || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {(user as any)?.role || 'Operativo'}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
