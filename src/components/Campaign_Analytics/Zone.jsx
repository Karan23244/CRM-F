import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { FilterOutlined } from "@ant-design/icons";
import {
  calculateCTI,
  calculateITE,
  calculateETC,
  calculateFraudScore,
  getZoneDynamic,
  getZoneReason,
  calculatePercentages,
} from "./zoneUtils";
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
  Title
);
import { InfoCircleOutlined } from "@ant-design/icons";
const { Panel } = Collapse;
const apiUrl = "https://gapi.clickorbits.in"; // Update with your actual API URL
const apiUrl1 = "https://apii.clickorbits.in/api";

export default function OptimizationCampaignAnalysis({ data = {}, canEdit }) {
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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
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
  console.log(conditions, " conditions");
  // Step 1 – Compute metrics + zone
  const processed = data.map((row) => {
    const cti = calculateCTI(row.clicks, row.noi);
    const ite = calculateITE(row.noe, row.noi);
    const etc = calculateETC(row.nocrm, row.noe);
    const fraud = calculateFraudScore(row.pe, row.rti, row.pi);
    const zone = getZoneDynamic(
      fraud,
      cti,
      ite,
      etc,
      conditions,
      globalIgnores
    );
    const reasons = getZoneReason(
      fraud,
      cti,
      ite,
      etc,
      conditions,
      globalIgnores
    );

    return { ...row, cti, ite, etc, fraud, zone, reasons };
  });

  // 🔥 Role-based filtering
  let filteredData = [];
  if (user?.role === "publisher") {
    // Publisher → only own username
    filteredData = processed.filter((row) => row.pubam === user.username);
  } else if (user?.role === "publisher_manager") {
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
    }, {})
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
      }
    );
  }, [grouped]);

  // Step 2 – Zone counts for Pie chart
  const zoneCounts = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc[row.zone.toLowerCase()] += 1;
        return acc;
      },
      { red: 0, orange: 0, yellow: 0, green: 0 }
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

  // const pieOptions = {
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       position: "right",
  //       labels: {
  //         font: {
  //           size: 14,
  //         },
  //       },
  //     },
  //     tooltip: {
  //       callbacks: {
  //         label: function (context) {
  //           const index = context.dataIndex;
  //           const custom = pieData.customData?.[index]; // ✅ safe check
  //           if (!custom) return ""; // if no data, show nothing

  //           return `PIDs: ${custom.pids}, Events: ${custom.events}`;
  //         },
  //       },
  //     },
  //   },
  // };

  // // Step 5 – Inactive PIDs
  const inactivePIDs = useMemo(
    () => filteredData.filter((row) => row.noi < 200),
    [filteredData]
  );

  const colorMap = {
    Red: "bg-red-500 text-black cursor-pointer",
    Orange: "bg-orange-400 text-black cursor-pointer",
    Yellow: "bg-yellow-300 text-black cursor-pointer",
    Green: "bg-green-500 text-black cursor-pointer",
  };
  const assignedSubAdmins = useMemo(
    () => user?.assigned_subadmins || [],
    [user]
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
  useEffect(() => {
    const fetchConditions = async () => {
      try {
        // Call the correct endpoint
        const res = await axios.get(
          `${apiUrl}/api/zone-conditions/${encodeURIComponent(campaignName)}`
        );

        let rows = res.data;
        if (rows && rows.length > 0) {
          setConditions(rows);

          // ✅ Set globalIgnores if data exists
          const { fraud_ignore, cti_ignore, ite_ignore, etc_ignore } = rows[0];
          setGlobalIgnores({
            fraud: !!fraud_ignore,
            cti: !!cti_ignore,
            ite: !!ite_ignore,
            etc: !!etc_ignore,
          });
        } else {
          // Otherwise fetch the default ones
          const defaultRes = await axios.get(
            `${apiUrl}/api/zone-conditions/__DEFAULT__`
          );
          setConditions(defaultRes.data);

          if (defaultRes.data.length > 0) {
            const { fraud_ignore, cti_ignore, ite_ignore, etc_ignore } =
              defaultRes.data[0];
            setGlobalIgnores({
              fraud: !!fraud_ignore,
              cti: !!cti_ignore,
              ite: !!ite_ignore,
              etc: !!etc_ignore,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching conditions:", err);

        // As a safety fallback, try default
        try {
          const defaultRes = await axios.get(
            `${apiUrl}/api/zone-conditions/__DEFAULT__`
          );
          setConditions(defaultRes.data);

          if (defaultRes.data.length > 0) {
            const { fraud_ignore, cti_ignore, ite_ignore, etc_ignore } =
              defaultRes.data[0];
            setGlobalIgnores({
              fraud: !!fraud_ignore,
              cti: !!cti_ignore,
              ite: !!ite_ignore,
              etc: !!etc_ignore,
            });
          }
        } catch (err2) {
          console.error("Error fetching default conditions:", err2);
        }
      }
    };

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
          }
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
        // <span
        //   onClick={() => handleCellClick(record.pubam, color)}
        //   className={`cursor-pointer ${colorMap[color]} p-2 rounded-lg font-semibold`}>
        //   {val}-
        //   <AntTooltip
        //     title={
        //       record.reasons?.[color.toLowerCase()]?.length ? (
        //         <div>
        //           {record.reasons[color.toLowerCase()].map((item, idx) => (
        //             <div key={idx}>
        //               <strong>{item.pid}:</strong> {item.reasons.join(", ")}
        //             </div>
        //           ))}
        //         </div>
        //       ) : (
        //         "No reason available"
        //       )
        //     }>
        //     <span className="text-xs cursor-help ml-1 text-black">
        //       ({record[`${color.toLowerCase()}Events`]}) i
        //     </span>
        //   </AntTooltip>
        // </span>
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
    return [...new Set(modalData.rows.map((row) => row[key]))].filter(Boolean);
  };

  const handleFilterChange = (value, dataIndex) => {
    setSelectedFilters((prev) => ({ ...prev, [dataIndex]: value }));
  };
  // Enhance rows with percentage calculations
  const enhancedRows = useMemo(() => {
    return modalData.rows.map((row) => {
      const perc = calculatePercentages(
        {
          clicks: row.clicks,
          installs: row.noi,
          noe: row.noe,
          rti: row.rti,
          pi: row.pi,
          pe: row.pe,
        },
        conditions // ✅ second argument
      );

      return { ...row, percentages: perc };
    });
  }, [modalData.rows, conditions, globalIgnores]);
  const filteredDataModal = useMemo(() => {
    return enhancedRows.filter((row) =>
      Object.entries(selectedFilters).every(([key, values]) =>
        values && values.length > 0 ? values.includes(row[key]) : true
      )
    );
  }, [enhancedRows, selectedFilters]);

  const getColumnWithFilter = (title, dataIndex) => ({
    title: (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {title}
      </div>
    ),
    dataIndex,
    key: dataIndex,
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
          optionFilterProp="children" // enables search by label text
        >
          {getUniqueValues(dataIndex).map((val) => (
            <Select.Option key={val} value={val}>
              {val}
            </Select.Option>
          ))}
        </Select>
      </div>
    ),
    filterIcon: (filtered) => (
      <FilterOutlined style={{ color: filtered ? "#1890ff" : "#aaa" }} />
    ),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        // optional: do something when dropdown opens
      }
    },
  });

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
            {val}{" "}
            <span className={`${colorClass} text-xs`}>
              ({perc?.value.toFixed(2)}%)
            </span>
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
            {val}{" "}
            <span className={`${colorClass} text-xs`}>
              ({perc?.value.toFixed(2)}%)
            </span>
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
            {val}{" "}
            <span className={`${colorClass} text-xs`}>
              ({perc?.value.toFixed(2)}%)
            </span>
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
            {val}{" "}
            <span className={`${colorClass} text-xs`}>
              ({perc?.value.toFixed(2)}%)
            </span>
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
            {val}{" "}
            <span className={`${colorClass} text-xs`}>
              ({perc?.value.toFixed(2)}%)
            </span>
          </>
        );
      },
    },

    getColumnWithFilter("NOCRM", "nocrm"),
    getColumnWithFilter("CLICKS", "clicks"),
  ];

  return (
    <div className="min-h-screen space-y-6">
      {/* Always show Edit Conditions on top */}
      <div className="flex justify-between items-center">
        <AntTitle level={4} className="text-gray-800">
          Campaign Dashboard
        </AntTitle>
        {canEdit && (
          <Button
            type="primary"
            onClick={() => {
              setEditValues([...conditions]);
              setShowModal(true);
            }}>
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
            <Table
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
              <Table
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
              onClick={() =>
                setModalData({ open: false, rows: [], color: "" })
              }>
              ← Back
            </Button>
            <AntTitle level={4}>{modalData.color} Zone Details</AntTitle>
          </div>

          <Table
            columns={modalColumns}
            dataSource={filteredDataModal}
            rowKey={(record) => record.pid}
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
          />
        </Card>
      )}

      {/* Edit Conditions Modal */}
      <Modal
        title="Edit Conditions"
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSave}
        width={750}>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <div className="mb-4">
            <strong>Global Ignore:</strong>
            {["fraud", "cti", "ite", "etc"].map((metric) => (
              <label key={metric} className="ml-4 text-sm">
                <input
                  type="checkbox"
                  checked={globalIgnores[metric]}
                  onChange={async (e) => {
                    const newValue = e.target.checked;
                    const updated = { ...globalIgnores, [metric]: newValue };
                    setGlobalIgnores(updated);

                    await fetch(
                      `${apiUrl}/api/zone-conditions/${encodeURIComponent(
                        campaignName
                      )}/set-ignores`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          fraud_ignore: updated.fraud ? 1 : 0,
                          cti_ignore: updated.cti ? 1 : 0,
                          ite_ignore: updated.ite ? 1 : 0,
                          etc_ignore: updated.etc ? 1 : 0,
                        }),
                      }
                    );
                  }}
                />

                {" Ignore "}
                {metric.toUpperCase()}
              </label>
            ))}
          </div>
          <Collapse accordion defaultActiveKey={["1"]} bordered={false}>
            {editValues.map((cond, idx) => (
              <Panel
                header={
                  <div className="flex items-center gap-2 font-semibold">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        cond.zone_color === "Green"
                          ? "bg-green-500"
                          : cond.zone_color === "Orange"
                          ? "bg-orange-500"
                          : cond.zone_color === "Yellow"
                          ? "bg-yellow-400"
                          : "bg-red-500"
                      }`}></span>
                    {cond.zone_color} Zone
                  </div>
                }
                key={cond.id}>
                <Row gutter={16}>
                  {fields.map((field) => (
                    <Col span={12} key={field} className="mb-3">
                      <label className="block text-xs font-medium mb-1 uppercase text-gray-600">
                        {field.replace("_", " ")}
                        <AntTooltip
                          title={`Enter value for ${field.replace("_", " ")}`}>
                          <InfoCircleOutlined className="ml-1 text-gray-400" />
                        </AntTooltip>
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={cond[field]}
                        onChange={(e) => {
                          const updated = [...editValues];
                          updated[idx][field] = e.target.value;
                          setEditValues(updated);
                        }}
                      />
                    </Col>
                  ))}
                </Row>
              </Panel>
            ))}
          </Collapse>
        </div>
      </Modal>
    </div>
  );
}
