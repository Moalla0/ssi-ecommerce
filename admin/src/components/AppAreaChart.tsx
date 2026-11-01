"use client";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { getMonthlySalesTrend } from "@/lib/products";

const chartConfig = {
  totalSales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
  newProducts: {
    label: "New Products",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface MonthlyData {
  month: string;
  totalSales: number;
  newProducts: number;
}

const AppAreaChart = () => {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMonthlySalesTrend(6);
        setChartData(data);
      } catch (err) {
        console.error('Error fetching monthly sales trend:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  if (loading) {
    return (
      <div className="">
        <h1 className="text-lg font-medium mb-6">Monthly Sales Trend</h1>
        <div className="min-h-[200px] w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <h1 className="text-lg font-medium mb-6">Monthly Sales Trend</h1>
        <div className="min-h-[200px] w-full flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>Error loading data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="">
        <h1 className="text-lg font-medium mb-6">Monthly Sales Trend</h1>
        <div className="min-h-[200px] w-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
              <p>No sales data available</p>
              <p className="text-sm">Trend data will appear here once products have sales</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Monthly Sales Trend</h1>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <AreaChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip 
            content={<ChartTooltipContent 
              formatter={(value, name) => [
                name === 'totalSales' ? `${value} sales` : `${value} products`, 
                name === 'totalSales' ? 'Total Sales' : 'New Products'
              ]}
              labelFormatter={(label) => `Month: ${label}`}
            />} 
          />
          <ChartLegend content={<ChartLegendContent />} />
          <defs>
            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-totalSales)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-totalSales)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="fillProducts" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-newProducts)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-newProducts)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="newProducts"
            type="natural"
            fill="url(#fillProducts)"
            fillOpacity={0.4}
            stroke="var(--color-newProducts)"
            stackId="a"
          />
          <Area
            dataKey="totalSales"
            type="natural"
            fill="url(#fillSales)"
            fillOpacity={0.4}
            stroke="var(--color-totalSales)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

export default AppAreaChart;
