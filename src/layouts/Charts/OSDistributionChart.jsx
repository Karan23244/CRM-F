import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#6366F1", // Indigo
  "#22C55E", // Green
  "#F97316", // Orange
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#A855F7", // Purple
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-md border">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          Campaigns : <span className="font-medium">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const OSDistributionChart = ({ data }) => (
  <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl shadow-lg">
    <h3 className="font-semibold text-lg text-gray-800 mb-4">
      OS Distribution
    </h3>

    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={75}
          outerRadius={110}
          paddingAngle={4}
          stroke="none"
          isAnimationActive>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value) => (
            <span className="text-gray-700 text-sm">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default OSDistributionChart;
