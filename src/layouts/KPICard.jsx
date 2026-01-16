import { FaBullhorn } from "react-icons/fa";

const KPICard = ({ title, value, color }) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6
        bg-gradient-to-br ${color}
        text-white shadow-xl
        transition-all duration-300
        hover:scale-[1.02] hover:shadow-2xl
      `}>
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-white/10 blur-2xl opacity-30" />

      {/* Icon */}
      <div className="absolute right-5 top-5 text-white/20 text-5xl">
        <FaBullhorn />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-80 tracking-wide">{title}</p>

        <div className="h-[2px] w-10 bg-white/40 rounded my-3" />

        <h3 className="text-4xl font-extrabold tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

export default KPICard;
