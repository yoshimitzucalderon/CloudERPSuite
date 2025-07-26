import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const colorClasses = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    trend: "text-blue-600"
  },
  green: {
    bg: "bg-green-100", 
    text: "text-green-600",
    trend: "text-green-600"
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600", 
    trend: "text-orange-600"
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    trend: "text-purple-600"
  }
};

export default function MetricCard({ title, value, icon: Icon, trend, trendUp, color }: MetricCardProps) {
  const colors = colorClasses[color];
  
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            <p className={`text-sm mt-1 ${colors.trend}`}>
              {trendUp ? (
                <ArrowUp className="w-3 h-3 inline mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 inline mr-1" />
              )}
              {trend}
            </p>
          </div>
          <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
            <Icon className={`${colors.text} text-xl`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
