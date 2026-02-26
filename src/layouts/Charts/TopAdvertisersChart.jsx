import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#0EA5E9"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg px-4 py-2 border">
        <p className="text-sm font-semibold text-gray-700">
          {payload[0].payload.name}
        </p>
        <p className="text-sm text-indigo-600 font-bold">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const TopAdvertisersChart = ({ data, role }) => {
  const normalizedRole = Array.isArray(role) ? role[0] : role;

  const isPublisher = ["publisher", "publisher_manager"].includes(
    normalizedRole,
  );
  const chartData = data.map((d) => ({
    ...d,
    label: isPublisher ? `${d.adv_id}` : d.name,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700 text-lg">Top Advertisers</h3>
        <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">
          Performance
        </span>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 70 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E5E7EB"
          />

          {/* X Axis */}
          <XAxis
            dataKey="label"
            interval={0}
            angle={-25}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickFormatter={(value) =>
              value.length > 18 ? value.slice(0, 18) + "…" : value
            }
          />

          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const p = payload[0].payload;
                return (
                  <div className="bg-white shadow-lg rounded-lg px-4 py-2 border">
                    <p className="text-sm font-semibold text-gray-700">
                      {isPublisher ? `${p.adv_id}` : p.name}
                    </p>
                    <p className="text-sm text-indigo-600 font-bold">
                      {payload[0].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar dataKey="value" barSize={40} radius={[10, 10, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopAdvertisersChart;
