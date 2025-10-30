"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface IData {
  QueryType: string;
  SystemType: string;
  NumRuns: number;
  AvgTimeMs: number;
  MinTimeMs: number;
  MaxTimeMs: number;
}

// Transform dữ liệu từ “long form” sang “wide form” cho BarChart
const transformData = (rawData: IData[]) => {
  const map: Record<string, any> = {};

  rawData.forEach((item) => {
    if (!map[item.QueryType]) {
      map[item.QueryType] = { QueryType: item.QueryType };
    }
    map[item.QueryType][item.SystemType] = item.AvgTimeMs;
    map[item.QueryType][`NumRuns_${item.SystemType}`] = item.NumRuns;
  });

  return Object.values(map);
};

export default function QueryPerformanceBarChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/compare`
        );
        setData(transformData(res.data));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen w-full h-full p-4">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="QueryType" />
          <YAxis
            label={{ value: "Time (ms)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="Centralized" name="Centralized" fill="#8884d8">
            <LabelList
              dataKey="NumRuns_Centralized"
              position="top"
              formatter={(val) => `n=${val}`}
            />
          </Bar>
          <Bar dataKey="DISTRIBUTION" name="DISTRIBUTION" fill="#82ca9d">
            <LabelList
              dataKey="NumRuns_DISTRIBUTION"
              position="top"
              formatter={(val) => `n=${val}`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
