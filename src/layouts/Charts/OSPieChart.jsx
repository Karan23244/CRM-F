import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#6366F1",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#0EA5E9",
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg px-4 py-2 border">
        <p className="text-sm font-semibold text-gray-700">
          {payload[0].name}
        </p>

        <p className="text-sm text-indigo-600 font-bold">
          {payload[0].value}
        </p>
      </div>
    );
  }

  return null;
};

export default function OSPieChart({ title, data }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-full">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>

        <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">
          Distribution
        </span>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={60}
            paddingAngle={3}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}