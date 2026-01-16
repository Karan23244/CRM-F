import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const OffersTrendChart = ({ data }) => (
  <div className="bg-white p-5 rounded-xl shadow">
    <h3 className="font-semibold mb-4">Offers Over Time</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default OffersTrendChart;
