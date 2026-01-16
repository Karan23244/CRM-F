import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#3B82F6", // Blue
  "#22C55E", // Green
  "#F97316", // Orange
  "#A855F7", // Purple
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#EAB308", // Yellow
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-md border">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          Campaigns: <span className="font-medium">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const VerticalDistributionChart = ({ data }) => (
  <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-lg">
    <h3 className="font-semibold text-lg text-gray-800 mb-4">
      Vertical Distribution
    </h3>

    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          outerRadius={115}
          paddingAngle={4}
          stroke="none"
          isAnimationActive>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="horizontal"
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

export default VerticalDistributionChart;
