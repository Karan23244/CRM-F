import React, { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { FilterOutlined } from "@ant-design/icons";
import StyledTable from "../../Utils/StyledTable";
import { exportToExcel } from "../exportExcel";
import {
  calculateCTI,
  calculateITE,
  calculateETC,
  calculateFraudScore,
  getZoneDynamic,
  getZoneReason,
  calculatePercentages,
} from "./zoneUtils";
import Swal from "sweetalert2";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import {
  Table,
  Card,
  Typography,
  Select,
  Button,
  Modal,
  Input,
  Collapse,
  Row,
  Col,
  Tooltip as AntTooltip,
} from "antd";
import { RiFileExcel2Line } from "react-icons/ri";
import { FaFilterCircleXmark, FaDownload } from "react-icons/fa6";

const { Title: AntTitle } = Typography;
// Chart.js setup
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
);
import { InfoCircleOutlined } from "@ant-design/icons";
import EditConditionsModal from "./EditConditionModal";
const { Panel } = Collapse;
const apiUrl = import.meta.env.VITE_API_URL2; // Update with your actual API URL
const apiUrl1 = import.meta.env.VITE_API_URL;

export default function OptimizationCampaignAnalysis({
  data = {},
  canEdit,
  selectedDateRange,
}) {
  const user = useSelector((state) => state.auth.user);
  const fields = [
    "fraud_min",
    "fraud_max",
    "cti_min",
    "cti_max",
    "ite_min",
    "ite_max",
    "etc_min",
    "etc_max",
  ];
  const [modalData, setModalData] = useState({
    open: false,
    rows: [],
    color: "",
  });
  const [conditions, setConditions] = useState([]);
  const [editValues, setEditValues] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [subAdmins, setSubAdmins] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const campaignName = data[0]?.campaign_name;
  const [globalIgnores, setGlobalIgnores] = useState({
    fraud: false,
    cti: false,
    ite: false,
    etc: false,
  });
  const [sorter, setSorter] = useState(null);
  const clearAllFilters = useCallback(() => {
    setSelectedFilters({});
    setSorter(null);
  }, []);
  const [noConditionMode, setNoConditionMode] = useState(false);
  // whenever selectedDateRange changes → reset modalData
  useEffect(() => {
    setModalData({ open: false, rows: [], color: "" });
    setSelectedFilters({});
  }, [selectedDateRange]);

  // Step 1 – Compute metrics + zone
  const processed = useMemo(() => {
    if (!conditions.length && !noConditionMode) return [];

    return data.map((row) => {
      const cti = calculateCTI(row.clicks, row.noi);
      const ite = calculateITE(row.noe, row.noi);
      const etc = calculateETC(row.nocrm, row.noe);

      const fraud = calculateFraudScore(row.rti, row.pi, row.noi);

      // ✅ FALLBACK MODE
      if (noConditionMode) {
        return {
          ...row,
          cti,
          ite,
          etc,
          fraud,
          zone: "Red",
          reasons: ["No campaign conditions configured"],
        };
      }

      // ✅ NORMAL MODE
      const zone = getZoneDynamic(
        fraud,
        cti,
        ite,
        etc,
        conditions,
        globalIgnores,
      );

      const reasons = getZoneReason(
        fraud,
        cti,
        ite,
        etc,
        conditions,
        globalIgnores,
      );

      return { ...row, cti, ite, etc, fraud, zone, reasons };
    });
  }, [data, conditions, globalIgnores]);

  // 🔥 Role-based filtering
  let filteredData = [];
  if (Array.isArray(user?.role) && user.role.includes("publisher")) {
    // Publisher → only own username
    filteredData = processed.filter((row) => row.pubam === user.username);
  } else if (
    Array.isArray(user?.role) &&
    user.role.includes("publisher_manager")
  ) {
    // Publisher Manager → own + assigned subadmins
    const allowedNames = [user.username, ...subAdmins.map((sa) => sa.label)];
    filteredData = processed.filter((row) => allowedNames.includes(row.pubam));
  } else {
    // Default → all data (e.g. superadmin/admin)
    filteredData = processed;
  }

  // Step 3 – Group by PUB AM
  const grouped = Object.values(
    filteredData.reduce((acc, row) => {
      if (!acc[row.pubam]) {
        acc[row.pubam] = {
          pubam: row.pubam,
          totalPIDs: 0,
          totalEvents: 0,
          pausedPIDs: 0,
          pausedEvents: 0,
          red: 0,
          redEvents: 0,
          yellow: 0,
          yellowEvents: 0,
          orange: 0,
          orangeEvents: 0,
          green: 0,
          greenEvents: 0,
          reasons: { red: [], orange: [], yellow: [], green: [] }, // ✅ now array of objects
        };
      }

      const g = acc[row.pubam];
      g.totalPIDs += 1;
      g.totalEvents += row.noe;
      // ✅ Track paused
      if (row.is_paused) {
        g.pausedPIDs += 1;
        g.pausedEvents += row.noe;
      }
      if (row.zone.toLowerCase() === "red") {
        g.red += 1;
        g.redEvents += row.noe;
        if (row.reasons?.length) {
          g.reasons.red.push({ pid: row.pid, reasons: row.reasons });
        }
      }
      if (row.zone.toLowerCase() === "orange") {
        g.orange += 1;
        g.orangeEvents += row.noe;
        if (row.reasons?.length) {
          g.reasons.orange.push({ pid: row.pid, reasons: row.reasons });
        }
      }
      if (row.zone.toLowerCase() === "yellow") {
        g.yellow += 1;
        g.yellowEvents += row.noe;
        if (row.reasons?.length) {
          g.reasons.yellow.push({ pid: row.pid, reasons: row.reasons });
        }
      }
      if (row.zone.toLowerCase() === "green") {
        g.green += 1;
        g.greenEvents += row.noe;
        if (row.reasons?.length) {
          g.reasons.green.push({ pid: row.pid, reasons: row.reasons });
        }
      }

      return acc;
    }, {}),
  );

  // Step 4 – Totals
  const totals = useMemo(() => {
    return grouped.reduce(
      (acc, g) => {
        acc.totalPIDs += g.totalPIDs;
        acc.totalEvents += g.totalEvents;
        acc.pausedPIDs += g.pausedPIDs;
        acc.pausedEvents += g.pausedEvents;
        acc.red += g.red;
        acc.redEvents += g.redEvents;
        acc.orange += g.orange;
        acc.orangeEvents += g.orangeEvents;
        acc.yellow += g.yellow;
        acc.yellowEvents += g.yellowEvents;
        acc.green += g.green;
        acc.greenEvents += g.greenEvents;
        return acc;
      },
      {
        totalPIDs: 0,
        totalEvents: 0,
        pausedPIDs: 0,
        pausedEvents: 0,
        red: 0,
        redEvents: 0,
        orange: 0,
        orangeEvents: 0,
        yellow: 0,
        yellowEvents: 0,
        green: 0,
        greenEvents: 0,
      },
    );
  }, [grouped]);

  // Step 2 – Zone counts for Pie chart
  const zoneCounts = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc[row.zone.toLowerCase()] += 1;
        return acc;
      },
      { red: 0, orange: 0, yellow: 0, green: 0 },
    );
  }, [filteredData]);

  // Build raw zone data
  const zoneData = [
    {
      label: "Red Zone (High Risk)",
      value: totals.red,
      events: totals.redEvents,
      color: "rgba(239, 68, 68, 0.9)",
    },
    {
      label: "Orange Zone (Moderate Risk)",
      value: totals.orange,
      events: totals.orangeEvents,
      color: "rgba(251, 146, 60, 0.9)",
    },
    {
      label: "Yellow Zone (Low Risk)",
      value: totals.yellow,
      events: totals.yellowEvents,
      color: "rgba(253, 224, 71, 0.9)",
    },
    {
      label: "Green Zone (Safe)",
      value: totals.green,
      events: totals.greenEvents,
      color: "rgba(34, 197, 94, 0.9)",
    },
  ];

  // ✅ Filter out zones with 0 PIDs
  const filteredZones = zoneData.filter((zone) => zone.value > 0);

  const pieData = {
    labels: filteredZones.map((z) => z.label),
    datasets: [
      {
        data: filteredZones.map((z) => z.value),
        backgroundColor: filteredZones.map((z) => z.color),
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 12,
      },
    ],
    customData: filteredZones.map((z) => ({
      pids: z.value,
      events: z.events,
    })),
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: { size: 14, weight: "bold" },
          color: "#333",
        },
      },
      title: {
        display: true,
        text: "Campaign Zone Distribution",
        font: { size: 18, weight: "bold" },
        color: "#111",
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const custom = pieData.customData?.[index];
            if (!custom) return "";
            return `PIDs: ${custom.pids}, Events: ${custom.events}`;
          },
        },
      },
    },
  };

  // // Step 5 – Inactive PIDs
  const inactivePIDs = useMemo(
    () => filteredData.filter((row) => row.noi < 200),
    [filteredData],
  );

  const colorMap = {
    Red: "bg-red-500 text-black cursor-pointer",
    Orange: "bg-orange-400 text-black cursor-pointer",
    Yellow: "bg-yellow-300 text-black cursor-pointer",
    Green: "bg-green-500 text-black cursor-pointer",
  };
  const assignedSubAdmins = useMemo(
    () => user?.assigned_subadmins || [],
    [user],
  );
  const fetchSubAdmins = async () => {
    try {
      const response = await axios.get(`${apiUrl1}/get-subadmin`);
      if (response.data.success) {
        const subAdminOptions = response.data.data
          .filter((subAdmin) => assignedSubAdmins.includes(subAdmin.id)) // Filter only assigned sub-admins
          .map((subAdmin) => ({
            value: subAdmin.id,
            label: subAdmin.username,
            role: subAdmin.role,
          }));
        setSubAdmins(subAdminOptions);
      }
    } catch (error) {
      console.error("Error fetching sub-admins:", error);
    }
  };
  const fetchConditions = useCallback(async () => {
    if (!campaignName) return; // 🚫 extra safety
    try {
      // Call the correct endpoint
      const res = await axios.get(
        `${apiUrl}/api/zone-conditions/${encodeURIComponent(campaignName)}`,
      );
      let rows = res.data;
      if (rows && rows.length > 0) {
        setConditions(rows);
        setNoConditionMode(false);
        // ✅ Set globalIgnores if data exists
        const { fraud_ignore, cti_ignore, ite_ignore, etc_ignore } = rows[0];
        setGlobalIgnores({
          fraud: !!fraud_ignore,
          cti: !!cti_ignore,
          ite: !!ite_ignore,
          etc: !!etc_ignore,
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setConditions([]);
        setNoConditionMode(true); // ✅ enable fallback mode
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch zone conditions",
        });
      }
    }
  }, [campaignName, apiUrl]);
  useEffect(() => {
    fetchSubAdmins();
    fetchConditions();
  }, [campaignName, JSON.stringify(assignedSubAdmins)]);

  const handleSave = async () => {
    try {
      // Save each row individually
      for (let row of editValues) {
        await axios.post(
          `${apiUrl}/api/zone-conditions/${encodeURIComponent(campaignName)}`,
          {
            zone_color: row.zone_color,
            fraud_min: row.fraud_min || 0,
            fraud_max: row.fraud_max || 9999,
            cti_min: row.cti_min || 0,
            cti_max: row.cti_max || 9999,
            ite_min: row.ite_min || 0,
            ite_max: row.ite_max || 9999,
            etc_min: row.etc_min || 0,
            etc_max: row.etc_max || 9999,
          },
        );
      }

      setConditions(editValues);
      setShowModal(false);
    } catch (err) {
      console.error("Error saving conditions:", err);
    }
  };

  const handleCellClick = (pubam, type) => {
    let rows = [];
    if (pubam === "__TOTAL__") {
      // total row → look across all processed data
      if (type === "paused") {
        rows = filteredData.filter((p) => p.is_paused);
      } else if (type === "all") {
        rows = filteredData;
      } else {
        rows = filteredData.filter((p) => p.zone === type);
      }
    } else {
      // existing logic for per-pubam
      if (type === "paused") {
        rows = filteredData.filter((p) => p.pubam === pubam && p.is_paused);
      } else if (type === "all") {
        rows = filteredData.filter((p) => p.pubam === pubam);
      } else {
        rows = filteredData.filter((p) => p.pubam === pubam && p.zone === type);
      }
    }

    setModalData({
      open: true,
      rows,
      color:
        type === "paused" ? "Paused PIDs" : type === "all" ? "All PIDs" : type,
    });
  };

  const columns = [
    { title: "PUB AM", dataIndex: "pubam", key: "pubam", align: "center" },
    {
      title: "PIDs",
      dataIndex: "totalPIDs",
      key: "totalPIDs",
      align: "center",
      render: (val, record) => (
        <span
          onClick={() => handleCellClick(record.pubam, "all")}
          className="cursor-pointer text-black hover:underline">
          {" "}
          {val}-<span className="text-xs">({record.totalEvents})</span>{" "}
        </span>
      ),
    },
    {
      title: "Paused PIDs",
      dataIndex: "pausedPIDs",
      key: "pausedPIDs",
      align: "center",
      render: (val, record) => (
        <span
          onClick={() => handleCellClick(record.pubam, "paused")}
          className="cursor-pointer text-black hover:underline">
          {val}-<span className="text-xs">({record.pausedEvents})</span>
        </span>
      ),
    },
    ...["Red", "Orange", "Yellow", "Green"].map((color) => ({
      title: color,
      dataIndex: color.toLowerCase(),
      key: color.toLowerCase(),
      align: "center",
      render: (val, record) => (
        <span
          onClick={() => handleCellClick(record.pubam, color)}
          className={`cursor-pointer ${colorMap[color]} p-2 rounded-lg font-semibold`}>
          {val}-
          <span className="text-xs">
            ({record[`${color.toLowerCase()}Events`]})
          </span>
        </span>
      ),
    })),
  ];
  // Extract unique values for each column
  const getUniqueValues = (key) => {
    return [...new Set(modalData.rows.map((row) => row[key]))].filter(
      (val) => val !== null && val !== undefined && val !== "",
    );
  };

  const handleFilterChange = (value, dataIndex) => {
    setSelectedFilters((prev) => ({ ...prev, [dataIndex]: value }));
  };
  // Enhance rows with percentage calculations
  const enhancedRows = useMemo(() => {
    return modalData.rows.map((row) => ({
      ...row,
      percentages: calculatePercentages(
        {
          clicks: row.clicks,
          installs: row.noi,
          noe: row.noe,
          rti: row.rti,
          pi: row.pi,
          pe: row.pe,
        },
        conditions,
        globalIgnores,
      ),
    }));
  }, [modalData.rows, conditions, globalIgnores]);
  console.log("enhance", enhancedRows);
  const filteredDataModal = useMemo(() => {
    return enhancedRows.filter((row) =>
      Object.entries(selectedFilters).every(([key, values]) =>
        values && values.length > 0 ? values.includes(row[key]) : true,
      ),
    );
  }, [enhancedRows, selectedFilters]);

  const getColumnWithFilter = (title, dataIndex) => {
    const isFiltered = selectedFilters[dataIndex]?.length > 0;

    return {
      title: (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: isFiltered ? "#1890ff" : "#000" }}>
            {title}
          </span>
        </div>
      ),
      dataIndex,
      key: dataIndex,

      // ✅ SORTING ADDED HERE
      sorter: (a, b) => {
        const valA = a[dataIndex] ?? "";
        const valB = b[dataIndex] ?? "";

        // If numeric
        if (!isNaN(valA) && !isNaN(valB)) {
          return Number(valA) - Number(valB);
        }

        // If date
        if (
          String(valA).match(/\d{4}-\d{2}-\d{2}/) ||
          String(valB).match(/\d{4}-\d{2}-\d{2}/)
        ) {
          return new Date(valA) - new Date(valB);
        }

        // Default text sorting
        return String(valA).localeCompare(String(valB));
      },
      sortDirections: ["ascend", "descend"],

      // ✅ FILTER DROPDOWN
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Select
            mode="multiple"
            showSearch
            style={{ width: 180 }}
            allowClear
            placeholder={`Filter ${title}`}
            value={selectedFilters[dataIndex] || []}
            onChange={(value) => handleFilterChange(value, dataIndex)}
            optionFilterProp="children">
            {getUniqueValues(dataIndex).map((val) => (
              <Select.Option key={val} value={val}>
                {val}
              </Select.Option>
            ))}
          </Select>
        </div>
      ),

      filterIcon: () => (
        <FilterOutlined style={{ color: isFiltered ? "#1890ff" : "#aaa" }} />
      ),
    };
  };

  // helper to map zone -> color class
  const getZoneColorClass = (zone) => {
    switch (zone) {
      case "Green":
        return "text-green-600";
      case "Yellow":
        return "text-yellow-600";
      case "Orange":
        return "text-orange-600";
      case "Red":
      default:
        return "text-red-600";
    }
  };
  const displayValue = (val) =>
    val === null || val === undefined ? "N/A" : val;

  const modalColumns = [
    getColumnWithFilter("PUB AM", "pubam"),
    getColumnWithFilter("PUBID", "pubid"),
    getColumnWithFilter("PID", "pid"),

    {
      ...getColumnWithFilter("NOI", "noi"),
      render: (val, record) => {
        const perc = record.percentages?.NOI;
        const colorClass = perc
          ? getZoneColorClass(perc.zone)
          : "text-gray-500";
        return (
          <>
            {displayValue(val)}{" "}
            {val !== null && val !== undefined && perc && (
              <span className={`${colorClass} text-xs`}>({perc?.value}%)</span>
            )}
          </>
        );
      },
    },

    {
      ...getColumnWithFilter("RTI", "rti"),
      render: (val, record) => {
        const perc = record.percentages?.RTI;
        const colorClass = perc
          ? getZoneColorClass(perc.zone)
          : "text-gray-500";
        return (
          <>
            {displayValue(val)}{" "}
            {val !== null && val !== undefined && perc && (
              <span className={`${colorClass} text-xs`}>({perc?.value}%)</span>
            )}
          </>
        );
      },
    },

    {
      ...getColumnWithFilter("PI", "pi"),
      render: (val, record) => {
        const perc = record.percentages?.PI;
        const colorClass = perc
          ? getZoneColorClass(perc.zone)
          : "text-gray-500";
        return (
          <>
            {displayValue(val)}{" "}
            {val !== null && val !== undefined && perc && (
              <span className={`${colorClass} text-xs`}>({perc?.value}%)</span>
            )}
          </>
        );
      },
    },

    {
      ...getColumnWithFilter("NOE", "noe"),
      render: (val, record) => {
        const perc = record.percentages?.NOE;
        const colorClass = perc
          ? getZoneColorClass(perc.zone)
          : "text-gray-500";
        return (
          <>
            {displayValue(val)}{" "}
            {val !== null && val !== undefined && perc && (
              <span className={`${colorClass} text-xs`}>({perc?.value}%)</span>
            )}
          </>
        );
      },
    },

    {
      ...getColumnWithFilter("PE", "pe"),
      render: (val, record) => {
        const perc = record.percentages?.PE;
        const colorClass = perc
          ? getZoneColorClass(perc.zone)
          : "text-gray-500";
        return (
          <>
            {displayValue(val)}{" "}
            {val !== null && val !== undefined && perc && (
              <span className={`${colorClass} text-xs`}>({perc?.value}%)</span>
            )}
          </>
        );
      },
    },

    getColumnWithFilter("NOCRM", "nocrm"),
    getColumnWithFilter("CLICKS", "clicks"),
    // ✅ REASON COLUMN
    {
      title: "REASON",
      dataIndex: "reasons",
      key: "reasons",
      align: "center",
      render: (reasons, record) => {
        if (!reasons || !reasons.length) {
          return <span className="text-gray-400">—</span>;
        }

        const tooltipContent = (
          <div className="space-y-1 max-w-xs">
            {reasons.map((reason, idx) => {
              const isCurrentZone = reason
                .toLowerCase()
                .includes(record.zone.toLowerCase());

              return (
                <div
                  key={idx}
                  className={`text-xs px-2 py-1 rounded-md ${
                    isCurrentZone
                      ? "bg-red-100 text-red-700 font-semibold"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                  {reason}
                </div>
              );
            })}
          </div>
        );

        return (
          <AntTooltip
            title={tooltipContent}
            placement="right"
            overlayClassName="reason-tooltip">
            <span className="flex items-center justify-center gap-1 cursor-pointer text-blue-600 font-medium">
              <InfoCircleOutlined />
              {reasons.length} reason{reasons.length > 1 ? "s" : ""}
            </span>
          </AntTooltip>
        );
      },
    },
  ];
  return (
    <div className="min-h-screen space-y-6">
      {/* Always show Edit Conditions on top */}
      <div className="flex justify-between items-center">
        <AntTitle level={4} className="text-gray-800">
          Campaign Dashboard
        </AntTitle>
        {noConditionMode && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-3">
            ⚠ No zone conditions found for this campaign. All traffic is marked
            RED.
          </div>
        )}
        {canEdit && (
          <Button
            type="primary"
            onClick={() => {
              setEditValues([...conditions]);
              setShowModal(true);
            }}
            className="!bg-[#2F5D99] !border-none !text-white !rounded-lg !px-5 !py-2.5 font-medium shadow-sm hover:!bg-blue-700 hover:shadow-md transition-all duration-200">
            Edit Conditions
          </Button>
        )}
      </div>

      {/* Switch between Main Dashboard and Zone Detail */}
      {!modalData.open ? (
        <>
          {/* Campaign Analysis */}
          <Card className="shadow-lg rounded-2xl">
            <AntTitle level={4} className="mb-4 text-gray-800">
              Campaign Analysis
            </AntTitle>
            <StyledTable
              columns={columns}
              dataSource={grouped}
              rowKey={(record) => record.pubam}
              pagination={false}
              bordered
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell
                    index={0}
                    className="font-bold text-center">
                    Total
                  </Table.Summary.Cell>

                  {/* All PIDs */}
                  <Table.Summary.Cell index={1} className="text-center">
                    <span
                      onClick={() => handleCellClick("__TOTAL__", "all")}
                      className="cursor-pointer text-black hover:underline">
                      {totals.totalPIDs}-({totals.totalEvents})
                    </span>
                  </Table.Summary.Cell>

                  {/* Paused */}
                  <Table.Summary.Cell index={2} className="text-center">
                    <span
                      onClick={() => handleCellClick("__TOTAL__", "paused")}
                      className="cursor-pointer text-black hover:underline">
                      {totals.pausedPIDs}-({totals.pausedEvents})
                    </span>
                  </Table.Summary.Cell>

                  {/* Zones */}
                  <Table.Summary.Cell
                    index={3}
                    className={`text-center ${colorMap.Red}`}>
                    <span
                      onClick={() => handleCellClick("__TOTAL__", "Red")}
                      className="cursor-pointer">
                      {totals.red}-({totals.redEvents})
                    </span>
                  </Table.Summary.Cell>

                  <Table.Summary.Cell
                    index={4}
                    className={`text-center ${colorMap.Orange}`}>
                    <span
                      onClick={() => handleCellClick("__TOTAL__", "Orange")}
                      className="cursor-pointer">
                      {totals.orange}-({totals.orangeEvents})
                    </span>
                  </Table.Summary.Cell>

                  <Table.Summary.Cell
                    index={5}
                    className={`text-center ${colorMap.Yellow}`}>
                    <span
                      onClick={() => handleCellClick("__TOTAL__", "Yellow")}
                      className="cursor-pointer">
                      {totals.yellow}-({totals.yellowEvents})
                    </span>
                  </Table.Summary.Cell>

                  <Table.Summary.Cell
                    index={6}
                    className={`text-center ${colorMap.Green}`}>
                    <span
                      onClick={() => handleCellClick("__TOTAL__", "Green")}
                      className="cursor-pointer">
                      {totals.green}-({totals.greenEvents})
                    </span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>

          {/* Top Row: Pie + Inactive PID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
            <Card className="shadow-lg rounded-2xl">
              <div className="h-[500px]">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </Card>
            <Card className="shadow-lg rounded-2xl">
              <AntTitle level={5}>Inactive PIDs</AntTitle>
              <StyledTable
                columns={[
                  { title: "PUB AM", dataIndex: "pubam", key: "pubam" },
                  { title: "PUBID", dataIndex: "pubid", key: "pubid" },
                  { title: "PID", dataIndex: "pid", key: "pid" },
                ]}
                dataSource={inactivePIDs}
                rowKey={(record, idx) => idx}
                pagination={{
                  pageSize: 15, // number of rows per page
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                }}
                size="small"
                bordered
              />
            </Card>
          </div>
        </>
      ) : (
        // Zone Detail Page
        <Card className="shadow-lg rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => {
                setModalData({ open: false, rows: [], color: "" });
                setSelectedFilters({});
              }}>
              ← Back
            </Button>

            <AntTitle level={4}>{modalData.color} Zone Details</AntTitle>

            {/* ⭐ Add Buttons Here */}
            <div className="flex items-center gap-3">
              {/* Clear Filters */}
              <AntTooltip title="Remove All Filters" placement="top">
                <Button
                  onClick={clearAllFilters}
                  type="default"
                  className="!bg-red-600 hover:!bg-red-700 !text-white !rounded-xl !px-2 !py-[10px] shadow-md flex items-center justify-center transition-all duration-200">
                  <FaFilterCircleXmark size={20} />
                </Button>
              </AntTooltip>

              {/* Excel Download */}
              <AntTooltip title="Download Excel" placement="top">
                <Button
                  onClick={() => {
                    const EXPORT_COLUMNS = [
                      "pubam",
                      "pubid",
                      "pid",
                      "noi",
                      "rti",
                      "pi",
                      "noe",
                      "pe",
                      "nocrm",
                      "clicks",
                    ];

                    const tableDataToExport = filteredDataModal.map((row) => {
                      const filteredRow = {};

                      EXPORT_COLUMNS.forEach((col) => {
                        filteredRow[col] = row[col];
                      });

                      return filteredRow;
                    });

                    exportToExcel(tableDataToExport, "advertiser-data.xlsx");
                  }}
                  type="primary"
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-xl !px-2 !py-[10px] shadow-md flex items-center justify-center transition-all duration-200">
                  <RiFileExcel2Line size={20} />
                </Button>
              </AntTooltip>
            </div>
          </div>

          <StyledTable
            columns={modalColumns}
            dataSource={filteredDataModal}
            rowKey={(record) => record.pid}
            bordered
            onChange={(pagination, filters, sorter) => setSorter(sorter)}
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{
              y: 600, // 👈 makes only table body scrollable (adjust height as needed)
            }}
            sticky // 👈 keeps table header fixed while scrolling
            style={{
              maxHeight: "700px", // ✅ ensures the table fits inside the card
            }}
          />
        </Card>
      )}

      {/* Edit Conditions Modal */}
      <EditConditionsModal
        showModal={showModal}
        setShowModal={setShowModal}
        campaignName={campaignName}
        apiUrl={apiUrl}
        onSaved={fetchConditions}
      />
    </div>
  );
}
