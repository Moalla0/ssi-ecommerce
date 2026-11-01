"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategorySalesData } from "@/lib/products";

const chartConfig = {
  products: {
    label: "Products",
  },
  category1: {
    label: "Category 1",
    color: "var(--chart-1)",
  },
  category2: {
    label: "Category 2",
    color: "var(--chart-2)",
  },
  category3: {
    label: "Category 3",
    color: "var(--chart-3)",
  },
  category4: {
    label: "Category 4",
    color: "var(--chart-4)",
  },
  category5: {
    label: "Category 5",
    color: "var(--chart-5)",
  },
  category6: {
    label: "Category 6",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig;

interface CategoryData {
  category: string;
  totalSales: number;
  productCount: number;
}

const AppPieChart = () => {
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
        console.error('Error fetching category data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform data for pie chart
  const pieData = chartData.map((item, index) => ({
    category: item.category,
    products: item.productCount,
    fill: `var(--color-category${index + 1})`
  }));

  const totalProducts = chartData.reduce((acc, curr) => acc + curr.productCount, 0);
  
  if (loading) {
    return (
      <div className="">
        <h1 className="text-lg font-medium mb-6">Category Distribution</h1>
        <div className="mx-auto aspect-square max-h-[250px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <h1 className="text-lg font-medium mb-6">Category Distribution</h1>
        <div className="mx-auto aspect-square max-h-[250px] flex items-center justify-center">
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
        <h1 className="text-lg font-medium mb-6">Category Distribution</h1>
        <div className="mx-auto aspect-square max-h-[250px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
              <p>No categories available</p>
              <p className="text-sm">Categories will appear here once products are added</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Category Distribution</h1>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent 
              formatter={(value, name) => [
                `${value} products`, 
                name === 'products' ? 'Product Count' : name
              ]}
              labelFormatter={(label) => `Category: ${label}`}
            />}
          />
          <Pie
            data={pieData}
            dataKey="products"
            nameKey="category"
            innerRadius={60}
            strokeWidth={5}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold"
                      >
                        {totalProducts.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        Products
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-4 flex flex-col gap-2 items-center">
        <div className="flex items-center gap-2 font-medium leading-none">
          {chartData.length} categories <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing product distribution across categories
        </div>
      </div>
    </div>
  );
};

export default AppPieChart;
