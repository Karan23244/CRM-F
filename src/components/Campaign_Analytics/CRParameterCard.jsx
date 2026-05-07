// // components/CRParameterCard.jsx
// import React from "react";
// import { Card } from "antd";
// import ZoneRangeField from "./ZoneRangeField";

// /**
//  * CRParameterCard
//  * @param {string}   label      - Parameter label e.g. "CTI"
//  * @param {string}   rule       - "rule1" | "rule2"
//  * @param {object}   value      - zone values keyed by zone name
//  * @param {function} onChange   - (updated) => void
//  *
//  * Rule 1 → green:1 range, yellow:2, orange:2, red:2
//  * Rule 2 → all zones 1 range each
//  */
// const RULE_CONFIG = {
//   rule1: { green: 1, yellow: 2, orange: 2, red: 2 },
//   rule2: { green: 1, yellow: 1, orange: 1, red: 1 },
// };

// const CRParameterCard = ({ label, rule = "rule1", value = {}, onChange }) => {
//   const cfg = RULE_CONFIG[rule];

//   const handleZoneChange = (zone, zoneVal) => {
//     onChange && onChange({ ...value, [zone]: zoneVal });
//   };

//   return (
//     <Card
//       size="small"
//       title={
//         <span className="font-semibold text-gray-700 text-sm">{label}</span>
//       }
//       className="shadow-sm border-gray-200 mb-3"
//       bodyStyle={{ padding: "12px" }}
//     >
//       {Object.entries(cfg).map(([zone, rangeCount]) => (
//         <ZoneRangeField
//           key={zone}
//           zone={zone}
//           rangeCount={rangeCount}
//           value={value[zone] || {}}
//           onChange={(v) => handleZoneChange(zone, v)}
//         />
//       ))}
//     </Card>
//   );
// };

// export default CRParameterCard;

// components/CRParameterCard.jsx
import React from "react";
import { Card, Tabs, Badge } from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  FireOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import ZoneRangeField from "./ZoneRangeField";

/**
 * CRParameterCard
 * Modern Tab Based UI
 */

const RULE_CONFIG = {
  rule1: { green: 1, yellow: 2, orange: 2, red: 2 },
  rule2: { green: 1, yellow: 1, orange: 1, red: 1 },
};

const ZONE_META = {
  green: {
    label: "Green Zone",
    icon: <CheckCircleOutlined />,
    color: "#16a34a",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  yellow: {
    label: "Yellow Zone",
    icon: <WarningOutlined />,
    color: "#ca8a04",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  orange: {
    label: "Orange Zone",
    icon: <FireOutlined />,
    color: "#ea580c",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  red: {
    label: "Red Zone",
    icon: <CloseCircleOutlined />,
    color: "#dc2626",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const CRParameterCard = ({ label, rule = "rule1", value = {}, onChange }) => {
  const cfg = RULE_CONFIG[rule];

  const handleZoneChange = (zone, zoneVal) => {
    onChange && onChange({ ...value, [zone]: zoneVal });
  };

  const tabItems = Object.entries(cfg).map(([zone, rangeCount]) => {
    const meta = ZONE_META[zone];

    return {
      key: zone,
      label: (
        <div className="flex items-center gap-2 px-1">
          <Badge color={meta.color} />
          <span className="font-medium capitalize">{meta.label}</span>
        </div>
      ),

      children: (
        <div
          className={`
            rounded-xl 
            border 
            p-4 
            transition-all 
            duration-300
            ${meta.bg}
            ${meta.border}
          `}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div
              className="flex items-center gap-2 text-base font-semibold"
              style={{ color: meta.color }}>
              {meta.icon}
              {meta.label}
            </div>

            <div className="text-xs bg-white px-3 py-1 rounded-full shadow-sm border text-gray-600">
              {rangeCount} Range{rangeCount > 1 ? "s" : ""}
            </div>
          </div>

          {/* Fields */}
          <ZoneRangeField
            zone={zone}
            rangeCount={rangeCount}
            value={value[zone] || {}}
            onChange={(v) => handleZoneChange(zone, v)}
          />
        </div>
      ),
    };
  });

  return (
    <>
      {/* Top Header */}
      <div
        className="
          px-5
          py-4
          border-b
        ">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-black text-lg font-bold m-0">
              {label} Configuration
            </h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4">
        <Tabs
          defaultActiveKey="green"
          type="card"
          size="middle"
          items={tabItems}
          className="modern-zone-tabs"
        />
      </div>
    </>
  );
};

export default CRParameterCard;
