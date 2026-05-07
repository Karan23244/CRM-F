// // components/ZoneRangeField.jsx
// import React from "react";
// import { InputNumber } from "antd";

// const ZONE_STYLES = {
//   green:  { label: "Green Zone",  bg: "bg-green-50",  border: "border-green-300",  text: "text-green-700",  dot: "bg-green-500"  },
//   yellow: { label: "Yellow Zone", bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", dot: "bg-yellow-500" },
//   orange: { label: "Orange Zone", bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", dot: "bg-orange-500" },
//   red:    { label: "Red Zone",    bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700",    dot: "bg-red-500"    },
// };

// /**
//  * ZoneRangeField
//  * @param {string}   zone        - "green" | "yellow" | "orange" | "red"
//  * @param {number}   rangeCount  - how many min/max pairs to render (1 or 2)
//  * @param {object}   value       - { range1: { min, max }, range2: { min, max } }
//  * @param {function} onChange    - (updated value) => void
//  */
// const ZoneRangeField = ({ zone, rangeCount = 1, value = {}, onChange }) => {
//   const s = ZONE_STYLES[zone];

//   const handleChange = (rangeKey, field, val) => {
//     const updated = {
//       ...value,
//       [rangeKey]: { ...(value[rangeKey] || {}), [field]: val },
//     };
//     onChange && onChange(updated);
//   };

//   const ranges = Array.from({ length: rangeCount }, (_, i) => `range${i + 1}`);

//   return (
//     <div className={`rounded-lg border ${s.border} ${s.bg} p-3 mb-2`}>
//       <div className="flex items-center gap-2 mb-2">
//         <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
//         <span className={`text-xs font-semibold uppercase tracking-wide ${s.text}`}>
//           {s.label}
//         </span>
//       </div>
//       <div className="flex flex-col gap-2">
//         {ranges.map((rKey, idx) => (
//           <div key={rKey} className="flex items-center gap-2">
//             {rangeCount > 1 && (
//               <span className="text-xs text-gray-400 w-14">Range {idx + 1}</span>
//             )}
//             <div className="flex items-center gap-1 flex-1">
//               <InputNumber
//                 size="small"
//                 placeholder="Min"
//                 className="flex-1"
//                 value={value[rKey]?.min ?? null}
//                 onChange={(val) => handleChange(rKey, "min", val)}
//               />
//               <span className="text-gray-400 text-xs">–</span>
//               <InputNumber
//                 size="small"
//                 placeholder="Max"
//                 className="flex-1"
//                 value={value[rKey]?.max ?? null}
//                 onChange={(val) => handleChange(rKey, "max", val)}
//               />
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ZoneRangeField;

// components/ZoneRangeField.jsx
// components/ZoneRangeField.jsx
import React from "react";
import { InputNumber } from "antd";

const ZONE_STYLES = {
  green: {
    text: "text-green-700",
    badge: "bg-green-100 text-green-700",
  },

  yellow: {
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-700",
  },

  orange: {
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700",
  },

  red: {
    text: "text-red-700",
    badge: "bg-red-100 text-red-700",
  },
};

const ZoneRangeField = ({ zone, rangeCount = 1, value = {}, onChange }) => {
  const s = ZONE_STYLES[zone];

  const handleChange = (rangeKey, field, val) => {
    const updated = {
      ...value,
      [rangeKey]: {
        ...(value[rangeKey] || {}),
        [field]: val,
      },
    };

    onChange && onChange(updated);
  };

  const ranges = Array.from({ length: rangeCount }, (_, i) => `range${i + 1}`);

  return (
    <div className="space-y-4">
      {ranges.map((rKey, idx) => (
        <div
          key={rKey}
          className="
            bg-white
            rounded-2xl
            border border-gray-100
            p-4
            shadow-sm
            hover:shadow-md
            transition-all duration-300
          ">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Min */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Minimum Value
              </label>

              <InputNumber
                size="large"
                placeholder="Enter minimum value"
                className="w-full"
                style={{ width: "100%" }}
                value={value[rKey]?.min ?? null}
                onChange={(val) => handleChange(rKey, "min", val)}
              />
            </div>

            {/* Max */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Maximum Value
              </label>

              <InputNumber
                size="large"
                placeholder="Enter maximum value"
                className="w-full"
                style={{ width: "100%" }}
                value={value[rKey]?.max ?? null}
                onChange={(val) => handleChange(rKey, "max", val)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ZoneRangeField;
