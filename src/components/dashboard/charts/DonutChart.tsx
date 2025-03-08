
import { ChartDataPoint } from "@/types/dashboard.types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DonutChartConfig {
  width: number;
  height: number;
  innerRadius: number;
  outerRadius: number;
}

interface DonutChartProps {
  data: ChartDataPoint[];
  config: DonutChartConfig;
  primaryValue?: number | string;
  primaryLabel?: string;
}

export const DonutChart = ({ 
  data, 
  config,
  primaryValue, 
  primaryLabel
}: DonutChartProps) => {
  return (
    <div className="relative">
      <ResponsiveContainer width={config.width} height={config.height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            paddingAngle={1}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value}`, 'Count']}
            labelFormatter={(index: number) => data[index].name}
          />
        </PieChart>
      </ResponsiveContainer>
      {primaryValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold">{primaryValue}</p>
          {primaryLabel && <p className="text-sm text-muted-foreground">{primaryLabel}</p>}
        </div>
      )}
    </div>
  );
};
