import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Project } from "@shared/schema";
import { Link } from "wouter";

interface ProjectTableProps {
  projects: Project[];
}

export default function ProjectTable({ projects }: ProjectTableProps) {
  const getStatusColor = (status: string) => {
    const statusColors = {
      planeacion: "bg-gray-100 text-gray-800",
      diseño: "bg-blue-100 text-blue-800", 
      tramites: "bg-yellow-100 text-yellow-800",
      construccion: "bg-green-100 text-green-800",
      ventas: "bg-purple-100 text-purple-800",
      entrega: "bg-indigo-100 text-indigo-800",
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.planeacion;
  };

  const getProjectInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600", 
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
      "from-red-500 to-red-600"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Proyectos Recientes</CardTitle>
          <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todos
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Proyecto</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Estado</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Avance</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Presupuesto</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Fecha límite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.slice(0, 3).map((project, index) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getGradientClass(index)} rounded-lg flex items-center justify-center text-white font-semibold text-sm`}>
                        {getProjectInitials(project.name)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.plannedUnits || 0} unidades</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{project.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-900">
                    {project.totalBudget ? `$${parseFloat(project.totalBudget).toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="py-4 text-sm text-gray-600">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
