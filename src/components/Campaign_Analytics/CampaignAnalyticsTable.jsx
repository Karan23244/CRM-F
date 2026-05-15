// // CampaignAnalyticsTable.jsx
// import React, { useEffect, useState } from "react";
// import { Table, Input, Select, Spin } from "antd";
// import axios from "axios";
// import DecisionTable from "./DecisionTable";
// const { Option } = Select;

// const colorMap = {
//   green: "#d9f7be",
//   red: "#ffa39e",
//   orange: "#ffd591",
//   yellow: "#fff566",
//   blue: "#e6f7ff",

//   // NEW PID COLORS
//   gold: "#ffd700",
//   black: "#262626",
//   grey: "#d3adf7",
// };

// const CampaignAnalyticsTable = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [filters, setFilters] = useState({
//     pubam: "",
//     pubid: "",
//     pid: "",
//   });

//   // ================= FETCH DATA =================
//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.post(
//         `http://localhost:2001/api/campaign_analytics`,
//         {
//           campaign_name: "moneyview",
//           os: "android",
//           start_date: "2026-04-01",
//           end_date: "2026-04-30",
//           windows: { primary: 7, secondary: 3 },
//         },
//       );
//       console.log("API Response:", res);
//       setData(res.data.data);
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // ================= FILTER =================
//   const filteredData = data?.filter((row) => {
//     return (
//       row.pubam?.toLowerCase().includes(filters.pubam.toLowerCase()) &&
//       row.pubid?.toString().includes(filters.pubid) &&
//       row.pid?.toLowerCase().includes(filters.pid.toLowerCase())
//     );
//   });

//   // ================= COMMON CELL =================
//   const renderCell = (value, colorKey) => {
//     return {
//       children: value,
//       props: {
//         style: {
//           background: colorMap[colorKey] || "transparent",
//           textAlign: "center",
//         },
//       },
//     };
//   };

//   // ================= KPI COLUMN BUILDER =================
//   const buildKPI = (title, key) => ({
//     title,
//     children: [
//       {
//         title: "MTD",
//         dataIndex: `${key}_mtd`,
//         sorter: (a, b) => a[`${key}_mtd`] - b[`${key}_mtd`],
//         render: (_, row) =>
//           renderCell(row[`${key}_mtd`], row[`${key}_mtd_color`]),
//       },
//       {
//         title: "7D",
//         dataIndex: `${key}_7d`,
//         sorter: (a, b) => a[`${key}_7d`] - b[`${key}_7d`],
//         render: (_, row) =>
//           renderCell(row[`${key}_7d`], row[`${key}_7d_color`]),
//       },
//       {
//         title: "3D",
//         dataIndex: `${key}_3d`,
//         sorter: (a, b) => a[`${key}_3d`] - b[`${key}_3d`],
//         render: (_, row) =>
//           renderCell(row[`${key}_3d`], row[`${key}_3d_color`]),
//       },
//     ],
//   });

//   // ================= COLUMNS =================
//   const columns = [
//     {
//       title: "POC (PubAM)",
//       dataIndex: "pubam",
//       fixed: "left",
//       width: 150,
//     },
//     {
//       title: "PubID",
//       dataIndex: "pubid",
//       fixed: "left",
//       width: 120,
//     },
//     {
//       title: "PID",
//       dataIndex: "pid",
//       fixed: "left",
//       width: 200,
//       render: (text, row) => ({
//         children: text,
//         props: {
//           style: {
//             background: colorMap[row.pid_color],
//             fontWeight: "bold",
//           },
//         },
//       }),
//     },

//     // ===== KPIs =====
//     buildKPI("Clicks", "clicks"),
//     buildKPI("Installs", "installs"),
//     buildKPI("C2I", "c2i"),
//     buildKPI("RT Install", "rt_install"),
//     buildKPI("PA Install", "pa_install"),
//     buildKPI("Install Fraud", "install_fraud"),
//     buildKPI("E1", "E1_count"),
//     buildKPI("CR E1", "cr_E1"),
//     buildKPI("E2", "E2_count"),
//     buildKPI("CR E2", "cr_E2"),
//     buildKPI("PA E2", "pa_E2"),
//   ];

//   return (
//     <>
//     <div style={{ padding: 20 }}>
//       <h2>Campaign Analytics</h2>

//       {/* ================= FILTER UI ================= */}
//       <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
//         <Input
//           placeholder="Filter PubAM"
//           onChange={(e) => setFilters({ ...filters, pubam: e.target.value })}
//         />
//         <Input
//           placeholder="Filter PubID"
//           onChange={(e) => setFilters({ ...filters, pubid: e.target.value })}
//         />
//         <Input
//           placeholder="Filter PID"
//           onChange={(e) => setFilters({ ...filters, pid: e.target.value })}
//         />
//       </div>

//       {/* ================= TABLE ================= */}
//       {loading ? (
//         <Spin />
//       ) : (
//         <Table
//           columns={columns}
//           dataSource={filteredData}
//           rowKey={(row) => row.pid + row.pubid}
//           scroll={{ x: "max-content" }}
//           bordered
//         />
//       )}
//     </div>
//     <DecisionTable />
//     </>
//   );
// };

// export default CampaignAnalyticsTable;

// CampaignAnalyticsTable.jsx

import React, { useEffect, useMemo, useState, startTransition } from "react";
import {
  Table,
  Input,
  Select,
  Spin,
  DatePicker,
  Row,
  Col,
  Typography,
  Checkbox,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import DecisionTable from "./DecisionTable";
import { sortDropdownValues } from "../../Utils/sortDropdownValues";
import UploadForm from "./UploadForm";
import { useSelector } from "react-redux";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

// ================= COLORS =================
const colorMap = {
  green: "#52c41a",
  red: "#ff4d4f",
  orange: "#fa8c16",
  yellow: "#fadb14",
  blue: "#1677ff",

  // PID COLORS
  gold: "#ffd700",
  black: "#262626",
  grey: "#bfbfbf",
  purple: "#d3adf7",
};

// ================= TEXT COLOR =================
const getTextColor = (bg) => {
  if (!bg) return "#ffffff";

  const darkColors = ["black", "blue", "red"];

  return darkColors.includes(bg) ? "#ffffff" : "#000000";
};
const API = import.meta.env.VITE_API_URL2;
const apiUrl = import.meta.env.VITE_API_URL;

const CampaignAnalyticsTable = () => {
  const user = useSelector((state) => state.auth.user);
  console.log("User Permissions:", user);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= DROPDOWN DATA =================
  const [campaigns, setCampaigns] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  // ================= PAYLOAD =================
  const [payload, setPayload] = useState({
    campaign_name: "",
    os: "android",
    start_date: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    end_date: dayjs().format("YYYY-MM-DD"),
    windows: {
      primary: 7,
      secondary: 3,
    },
  });
  // ================= USER ACCESS =================
  const allowedRoles = [
    "publisher_manager",
    "publisher",
    "pub_executive",
    "optimization",
    "operations",
  ];

  const hasAccess = user?.role?.some((r) => allowedRoles.includes(r));

  // ================= FETCH SUBADMINS =================
  const [subadmins, setSubadmins] = useState([]);

  const fetchSubadmins = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-subadmin`);

      setSubadmins(res.data?.data || []);
    } catch (err) {
      console.error("Subadmin fetch error", err);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchSubadmins();
    }
  }, [hasAccess]);

  // ================= FETCH CAMPAIGNS =================
  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${API}/api/campaign_analytics/campaigns`);

      const uniqueCampaigns = [...new Set(res.data.data || [])];

      setCampaigns(uniqueCampaigns);

      // auto select first campaign
      if (uniqueCampaigns.length > 0) {
        setPayload((prev) => ({
          ...prev,
          campaign_name: uniqueCampaigns[0],
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FETCH DATA =================
  const fetchData = async () => {
    if (!payload.campaign_name) return;

    setLoading(true);
    console.log(payload);
    try {
      const res = await axios.post(`${API}/api/campaign_analytics`, payload);
      console.log("API Response:", res);
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ================= AUTO FETCH =================
  useEffect(() => {
    fetchData();
  }, [payload]);

  //filter handler for dropdowns with "select all" logic
  const handleFilterChange = (values, key) => {
    startTransition(() => {
      setFilters((prev) => {
        const allValues = uniqueValues[key] || [];

        if (values.length === allValues.length) {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        }

        return { ...prev, [key]: values };
      });
    });
  };
  const roleFilteredData = useMemo(() => {
    const normalize = (val) =>
      val === null || val === undefined || val === ""
        ? "-"
        : val.toString().trim().toLowerCase();

    if (!hasAccess) return [];

    const username = normalize(user?.username);

    const assignedIds = user?.assigned_subadmins || [];

    // assigned subadmin usernames
    const assignedNames = subadmins
      .filter((s) => assignedIds.includes(s.id))
      .map((s) => normalize(s.username));
    return data.filter((item) => {
      const pubam = normalize(item.pubam);

      // operations & optimization can see all data
      if (
        user?.role?.includes("operations") ||
        user?.role?.includes("optimization")
      ) {
        return true;
      }

      // own data
      if (pubam === username) return true;

      // assigned subadmin data
      if (assignedNames.includes(pubam)) return true;

      // publisher_manager extra access
      if (
        user?.role?.includes("publisher_manager") &&
        (pubam === "n/a" || pubam === "-")
      ) {
        return true;
      }

      return false;
    });
  }, [data, user, subadmins, hasAccess]);
  const filteredData = useMemo(() => {
    const normalize = (val) =>
      val === null || val === undefined || val === ""
        ? "-"
        : val.toString().trim().toLowerCase();

    return roleFilteredData.filter((item) => {
      return Object.keys(filters).every((key) => {
        const selected = filters[key];

        if (!selected || selected.length === 0) return true;

        const itemVal = normalize(item[key]);

        return selected.some((val) => normalize(val) === itemVal);
      });
    });
  }, [roleFilteredData, filters]);
  const getFilterDropdown = (key, props) => {
    const { confirm } = props;
    const allValues = uniqueValues[key] || [];
    const selectedValues = filters[key] ?? allValues;
    const searchText = filterSearch[key] || "";

    const visibleValues = sortDropdownValues(
      allValues.filter((val) =>
        val.toString().toLowerCase().includes(searchText.toLowerCase()),
      ),
    );

    const isAllSelected = selectedValues.length === allValues.length;
    const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

    return (
      <div
        className="w-[240px] rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}>
        <div className="p-3 border-b">
          <Input
            autoFocus
            allowClear
            placeholder="Search values"
            value={searchText}
            onChange={(e) =>
              setFilterSearch((prev) => ({
                ...prev,
                [key]: e.target.value,
              }))
            }
          />
        </div>
        {/* ☑ Select All */}
        <div className="px-3 py-2">
          <Checkbox
            indeterminate={isIndeterminate}
            checked={isAllSelected}
            onChange={(e) =>
              handleFilterChange(e.target.checked ? allValues : [], key)
            }>
            <span className="font-medium text-base text-gray-700">
              Select All
            </span>
          </Checkbox>
        </div>
        <div className="max-h-[220px] overflow-y-auto p-2 space-y-1">
          {visibleValues.map((val) => (
            <label
              key={val}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-blue-50">
              <Checkbox
                key={val}
                checked={selectedValues.includes(val)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selectedValues, val]
                    : selectedValues.filter((v) => v !== val);

                  handleFilterChange(next, key);
                  confirm({ closeDropdown: false });
                }}>
                {val}
              </Checkbox>
            </label>
          ))}

          {visibleValues.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No matching values
            </div>
          )}
        </div>
      </div>
    );
  };
  const setColumnUniqueValues = (key) => {
    const values = sortDropdownValues(
      Array.from(
        new Set(
          roleFilteredData.map((row) => {
            const v = row[key];
            return v === null || v === undefined || v === ""
              ? "-"
              : v.toString().trim();
          }),
        ),
      ),
    );

    setUniqueValues((prev) => ({ ...prev, [key]: values }));
  };
  // ================= KPI CELL =================
  // ONLY TEXT COLOR
  const renderCell = (value, colorKey) => {
    const color = colorMap[colorKey] || "#000";

    // check if value contains percentage
    const isPercentageString =
      typeof value === "string" && value.includes("(") && value.includes("%");

    if (isPercentageString) {
      const match = value.match(/^(.+?)\s*\((.+?)\)$/);

      if (match) {
        const numberPart = match[1];
        const percentPart = match[2];

        return {
          children: (
            <span>
              <span style={{ color: "#000", fontWeight: 600 }}>
                {numberPart}
              </span>{" "}
              <span style={{ color, fontWeight: 600 }}>({percentPart})</span>
            </span>
          ),
          props: {
            style: {
              textAlign: "center",
              background: "transparent",
            },
          },
        };
      }
    }

    return {
      children: value,
      props: {
        style: {
          color,
          textAlign: "center",
          fontWeight: 600,
          background: "transparent",
        },
      },
    };
  };

  // ================= KPI BUILDER =================
  // ================= KPI BUILDER =================
  // DYNAMIC WINDOW KEYS + DYNAMIC COLUMN TITLES
  const KPI_COL_WIDTH = 110;
  const buildKPI = (title, key) => {
    const primaryWindow = payload.windows.primary;
    const secondaryWindow = payload.windows.secondary;

    return {
      title,
      children: [
        {
          title: "MTD",
          dataIndex: `${key}_mtd`,
          width: KPI_COL_WIDTH,
          sorter: (a, b) => {
            const valA = a[`${key}_mtd`] || 0;
            const valB = b[`${key}_mtd`] || 0;
            return valA - valB;
          },
          render: (_, row) =>
            renderCell(row[`${key}_mtd`], row[`${key}_mtd_color`]),
        },
        {
          title: `${primaryWindow}D`,
          dataIndex: `${key}_${primaryWindow}d`,
          width: KPI_COL_WIDTH,
          sorter: (a, b) => {
            const valA = a[`${key}_mtd`] || 0;
            const valB = b[`${key}_mtd`] || 0;
            return valA - valB;
          },
          render: (_, row) =>
            renderCell(
              row[`${key}_${primaryWindow}d`],
              row[`${key}_${primaryWindow}d_color`],
            ),
        },
        {
          title: `${secondaryWindow}D`,
          dataIndex: `${key}_${secondaryWindow}d`,
          width: KPI_COL_WIDTH,
          sorter: (a, b) => {
            const valA = a[`${key}_mtd`] || 0;
            const valB = b[`${key}_mtd`] || 0;
            return valA - valB;
          },
          // ⭐ IMPORTANT: add class here
          className: "group-divider",

          render: (_, row) =>
            renderCell(
              row[`${key}_${secondaryWindow}d`],
              row[`${key}_${secondaryWindow}d_color`],
            ),
        },
      ],
    };
  };
  const dayOptions = useMemo(() => {
    const start = dayjs(payload.start_date);
    const end = dayjs(payload.end_date);

    const diff = end.diff(start, "day") + 1;

    return Array.from({ length: diff }, (_, i) => i + 1);
  }, [payload.start_date, payload.end_date]);
  // ================= COLUMNS =================
  const columns = [
    {
      title: "POC (PubAM)",
      dataIndex: "pubam",
      fixed: "left",
      width: 150,
      filterDropdown: (props) => getFilterDropdown("pubam", props),
      onFilterDropdownOpenChange: (open) => {
        if (open) setColumnUniqueValues("pubam");
      },
    },
    {
      title: "PubID",
      dataIndex: "pubid",
      fixed: "left",
      width: 120,
      filterDropdown: (props) => getFilterDropdown("pubid", props),
      onFilterDropdownOpenChange: (open) => {
        if (open) setColumnUniqueValues("pubid");
      },
    },
    {
      title: "PID",
      dataIndex: "pid",
      fixed: "left",
      width: 220,
      filterDropdown: (props) => getFilterDropdown("pid", props),
      onFilterDropdownOpenChange: (open) => {
        if (open) setColumnUniqueValues("pid");
      },

      onCell: () => ({
        className: "pid-cell",
      }),

      render: (text, row) => ({
        children: text,
        props: {
          style: {
            background: colorMap[row.pid_color] || "transparent",
            color: getTextColor(row.pid_color),
            fontWeight: "bold",
            textAlign: "center",
          },
        },
      }),
    },

    // ================= KPI =================
    buildKPI("Clicks", "clicks"),
    buildKPI("Installs", "installs"),
    buildKPI("C2I", "c2i"),
    buildKPI("RT Install", "rt_install"),
    buildKPI("PA Install", "pa_install"),
    buildKPI("Install Fraud", "install_fraud"),
    buildKPI("E1", "E1_count"),
    buildKPI("CR E1", "cr_E1"),
    buildKPI("E2", "E2_count"),
    buildKPI("CR E2", "cr_E2"),
    buildKPI("PA E2", "pae_E2"),
  ];

  return (
    <>
      {user?.permissions?.can_see_input1 === 1 && (
        <div>
          <UploadForm onUploadSuccess={fetchData} />
        </div>
      )}
      {hasAccess ? (
        <>
          <div style={{ padding: 20 }}>
            <Title level={3}>Campaign Analytics</Title>

            {/* ================= TOP FILTERS ================= */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              {/* Campaign */}
              <Col xs={24} md={6}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Select Campaign
                </div>
                <Select
                  showSearch
                  allowClear
                  style={{ width: "100%" }}
                  value={payload.campaign_name}
                  placeholder="Select Campaign"
                  // SEARCH FILTER
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option?.children
                      ?.toLowerCase()
                      ?.includes(input.toLowerCase())
                  }
                  onChange={(value) =>
                    setPayload((prev) => ({
                      ...prev,
                      campaign_name: value || "",
                    }))
                  }>
                  {campaigns.map((campaign) => (
                    <Option key={campaign} value={campaign}>
                      {campaign}
                    </Option>
                  ))}
                </Select>
              </Col>

              {/* OS */}
              <Col xs={24} md={4}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Select OS</div>
                <Select
                  style={{ width: "100%" }}
                  value={payload.os}
                  onChange={(value) =>
                    setPayload((prev) => ({
                      ...prev,
                      os: value,
                    }))
                  }>
                  <Option value="android">Android</Option>
                  <Option value="ios">iOS</Option>
                </Select>
              </Col>

              {/* Date Range */}
              <Col xs={24} md={8}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Select Date Range
                </div>
                <RangePicker
                  style={{ width: "100%" }}
                  value={[dayjs(payload.start_date), dayjs(payload.end_date)]}
                  onChange={(dates) => {
                    if (!dates) return;

                    setPayload((prev) => ({
                      ...prev,
                      start_date: dates[0].format("YYYY-MM-DD"),
                      end_date: dates[1].format("YYYY-MM-DD"),
                    }));
                  }}
                />
              </Col>

              {/* Primary Window */}
              <Col xs={12} md={3}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Primary Window
                </div>
                <Select
                  style={{ width: "100%" }}
                  value={payload.windows.primary}
                  onChange={(value) =>
                    setPayload((prev) => ({
                      ...prev,
                      windows: {
                        ...prev.windows,
                        primary: value,
                      },
                    }))
                  }>
                  {dayOptions.map((day) => (
                    <Option key={day} value={day}>
                      {day}
                    </Option>
                  ))}
                </Select>
              </Col>

              {/* Secondary Window */}
              <Col xs={12} md={3}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Secondary Window
                </div>
                <Select
                  style={{ width: "100%" }}
                  value={payload.windows.secondary}
                  onChange={(value) =>
                    setPayload((prev) => ({
                      ...prev,
                      windows: {
                        ...prev.windows,
                        secondary: value,
                      },
                    }))
                  }>
                  {dayOptions.map((day) => (
                    <Option key={day} value={day}>
                      {day}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>

            {/* ================= TABLE ================= */}
            {loading ? (
              <Spin />
            ) : (
              <Table
                tableLayout="fixed"
                className="custom-table"
                columns={columns}
                dataSource={filteredData}
                rowKey={(row) => `${row.pid}_${row.pubid}`}
                scroll={{ x: "max-content", y: "70vh" }}
                bordered
                sticky
                pagination={{
                  pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
                  showSizeChanger: true,
                  defaultPageSize: 10,
                }}
                summary={(pageData) => {
                  // helper for normal numbers
                  const sumNumber = (key) =>
                    pageData.reduce((acc, row) => {
                      return acc + (Number(row[key]) || 0);
                    }, 0);

                  // helper for values like "12 (5%)"
                  const sumStringNumber = (key) =>
                    pageData.reduce((acc, row) => {
                      const raw = row[key];

                      if (!raw) return acc;

                      const num = parseFloat(raw.toString().split(" ")[0]);

                      return acc + (num || 0);
                    }, 0);

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row
                        style={{
                          background: "#f8fafc",
                          fontWeight: 700,
                        }}>
                        {/* FIXED COLUMNS */}
                        {/* FIXED COLUMNS */}
                        <Table.Summary.Cell
                          index={0}
                          style={{ width: 150, minWidth: 150 }}>
                          TOTAL
                        </Table.Summary.Cell>

                        <Table.Summary.Cell
                          index={1}
                          style={{ width: 120, minWidth: 120 }}
                        />

                        <Table.Summary.Cell
                          index={2}
                          style={{ width: 220, minWidth: 220 }}
                        />

                        {/* CLICKS */}
                        <Table.Summary.Cell index={3}>
                          {sumNumber("clicks_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                          {sumNumber(`clicks_${payload.windows.primary}d`)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                          {sumNumber(`clicks_${payload.windows.secondary}d`)}
                        </Table.Summary.Cell>

                        {/* INSTALLS */}
                        <Table.Summary.Cell index={6}>
                          {sumNumber("installs_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7}>
                          {sumNumber(`installs_${payload.windows.primary}d`)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8}>
                          {sumNumber(`installs_${payload.windows.secondary}d`)}
                        </Table.Summary.Cell>

                        {/* C2I */}
                        <Table.Summary.Cell index={9} />
                        <Table.Summary.Cell index={10} />
                        <Table.Summary.Cell index={11} />

                        {/* RT INSTALL */}
                        <Table.Summary.Cell index={12}>
                          {sumStringNumber("rt_install_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={13}>
                          {sumStringNumber(
                            `rt_install_${payload.windows.primary}d`,
                          )}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={14}>
                          {sumStringNumber(
                            `rt_install_${payload.windows.secondary}d`,
                          )}
                        </Table.Summary.Cell>

                        {/* PA INSTALL */}
                        <Table.Summary.Cell index={15}>
                          {sumStringNumber("pa_install_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={16}>
                          {sumStringNumber(
                            `pa_install_${payload.windows.primary}d`,
                          )}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={17}>
                          {sumStringNumber(
                            `pa_install_${payload.windows.secondary}d`,
                          )}
                        </Table.Summary.Cell>

                        {/* INSTALL FRAUD */}
                        <Table.Summary.Cell index={18}>
                          {sumStringNumber("install_fraud_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={19}>
                          {sumStringNumber(
                            `install_fraud_${payload.windows.primary}d`,
                          )}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={20}>
                          {sumStringNumber(
                            `install_fraud_${payload.windows.secondary}d`,
                          )}
                        </Table.Summary.Cell>

                        {/* E1 */}
                        <Table.Summary.Cell index={21}>
                          {sumNumber("E1_count_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={22}>
                          {sumNumber(`E1_count_${payload.windows.primary}d`)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={23}>
                          {sumNumber(`E1_count_${payload.windows.secondary}d`)}
                        </Table.Summary.Cell>

                        {/* CR E1 */}
                        <Table.Summary.Cell index={24} />
                        <Table.Summary.Cell index={25} />
                        <Table.Summary.Cell index={26} />

                        {/* E2 */}
                        <Table.Summary.Cell index={27}>
                          {sumNumber("E2_count_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={28}>
                          {sumNumber(`E2_count_${payload.windows.primary}d`)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={29}>
                          {sumNumber(`E2_count_${payload.windows.secondary}d`)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            )}
            <style jsx>{`
              /* SUMMARY FIX */
              .custom-table .ant-table-summary {
                position: relative;
                z-index: 2;
              }

              .custom-table .ant-table-summary > table {
                table-layout: fixed !important;
                width: max-content !important;
                min-width: 100% !important;
              }

              /* MATCH BODY CELL STYLE */
              .custom-table .ant-table-summary td {
                text-align: center !important;
                white-space: nowrap;
                border-right: 1px solid #e6edf5 !important;
                border-bottom: 1px solid #d9e1ec !important;
                font-weight: 700;
                background: #f8fafc !important;
              }

              /* FIX FIXED COLUMN WIDTHS */
              .custom-table .ant-table-summary td:nth-child(1) {
                min-width: 150px !important;
                width: 150px !important;
              }

              .custom-table .ant-table-summary td:nth-child(2) {
                min-width: 120px !important;
                width: 120px !important;
              }

              .custom-table .ant-table-summary td:nth-child(3) {
                min-width: 220px !important;
                width: 220px !important;
              }
              /* ROW HOVER */
              .custom-table .ant-table-tbody > tr.ant-table-row:hover > td {
                background: #fafafa !important;
                color: black !important;
              }
            `}</style>
          </div>

          <DecisionTable
            campaign_name={payload.campaign_name}
            os={payload.os}
            lastdate={payload.end_date}
          />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default CampaignAnalyticsTable;
