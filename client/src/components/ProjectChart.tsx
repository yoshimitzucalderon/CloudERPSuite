import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProjectChart() {
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
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Proyectos Completados',
            data: [2, 4, 3, 6, 8, 5],
            borderColor: 'hsl(207, 90%, 54%)',
            backgroundColor: 'hsla(207, 90%, 54%, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'hsl(207, 90%, 54%)',
            pointBorderColor: 'hsl(207, 90%, 54%)',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'hsl(240, 10%, 3.9%)',
              titleColor: 'hsl(0, 0%, 98%)',
              bodyColor: 'hsl(0, 0%, 98%)',
              borderColor: 'hsl(240, 3.7%, 15.9%)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: 'hsl(25, 5.3%, 44.7%)'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'hsl(20, 5.9%, 90%)',
                drawBorder: false
              },
              ticks: {
                color: 'hsl(25, 5.3%, 44.7%)'
              }
            }
          },
          elements: {
            point: {
              hoverBackgroundColor: 'hsl(207, 90%, 54%)'
            }
          }
        }
      });
    });
  }, []);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Avance de Proyectos</CardTitle>
          <Select defaultValue="last-month">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-month">Último mes</SelectItem>
              <SelectItem value="last-quarter">Último trimestre</SelectItem>
              <SelectItem value="current-year">Año actual</SelectItem>
            </SelectContent>
          </Select>
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
