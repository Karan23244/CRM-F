import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  calculateCTI,
  calculateITE,
  calculateETC,
  calculateFraudScore,
  getZoneDynamic,
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
import { Table, Card, Typography, Button, Modal, Input } from "antd";
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
const apiUrl = "https://gapi.clickorbits.in";

export default function OptimizationCampaignAnalysis({ data = {} }) {
  console.log("Data received in OptimizationCampaignAnalysis:", data);
  const [modalData, setModalData] = useState({
    open: false,
    rows: [],
    color: "",
  });
  const [conditions, setConditions] = useState([]);
  const [editValues, setEditValues] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const campaignName = data[0]?.campaign_name;
  console.log("Campaign Name:", campaignName);
  // Step 1 – Compute metrics + zone
  const processed = useMemo(() => {
    return data.map((row) => {
      const cti = calculateCTI(row.clicks, row.noi);
      const ite = calculateITE(row.noe, row.noi);
      const etc = calculateETC(row.nocrm, row.noe);
      const fraud = calculateFraudScore(row.pe, row.rti, row.pi);
      const zone = getZoneDynamic(fraud, cti, ite, etc, conditions);
      return { ...row, cti, ite, etc, fraud, zone };
    });
  }, [data, conditions]); // ✅ include conditions

  // Step 2 – Zone counts for Pie chart
  const zoneCounts = useMemo(() => {
    return processed.reduce(
      (acc, row) => {
        acc[row.zone.toLowerCase()] += 1;
        return acc;
      },
      { red: 0, orange: 0, yellow: 0, green: 0 }
    );
  }, [processed]);

  const pieData = {
    labels: [
      "Number of PID's in Red Zone",
      "Number of PID's in Orange Zone",
      "Number of PID's in Yellow Zone",
      "Number of PID's in Green Zone",
    ],
    datasets: [
      {
        data: [
          zoneCounts.red,
          zoneCounts.orange,
          zoneCounts.yellow,
          zoneCounts.green,
        ],
        backgroundColor: ["#ef4444", "#fb923c", "#fde047", "#22c55e"],
        borderWidth: 1,
      },
    ],
  };
  // Step 3 – Group by PUB AM
  const grouped = useMemo(() => {
    const map = {};
    processed.forEach((p) => {
      if (!map[p.pubam]) {
        map[p.pubam] = {
          pubam: p.pubam,
          totalPIDs: 0,
          totalEvents: 0,
          pausedEvents: 0,
          pausedPIDs: 0,
          red: 0,
          redEvents: 0,
          orange: 0,
          orangeEvents: 0,
          yellow: 0,
          yellowEvents: 0,
          green: 0,
          greenEvents: 0,
        };
      }

      // PID count
      map[p.pubam].totalPIDs += 1;

      // Total events for pubam
      map[p.pubam].totalEvents += p.noe || 0;

      // Paused PID count
      if (p.is_paused) {
        map[p.pubam].pausedPIDs += 1;
        map[p.pubam].pausedEvents += p.noe || 0;
      }

      // Zone-based PID + event counts
      if (p.zone === "Red") {
        map[p.pubam].red += 1;
        map[p.pubam].redEvents += p.noe || 0;
      }
      if (p.zone === "Orange") {
        map[p.pubam].orange += 1;
        map[p.pubam].orangeEvents += p.noe || 0;
      }
      if (p.zone === "Yellow") {
        map[p.pubam].yellow += 1;
        map[p.pubam].yellowEvents += p.noe || 0;
      }
      if (p.zone === "Green") {
        map[p.pubam].green += 1;
        map[p.pubam].greenEvents += p.noe || 0;
      }
    });

    return Object.values(map);
  }, [processed]);

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

  // // Step 5 – Inactive PIDs
  const inactivePIDs = useMemo(
    () => processed.filter((row) => row.noi < 200),
    [processed]
  );

  const colorMap = {
    Red: "bg-red-500 text-black cursor-pointer",
    Orange: "bg-orange-400 text-black cursor-pointer",
    Yellow: "bg-yellow-300 text-black cursor-pointer",
    Green: "bg-green-500 text-black cursor-pointer",
  };

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        // Call the correct endpoint
        const res = await axios.get(
          `${apiUrl}/api/zone-conditions/${encodeURIComponent(campaignName)}`
        );
        console.log("Fetched conditions:", res.data);
        // If campaign-specific conditions exist, use them
        if (res.data && res.data.length > 0) {
          setConditions(res.data);
        } else {
          // Otherwise fetch the default ones
          const defaultRes = await axios.get(
            `${apiUrl}/api/zone-conditions/__DEFAULT__`
          );
          console.log("Fetched default conditions:", defaultRes.data);
          setConditions(defaultRes.data);
        }
      } catch (err) {
        console.error("Error fetching conditions:", err);
        // As a safety fallback, try default
        try {
          const defaultRes = await axios.get(
            `${apiUrl}/api/zone-conditions/__DEFAULT__`
          );
          setConditions(defaultRes.data);
        } catch (err2) {
          console.error("Error fetching default conditions:", err2);
        }
      }
    };

    fetchConditions();
  }, [campaignName]);
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

    if (type === "paused") {
      rows = processed.filter((p) => p.pubam === pubam && p.is_paused);
    } else if (type === "all") {
      rows = processed.filter((p) => p.pubam === pubam);
    } else {
      rows = processed.filter((p) => p.pubam === pubam && p.zone === type);
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
          {val}-<span className="text-xs">({record.totalEvents})i</span>
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
          {val}-<span className="text-xs">({record.pausedEvents})i</span>
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
            ({record[`${color.toLowerCase()}Events`]})i
          </span>
        </span>
      ),
    })),
  ];
  return (
    <div className="min-h-screen space-y-6">
      {/* Always show Edit Conditions on top */}
      <div className="flex justify-between items-center">
        <AntTitle level={4} className="text-gray-800">
          Campaign Dashboard
        </AntTitle>
        <Button
          type="primary"
          onClick={() => {
            setEditValues([...conditions]);
            setShowModal(true);
          }}>
          Edit Conditions
        </Button>
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
                  <Table.Summary.Cell index={1} className="text-center">
                    {totals.totalPIDs}-({totals.totalEvents})i
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} className="text-center">
                    {totals.pausedPIDs}-({totals.pausedEvents})i
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={3}
                    className={`text-center ${colorMap.Red}`}>
                    {totals.red}-({totals.redEvents})i
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={4}
                    className={`text-center ${colorMap.Orange}`}>
                    {totals.orange}-({totals.orangeEvents})i
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={5}
                    className={`text-center ${colorMap.Yellow}`}>
                    {totals.yellow}-({totals.yellowEvents})i
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={6}
                    className={`text-center ${colorMap.Green}`}>
                    {totals.green}-({totals.greenEvents})i
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>

          {/* Top Row: Pie + Inactive PID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
            <Card className="shadow-lg rounded-2xl">
              <AntTitle level={5}>Sales</AntTitle>
              <Pie data={pieData} />
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
                  pageSize: 10, // number of rows per page
                  showSizeChanger: true, // allow user to change page size
                  pageSizeOptions: ["10", "20", "50", "100"],
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
            columns={[
              { title: "PUB AM", dataIndex: "pubam", key: "pubam" },
              { title: "PUBID", dataIndex: "pubid", key: "pubid" },
              { title: "PID", dataIndex: "pid", key: "pid" },
              { title: "Events", dataIndex: "noe", key: "noe" },
            ]}
            dataSource={modalData.rows}
            rowKey={(record, idx) => idx}
            pagination={{
              pageSize: 10, // number of rows per page
              showSizeChanger: true, // allow user to change page size
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
        width={700}>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {editValues.map((cond, idx) => (
            <Card
              key={idx}
              size="small"
              className="mb-4 border rounded-md bg-gray-50"
              title={cond.zone_color}>
              {[
                "fraud_min",
                "fraud_max",
                "cti_min",
                "cti_max",
                "ite_min",
                "ite_max",
                "etc_min",
                "etc_max",
              ].map((field) => (
                <div key={field} className="mb-2">
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {field.replace("_", " ")}
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
                </div>
              ))}
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}
