import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BudgetChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Import Chart.js dynamically to avoid SSR issues
    import('chart.js/auto').then((Chart) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      const existingChart = Chart.Chart.getChart(ctx);
      if (existingChart) {
        existingChart.destroy();
      }

      new Chart.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Construcción', 'Terreno', 'Marketing', 'Administrativos', 'Contingencia'],
          datasets: [{
            data: [45, 25, 15, 10, 5],
            backgroundColor: [
              'hsl(207, 90%, 54%)',
              'hsl(142, 76%, 36%)',
              'hsl(25, 95%, 53%)',
              'hsl(0, 84%, 60%)',
              'hsl(220, 9%, 46%)'
            ],
            borderWidth: 0,
            hoverBorderWidth: 2,
            hoverBorderColor: 'hsl(0, 0%, 100%)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                color: 'hsl(20, 14.3%, 4.1%)',
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'hsl(240, 10%, 3.9%)',
              titleColor: 'hsl(0, 0%, 98%)',
              bodyColor: 'hsl(0, 0%, 98%)',
              borderColor: 'hsl(240, 3.7%, 15.9%)',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  return `${label}: ${value}%`;
                }
              }
            }
          },
          cutout: '60%'
        }
      });
    });
  }, []);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Distribución Presupuestal</CardTitle>
          <Button 
            variant="ghost" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50"
            onClick={() => window.location.href = "/budget"}
          >
            Ver detalle
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-64 w-full">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
      </CardContent>
    </Card>
  );
}
