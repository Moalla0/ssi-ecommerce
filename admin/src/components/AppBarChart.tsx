"use client";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { getCategorySalesData } from "@/lib/products";

const chartConfig = {
  total: {
    label: "Sales",
    color: "var(--chart-1)",
  },
  successful: {
    label: "Products",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

interface CategoryData {
  category: string;
  totalSales: number;
  productCount: number;
}

const AppBarChart = () => {
  const [chartData, setChartData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategorySalesData(6);
        setChartData(data);
      } catch (err) {
        console.error('Error fetching category sales data:', err);
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
        <h1 className="text-lg font-medium mb-6">Category Performance</h1>
        <div className="min-h-[200px] w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <h1 className="text-lg font-medium mb-6">Category Performance</h1>
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
        <h1 className="text-lg font-medium mb-6">Category Performance</h1>
        <div className="min-h-[200px] w-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
              <p>No sales data available</p>
              <p className="text-sm">Categories will appear here once products have sales</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Category Performance</h1>
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.length > 8 ? value.slice(0, 8) + '...' : value}
          />
          <YAxis
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip 
            content={<ChartTooltipContent 
              formatter={(value, name) => [
                name === 'totalSales' ? `${value} sales` : `${value} products`, 
                name === 'totalSales' ? 'Total Sales' : 'Product Count'
              ]}
              labelFormatter={(label) => `Category: ${label}`}
            />} 
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="totalSales" fill="var(--color-total)" radius={4} />
          <Bar dataKey="productCount" fill="var(--color-successful)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default AppBarChart;
