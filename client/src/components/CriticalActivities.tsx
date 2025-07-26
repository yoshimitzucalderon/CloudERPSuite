import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type CalendarEvent } from "@shared/schema";
import { Link } from "wouter";

interface CriticalActivitiesProps {
  activities: CalendarEvent[];
}

export default function CriticalActivities({ activities }: CriticalActivitiesProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-50 border-red-200";
      case 'medium':
        return "bg-orange-50 border-orange-200";
      case 'low':
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-yellow-50 border-yellow-200";
    }
  };

  const getPriorityDotColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-500";
      case 'medium':
        return "bg-orange-500";
      case 'low':
        return "bg-blue-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "text-red-600";
      case 'medium':
        return "text-orange-600";
      case 'low':
        return "text-blue-600";
      default:
        return "text-yellow-600";
    }
  };

  const getDaysUntil = (date: string | Date) => {
    const targetDate = new Date(date);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Vencido";
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    if (diffDays <= 7) return `En ${diffDays} días`;
    return `En ${Math.ceil(diffDays / 7)} semanas`;
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Actividades Críticas</CardTitle>
          <Link href="/calendar" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver calendario
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay actividades críticas próximas</p>
            </div>
          ) : (
            activities.slice(0, 4).map((activity) => (
              <div 
                key={activity.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${getPriorityColor(activity.priority || 'medium')}`}
              >
                <div className={`w-2 h-2 ${getPriorityDotColor(activity.priority || 'medium')} rounded-full mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                  )}
                  <p className={`text-xs mt-1 font-medium ${getPriorityTextColor(activity.priority || 'medium')}`}>
                    {getDaysUntil(activity.startDate)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <Button variant="outline" className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50">
          Ver todas las actividades
        </Button>
      </CardContent>
    </Card>
  );
}
