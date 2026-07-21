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
  Button,
  Popconfirm,
  message,
  Card,
} from "antd";
import Swal from "sweetalert2";
import { FileExcelOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import DecisionTable from "./DecisionTable";
import { sortDropdownValues } from "../../Utils/sortDropdownValues";
import UploadForm from "./UploadForm";
import { useSelector } from "react-redux";
import { exportToExcel } from "./exportColorExcel";
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

// ================= COLORS =================
const colorMap = {
  green: "#52c41a",
  red: "#ff4d4f",
  orange: "#fa8c16",
  yellow: "#fadb14",
  blue: "#fadb14",

  // PID COLORS
  gold: "#52c41a",
  black: "#ff4d4f",
  grey: "#bfbfbf",
  purple: "#fa8c16",
  violet: "rgb(243 198 222)",
};

// ================= TEXT COLOR =================
const getTextColor = (bg) => {
  if (!bg) return "#ffffff";
};
const getSortableValue = (value) => {
  if (value === null || value === undefined) return 0;

  if (typeof value === "string") {
    return parseFloat(value.split(" ")[0]) || 0;
  }

  return Number(value) || 0;
};
const API = import.meta.env.VITE_API_URL2;
const apiUrl = import.meta.env.VITE_API_URL;

const CampaignAnalyticsTable = () => {
  const user = useSelector((state) => state.auth.user);
  const canDeleteCampaignData =
    user?.role?.includes("optimization") ||
    user?.role?.includes("admin") ||
    user?.username?.toLowerCase() === "akshat";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allowedCampaignIds, setAllowedCampaignIds] = useState([]);

  // ================= DROPDOWN DATA =================
  const [campaigns, setCampaigns] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  // ================= PAYLOAD =================
  // ================= PAYLOAD =================
  const [payload, setPayload] = useState({
    config_id: null,
    campaign_name: "",
    campaign_ids: [],
    os: "",
    geo: [],

    start_date: dayjs().startOf("month").format("YYYY-MM-DD"),
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
    "advertiser",
    "advertiser_manager",
    "adv_executive",
    "admin",
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
  // const fetchCampaigns = async () => {
  //   try {
  //     const res = await axios.get(`${API}/api/campaign_analytics/campaigns`);

  //     const uniqueCampaigns = [...new Set(res.data.data || [])];

  //     setCampaigns(uniqueCampaigns);

  //     // auto select first campaign
  //     if (uniqueCampaigns.length > 0) {
  //       setPayload((prev) => ({
  //         ...prev,
  //         campaign_name: uniqueCampaigns[0],
  //       }));
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };
  const fetchMappings = async () => {
    try {
      const res = await axios.get(`${apiUrl}/campaign-publisher-map`, {
        params: {
          userid: user.id,
          role: Array.isArray(user.role) ? user.role[0] : user.role,
        },
      });
      console.log("Mappings API Response:", res.data);
      const ids = (res.data.data || []).map((item) => Number(item.campaign_id));

      setAllowedCampaignIds(ids);

      console.log("Allowed Campaign IDs:", ids);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (
      user?.role?.includes("publisher") ||
      user?.role?.includes("pub_executive")
    ) {
      fetchMappings();
    }
  }, [user]);
  const fetchCampaigns = async () => {
    try {
      const restrictedRoles = [
        "advertiser",
        "advertiser_manager",
        "adv_executive",
      ];

      let requestPayload = {};

      if (user?.role?.some((role) => restrictedRoles.includes(role))) {
        requestPayload = {
          user_id: user?.id,
          role: user?.role,
          assign_subadmins: user?.assigned_subadmins || [],
        };
      }

      const res = await axios.post(
        `${API}/api/campaign_analytics/campaigns`,
        requestPayload,
      );

      console.log("Campaign API Response:", res.data);

      setCampaigns(res.data.data || []);

      // ❌ REMOVE AUTO SELECT
    } catch (err) {
      console.error(err);
    }
  };
  // ================= FETCH DATA =================
  const fetchData = async () => {
    if (!payload.campaign_name) {
      setData([]);
      return;
    }

    // Clear old table immediately
    setData([]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/campaign_analytics`, payload);

      setData(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setData([]); // ensure no stale data
    } finally {
      setLoading(false);
    }
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
    // return data.filter((item) => {
    //   const pubam = normalize(item.pubam);

    //   // operations & optimization can see all data
    //   if (
    //     user?.role?.includes("operations") ||
    //     user?.role?.includes("optimization") ||
    //     user?.role?.includes("advertiser") ||
    //     user?.role?.includes("advertiser_manager") ||
    //     user?.role?.includes("adv_executive") ||
    //     user?.role?.includes("admin")
    //   ) {
    //     return true;
    //   }

    //   // own data
    //   if (pubam === username) return true;

    //   // assigned subadmin data
    //   if (assignedNames.includes(pubam)) return true;

    //   // publisher_manager extra access
    //   // Hide N/A records for publisher roles
    //   if (
    //     user?.role?.includes("publisher_manager") ||
    //     user?.role?.includes("publisher") ||
    //     user?.role?.includes("pub_executive")
    //   ) {
    //     if (pubam === "n/a" || pubam === "-") {
    //       return false;
    //     }
    //   }

    //   return false;
    // });
    return data.filter((item) => {
      const pubam = normalize(item.pubam);

      // Full access roles
      if (
        user?.role?.includes("operations") ||
        user?.role?.includes("optimization") ||
        user?.role?.includes("advertiser") ||
        user?.role?.includes("advertiser_manager") ||
        user?.role?.includes("adv_executive") ||
        user?.role?.includes("admin")
      ) {
        return true;
      }

      // Publisher / Pub Executive
      if (
        user?.role?.includes("publisher") ||
        user?.role?.includes("pub_executive")
      ) {
        // Don't show N/A publisher records
        if (pubam === "n/a" || pubam === "-") {
          return false;
        }

        // 1. Allow if campaign mapping matches
        if (allowedCampaignIds.includes(Number(item.campaign_id))) {
          return true;
        }

        // 2. If campaign mapping doesn't match, fall back to username
        if (pubam === username) {
          return true;
        }

        // 3. Or assigned subadmin
        if (assignedNames.includes(pubam)) {
          return true;
        }

        // Otherwise deny
        return false;
      }

      // Publisher Manager (existing logic)
      if (user?.role?.includes("publisher_manager")) {
        if (pubam === username) return true;

        if (assignedNames.includes(pubam)) return true;

        if (pubam === "n/a" || pubam === "-") return false;

        return false;
      }

      return false;
    });
  }, [data, user, subadmins, hasAccess]);
  const pidSummary = useMemo(() => {
    const uniquePids = new Set();
    const activePids = new Set();
    const pausedPids = new Set();
    const naPids = new Set();

    const isNA = (v) => {
      const val = (v || "").toString().trim().toUpperCase();
      return !val || val === "N/A" || val === "NA" || val === "-";
    };

    roleFilteredData.forEach((row) => {
      // unique PID key
      const key = `${row.pubam}_${row.pubid}_${row.pid}`;

      uniquePids.add(key);

      // N/A publisher
      if (isNA(row.pubam) && isNA(row.pubid)) {
        naPids.add(key);
      }

      // pid color classification
      // green = active
      // red = paused
      // CRM status
      if (Number(row.is_paused) === 1) {
        pausedPids.add(key);
      } else {
        activePids.add(key);
      }
    });

    return {
      total: uniquePids.size,
      active: activePids.size,
      paused: pausedPids.size,
      na: naPids.size,
    };
  }, [roleFilteredData]);
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
  const KPI_COL_WIDTH = 150;
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
          sorter: (a, b) =>
            getSortableValue(a[`${key}_mtd`]) -
            getSortableValue(b[`${key}_mtd`]),
          render: (_, row) =>
            renderCell(row[`${key}_mtd`], row[`${key}_mtd_color`]),
        },
        {
          title: `${primaryWindow}D`,
          dataIndex: `${key}_${primaryWindow}d`,
          width: KPI_COL_WIDTH,
          sorter: (a, b) =>
            getSortableValue(a[`${key}_${primaryWindow}d`]) -
            getSortableValue(b[`${key}_${primaryWindow}d`]),
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
          sorter: (a, b) =>
            getSortableValue(a[`${key}_${secondaryWindow}d`]) -
            getSortableValue(b[`${key}_${secondaryWindow}d`]),
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
  const selectedCampaign = campaigns.find(
    (c) => c.config_id === payload.config_id,
  );

  const availableDates = selectedCampaign?.available_dates || [];
  const dayOptions = useMemo(() => {
    const start = dayjs(payload.start_date);
    const end = dayjs(payload.end_date);

    const diff = end.diff(start, "day") + 1;

    return Array.from({ length: diff }, (_, i) => i + 1);
  }, [payload.start_date, payload.end_date]);
  // ================= DYNAMIC EVENTS =================
  const dynamicEventColumns = useMemo(() => {
    if (!data.length) return [];

    const sampleRow = data[0];

    // find E1_count, E2_count, E3_count etc
    const eventNumbers = Array.from(
      new Set(
        Object.keys(sampleRow)
          .filter((key) => /^E\d+_count_mtd$/.test(key))
          .map((key) => key.match(/^E(\d+)_count_mtd$/)?.[1]),
      ),
    ).sort((a, b) => Number(a) - Number(b));

    const cols = [];

    eventNumbers.forEach((num) => {
      // EVENT COUNT
      cols.push(buildKPI(`E${num}`, `E${num}_count`));

      // CR EVENT

      if (sampleRow[`cr_E${num}_mtd`] !== undefined) {
        cols.push(buildKPI(`CR E${num}`, `cr_E${num}`));
      }
      // PAE EVENT ONLY
      // PAE EVENT (skip E1)
      if (Number(num) !== 1 && sampleRow[`pae_E${num}_mtd`] !== undefined) {
        cols.push(buildKPI(`PA E${num}`, `pae_E${num}`));
      }
    });

    return cols;
  }, [data, payload.windows]);
  const handleDeleteCampaignData = async () => {
    const result = await Swal.fire({
      title: "Delete Campaign Data?",
      html: `
      <b>${payload.campaign_name}</b><br/>
      OS: ${payload.os}<br/>
      This action cannot be undone.
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${API}/api/campaign_analytics/delete-campaign-data`,
        {
          data: {
            campaign_name: payload.campaign_name,
            campaign_ids: payload.campaign_ids,
            os: payload.os,
            geo: payload.geo,

            // ADD THESE
            start_date: payload.start_date,
            end_date: payload.end_date,
          },
        },
      );

      await Swal.fire({
        icon: "success",
        title: "Deleted Successfully",
        html: `
  <b>${payload.campaign_name}</b><br/>
  OS: ${payload.os}<br/>
  Date Range: ${payload.start_date} → ${payload.end_date}<br/><br/>
  This action cannot be undone.
`,
      });

      setData([]);
      fetchCampaigns();
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          error?.response?.data?.message ||
          "Something went wrong while deleting data",
      });
    }
  };
  const handleFilterDropdownOpenChange = (key, open) => {
    if (open) {
      setColumnUniqueValues(key);
    } else {
      setFilterSearch((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };
  // ================= COLUMNS =================
  const columns = [
    {
      title: "POC (PubAM)",
      dataIndex: "pubam",
      fixed: "left",
      width: 150,
      filterDropdown: (props) => getFilterDropdown("pubam", props),
      onFilterDropdownOpenChange: (open) =>
        handleFilterDropdownOpenChange("pubam", open),
    },
    {
      title: "PubID",
      dataIndex: "pubid",
      fixed: "left",
      width: 120,
      filterDropdown: (props) => getFilterDropdown("pubid", props),
      onFilterDropdownOpenChange: (open) =>
        handleFilterDropdownOpenChange("pubid", open),
    },
    {
      title: "PID",
      dataIndex: "pid",
      fixed: "left",
      width: 220,
      filterDropdown: (props) => getFilterDropdown("pid", props),
      onFilterDropdownOpenChange: (open) =>
        handleFilterDropdownOpenChange("pid", open),
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
    {
      title: "Impressions",
      dataIndex: "impressions",
      width: 150,

      sorter: (a, b) =>
        getSortableValue(a.impressions) - getSortableValue(b.impressions),

      filterDropdown: (props) => getFilterDropdown("impressions", props),
      onFilterDropdownOpenChange: (open) =>
        handleFilterDropdownOpenChange("impressions", open),

      render: (text) => (
        <span className="font-bold text-gray-800">{text ?? 0}</span>
      ),
    },
    // ================= KPI =================
    // ================= KPI =================
    buildKPI("Clicks", "clicks"),
    buildKPI("Installs", "installs"),
    buildKPI("C2I", "c2i"),
    buildKPI("RT Install", "rt_install"),
    buildKPI("PA Install", "pa_install"),
    buildKPI("Install Fraud", "install_fraud"),

    ...dynamicEventColumns,
  ];
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      return (b.clicks_mtd || 0) - (a.clicks_mtd || 0);
    });
  }, [filteredData]);
  console.log("Sorted Data:", sortedData);
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
              <Col xs={24} md={4}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Select Campaign
                </div>

                <Select
                  showSearch
                  allowClear
                  style={{ width: "100%" }}
                  dropdownStyle={{
                    minWidth: 300,
                  }}
                  placeholder="Select Campaign"
                  optionFilterProp="label"
                  value={payload.config_id}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    const selectedCampaign = campaigns.find(
                      (item) => item.config_id === value,
                    );

                    const availableDates =
                      selectedCampaign?.available_dates || [];
                    setFilters({});
                    setFilterSearch({});
                    setUniqueValues({});
                    if (!selectedCampaign) {
                      setPayload((prev) => ({
                        ...prev,
                        campaign_name: "",
                        campaign_ids: [],
                        os: "",
                        geo: [],
                      }));
                      return;
                    }
                    const dates = selectedCampaign.available_dates || [];

                    const currentMonthDates = dates.filter((d) =>
                      dayjs(d).isSame(dayjs(), "month"),
                    );

                    const startDate =
                      currentMonthDates.length > 0
                        ? currentMonthDates[0]
                        : dates[0];

                    const endDate =
                      currentMonthDates.length > 0
                        ? currentMonthDates[currentMonthDates.length - 1]
                        : dates[dates.length - 1];

                    setPayload((prev) => ({
                      ...prev,
                      config_id: selectedCampaign.config_id,
                      campaign_name: selectedCampaign.campaign_name,
                      os: selectedCampaign.os,

                      geo: Array.isArray(selectedCampaign.geo)
                        ? [
                            ...new Set(
                              selectedCampaign.geo.flatMap((g) => {
                                try {
                                  return JSON.parse(g);
                                } catch {
                                  return [];
                                }
                              }),
                            ),
                          ]
                        : [],

                      campaign_ids: selectedCampaign.campaign_ids || [],

                      start_date: startDate,
                      end_date: endDate,
                    }));
                  }}>
                  {campaigns.map((campaign) => {
                    const geoParsed = (() => {
                      try {
                        return JSON.parse(campaign.geo || "[]").join(", ");
                      } catch {
                        return campaign.geo || "";
                      }
                    })();

                    return (
                      <Option
                        key={campaign.config_id}
                        value={campaign.config_id}
                        label={`${campaign.campaign_name} (${campaign.os})`}>
                        {campaign.campaign_name} ({campaign.os}) | IDs:{" "}
                        {campaign.campaign_ids?.join(", ")}
                      </Option>
                    );
                  })}
                </Select>
              </Col>

              {/* OS */}
              <Col xs={24} md={4}>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Select OS</div>
                <Select style={{ width: "100%" }} value={payload.os} disabled>
                  <Option value="Android">Android</Option>
                  <Option value="iOS">iOS</Option>
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
                  // disable future dates
                  disabledDate={(current) => {
                    if (!current) return false;

                    return !availableDates.includes(
                      current.format("YYYY-MM-DD"),
                    );
                  }}
                  onChange={(dates) => {
                    if (!dates) return;

                    setPayload((prev) => ({
                      ...prev,
                      start_date: dates[0].format("YYYY-MM-DD"),
                      end_date: dates[1].format("YYYY-MM-DD"),
                    }));
                  }}
                />
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  Available Range:{" "}
                  {availableDates.length
                    ? `${availableDates[0]} → ${
                        availableDates[availableDates.length - 1]
                      }`
                    : "No data"}
                </div>
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
              {/* ================= ACTION BUTTONS ================= */}
              <Row
                justify="end"
                align="middle"
                style={{
                  marginBottom: 16,
                  gap: 12,
                }}>
                {canDeleteCampaignData && (
                  <Button
                    danger
                    disabled={!payload.campaign_name}
                    onClick={handleDeleteCampaignData}>
                    Delete Campaign Data
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={async () => {
                    if (!filteredData.length) {
                      Swal.fire({
                        icon: "warning",
                        title: "No Data",
                        text: "No data available to export",
                      });
                      return;
                    }

                    const exportData = filteredData.map((row) => {
                      const data = {};
                      const styles = {};

                      columns.forEach((col) => {
                        // KPI columns
                        if (col.children) {
                          col.children.forEach((child) => {
                            const header = `${col.title} ${child.title}`;

                            data[header] = row[child.dataIndex] ?? "";

                            const colorKey = row[`${child.dataIndex}_color`];

                            // only change text color for KPI fields
                            if (colorKey && colorMap[colorKey]) {
                              styles[header] = {
                                font: colorMap[colorKey],
                              };
                            }
                          });
                        }

                        // normal columns
                        else {
                          data[col.title] = row[col.dataIndex] ?? "";

                          // PID keep background color
                          if (
                            col.dataIndex === "pid" &&
                            row.pid_color &&
                            colorMap[row.pid_color]
                          ) {
                            styles[col.title] = {
                              fill: colorMap[row.pid_color],
                              font: "#FFFFFF",
                            };
                          }
                        }
                      });

                      return {
                        data,
                        styles,
                      };
                    });

                    await exportToExcel(
                      exportData,
                      `${payload.campaign_name || "campaign"}_${payload.os}.xlsx`,
                    );
                  }}>
                  Download Excel
                </Button>
                <Button
                  onClick={() => {
                    // clear table filters
                    setFilters({});
                    setFilterSearch({});
                  }}>
                  Clear All Filters
                </Button>
              </Row>
            </Row>

            {/* ================= TABLE ================= */}
            {loading ? (
              <Spin />
            ) : (
              <Table
                tableLayout="fixed"
                className="custom-table"
                columns={columns}
                dataSource={sortedData}
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
                  // normal sum
                  const sumNumber = (key) =>
                    pageData.reduce((acc, row) => {
                      return acc + (Number(row[key]) || 0);
                    }, 0);

                  // values like "12 (5%)"
                  const sumStringNumber = (key) =>
                    pageData.reduce((acc, row) => {
                      const raw = row[key];

                      if (!raw) return acc;

                      const num = parseFloat(raw.toString().split(" ")[0]);

                      return acc + (num || 0);
                    }, 0);

                  // percentage formatter
                  const calcPercent = (numerator, denominator) => {
                    if (!denominator || denominator === 0) return "0%";

                    return `${((numerator / denominator) * 100).toFixed(2)}%`;
                  };

                  // render helper
                  const valueWithPercent = (value, percent) => (
                    <span>
                      <span style={{ fontWeight: 700 }}>{value}</span>{" "}
                      <span style={{ color: "#1677ff", fontWeight: 700 }}>
                        ({percent})
                      </span>
                    </span>
                  );

                  // ================= TOTALS =================
                  const totalImpressions = sumNumber("impressions");
                  const totalClicksMTD = sumNumber("clicks_mtd");
                  const totalClicksPrimary = sumNumber(
                    `clicks_${payload.windows.primary}d`,
                  );
                  const totalClicksSecondary = sumNumber(
                    `clicks_${payload.windows.secondary}d`,
                  );

                  const totalInstallsMTD = sumNumber("installs_mtd");
                  const totalInstallsPrimary = sumNumber(
                    `installs_${payload.windows.primary}d`,
                  );
                  const totalInstallsSecondary = sumNumber(
                    `installs_${payload.windows.secondary}d`,
                  );

                  const totalRTMTD = sumStringNumber("rt_install_mtd");
                  const totalRTPrimary = sumStringNumber(
                    `rt_install_${payload.windows.primary}d`,
                  );
                  const totalRTSecondary = sumStringNumber(
                    `rt_install_${payload.windows.secondary}d`,
                  );

                  const totalPAMTD = sumStringNumber("pa_install_mtd");
                  const totalPAPrimary = sumStringNumber(
                    `pa_install_${payload.windows.primary}d`,
                  );
                  const totalPASecondary = sumStringNumber(
                    `pa_install_${payload.windows.secondary}d`,
                  );

                  // ================= DYNAMIC SUMMARY HELPERS =================

                  const getEventNumbers = () => {
                    if (!pageData.length) return [];

                    return Array.from(
                      new Set(
                        Object.keys(pageData[0])
                          .filter((key) => /^E\d+_count_mtd$/.test(key))
                          .map((key) => key.match(/^E(\d+)_count_mtd$/)?.[1]),
                      ),
                    ).sort((a, b) => Number(a) - Number(b));
                  };

                  const eventNumbers = getEventNumbers();

                  const getMetricTotals = (metricKey, isString = false) => {
                    const sumFn = isString ? sumStringNumber : sumNumber;

                    return {
                      mtd: sumFn(`${metricKey}_mtd`),
                      primary: sumFn(
                        `${metricKey}_${payload.windows.primary}d`,
                      ),
                      secondary: sumFn(
                        `${metricKey}_${payload.windows.secondary}d`,
                      ),
                    };
                  };
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row
                        style={{
                          background: "#f8fafc",
                          fontWeight: 700,
                        }}>
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
                        {/* IMPRESSIONS */}
                        <Table.Summary.Cell index={3}>
                          {sumNumber("impressions")}
                        </Table.Summary.Cell>
                        {/* CLICKS */}
                        <Table.Summary.Cell index={4}>
                          {sumNumber("clicks_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                          {sumNumber(`clicks_${payload.windows.primary}d`)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6}>
                          {sumNumber(`clicks_${payload.windows.secondary}d`)}
                        </Table.Summary.Cell>
                        {/* INSTALLS */}
                        <Table.Summary.Cell index={7}>
                          {sumNumber("installs_mtd")}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8}>
                          {sumNumber(`installs_${payload.windows.primary}d`)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9}>
                          {sumNumber(`installs_${payload.windows.secondary}d`)}
                        </Table.Summary.Cell>
                        {/* C2I */}
                        <Table.Summary.Cell index={10}>
                          {valueWithPercent(
                            totalInstallsMTD,
                            calcPercent(totalInstallsMTD, totalClicksMTD),
                          )}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={11}>
                          {valueWithPercent(
                            totalInstallsPrimary,
                            calcPercent(
                              totalInstallsPrimary,
                              totalClicksPrimary,
                            ),
                          )}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={12}>
                          {valueWithPercent(
                            totalInstallsSecondary,
                            calcPercent(
                              totalInstallsSecondary,
                              totalClicksSecondary,
                            ),
                          )}
                        </Table.Summary.Cell>
                        {/* RT INSTALL */}
                        <Table.Summary.Cell index={13}>
                          {valueWithPercent(
                            totalRTMTD,
                            calcPercent(totalRTMTD, totalInstallsMTD),
                          )}
                        </Table.Summary.Cell>

                        <Table.Summary.Cell index={14}>
                          {valueWithPercent(
                            totalRTPrimary,
                            calcPercent(totalRTPrimary, totalInstallsPrimary),
                          )}
                        </Table.Summary.Cell>

                        <Table.Summary.Cell index={15}>
                          {valueWithPercent(
                            totalRTSecondary,
                            calcPercent(
                              totalRTSecondary,
                              totalInstallsSecondary,
                            ),
                          )}
                        </Table.Summary.Cell>
                        {/* PA INSTALL */}
                        <Table.Summary.Cell index={16}>
                          {valueWithPercent(
                            totalPAMTD,
                            calcPercent(totalPAMTD, totalInstallsMTD),
                          )}
                        </Table.Summary.Cell>

                        <Table.Summary.Cell index={17}>
                          {valueWithPercent(
                            totalPAPrimary,
                            calcPercent(totalPAPrimary, totalInstallsPrimary),
                          )}
                        </Table.Summary.Cell>

                        <Table.Summary.Cell index={18}>
                          {valueWithPercent(
                            totalPASecondary,
                            calcPercent(
                              totalPASecondary,
                              totalInstallsSecondary,
                            ),
                          )}
                        </Table.Summary.Cell>
                        {/* INSTALL FRAUD */}
                        <Table.Summary.Cell index={19}>
                          {valueWithPercent(
                            totalRTMTD + totalPAMTD,
                            calcPercent(
                              totalRTMTD + totalPAMTD,
                              totalInstallsMTD,
                            ),
                          )}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={20}>
                          {valueWithPercent(
                            totalRTPrimary + totalPAPrimary,
                            calcPercent(
                              totalRTPrimary + totalPAPrimary,
                              totalInstallsPrimary,
                            ),
                          )}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={21}>
                          {valueWithPercent(
                            totalRTSecondary + totalPASecondary,
                            calcPercent(
                              totalRTSecondary + totalPASecondary,
                              totalInstallsSecondary,
                            ),
                          )}
                        </Table.Summary.Cell>
                        {/* DYNAMIC EVENTS */}
                        {(() => {
                          let currentIndex = 22;

                          return eventNumbers.flatMap((num) => {
                            const eventTotals = getMetricTotals(
                              `E${num}_count`,
                            );

                            const cells = [
                              // EVENT COUNT
                              <Table.Summary.Cell
                                key={`e${num}-mtd`}
                                index={currentIndex++}>
                                {eventTotals.mtd}
                              </Table.Summary.Cell>,

                              <Table.Summary.Cell
                                key={`e${num}-p`}
                                index={currentIndex++}>
                                {eventTotals.primary}
                              </Table.Summary.Cell>,

                              <Table.Summary.Cell
                                key={`e${num}-s`}
                                index={currentIndex++}>
                                {eventTotals.secondary}
                              </Table.Summary.Cell>,
                            ];

                            // CR EVENT
                            // Skip E1 as it's handled differently

                            if (pageData[0][`cr_E${num}_mtd`] !== undefined) {
                              cells.push(
                                <Table.Summary.Cell
                                  key={`cr-e${num}-mtd`}
                                  index={currentIndex++}>
                                  {valueWithPercent(
                                    eventTotals.mtd,
                                    calcPercent(
                                      eventTotals.mtd,
                                      totalInstallsMTD,
                                    ),
                                  )}
                                </Table.Summary.Cell>,

                                <Table.Summary.Cell
                                  key={`cr-e${num}-p`}
                                  index={currentIndex++}>
                                  {valueWithPercent(
                                    eventTotals.primary,
                                    calcPercent(
                                      eventTotals.primary,
                                      totalInstallsPrimary,
                                    ),
                                  )}
                                </Table.Summary.Cell>,

                                <Table.Summary.Cell
                                  key={`cr-e${num}-s`}
                                  index={currentIndex++}>
                                  {valueWithPercent(
                                    eventTotals.secondary,
                                    calcPercent(
                                      eventTotals.secondary,
                                      totalInstallsSecondary,
                                    ),
                                  )}
                                </Table.Summary.Cell>,
                              );
                            }

                            // PAE EVENT
                            // Skip E1 as it's handled differently
                            if (
                              Number(num) !== 1 &&
                              pageData[0][`pae_E${num}_mtd`] !== undefined
                            ) {
                              const paeTotals = getMetricTotals(
                                `pae_E${num}`,
                                true,
                              );

                              cells.push(
                                <Table.Summary.Cell
                                  key={`pae-e${num}-mtd`}
                                  index={currentIndex++}>
                                  {valueWithPercent(
                                    paeTotals.mtd,
                                    calcPercent(paeTotals.mtd, eventTotals.mtd),
                                  )}
                                </Table.Summary.Cell>,

                                <Table.Summary.Cell
                                  key={`pae-e${num}-p`}
                                  index={currentIndex++}>
                                  {valueWithPercent(
                                    paeTotals.primary,
                                    calcPercent(
                                      paeTotals.primary,
                                      eventTotals.primary,
                                    ),
                                  )}
                                </Table.Summary.Cell>,

                                <Table.Summary.Cell
                                  key={`pae-e${num}-s`}
                                  index={currentIndex++}>
                                  {valueWithPercent(
                                    paeTotals.secondary,
                                    calcPercent(
                                      paeTotals.secondary,
                                      eventTotals.secondary,
                                    ),
                                  )}
                                </Table.Summary.Cell>,
                              );
                            }

                            return cells;
                          });
                        })()}
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
              }
            `}</style>
          </div>
          <div style={{ padding: 20 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col xs={12} sm={12} md={6}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    textAlign: "center",
                    borderLeft: "5px solid #1677ff",
                  }}>
                  <div style={{ fontSize: 13, color: "#666" }}>Total PIDs</div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#1677ff",
                    }}>
                    {pidSummary.total}
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={12} md={6}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    textAlign: "center",
                    borderLeft: "5px solid #52c41a",
                  }}>
                  <div style={{ fontSize: 13, color: "#666" }}>Active PIDs</div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#52c41a",
                    }}>
                    {pidSummary.active}
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={12} md={6}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    textAlign: "center",
                    borderLeft: "5px solid #ff4d4f",
                  }}>
                  <div style={{ fontSize: 13, color: "#666" }}>Paused PIDs</div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#ff4d4f",
                    }}>
                    {pidSummary.paused}
                  </div>
                </Card>
              </Col>

              <Col xs={12} sm={12} md={6}>
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    textAlign: "center",
                    borderLeft: "5px solid #fa8c16",
                  }}>
                  <div style={{ fontSize: 13, color: "#666" }}>N/A PIDs</div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#fa8c16",
                    }}>
                    {pidSummary.na}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
          <DecisionTable
            campaign_name={payload.campaign_name}
            os={payload.os}
            lastdate={payload.end_date}
            geo={payload.geo}
            campaign_ids={payload.campaign_ids}
            allowedCampaignIds={allowedCampaignIds}
          />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default CampaignAnalyticsTable;
