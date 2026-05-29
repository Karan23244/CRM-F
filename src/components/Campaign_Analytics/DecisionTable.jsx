// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Table,
//   Tag,
//   Card,
//   Typography,
//   message,
//   Spin,
//   Popover,
// } from "antd";
// import axios from "axios";
// import { useSelector } from "react-redux";

// const API = import.meta.env.VITE_API_URL2;
// const apiUrl = import.meta.env.VITE_API_URL;

// const { Title } = Typography;

// const DecisionTable = ({ campaign_name, os, lastdate }) => {
//   const user = useSelector((state) => state.auth.user);

//   const [loading, setLoading] = useState(false);
//   const [dataSource, setDataSource] = useState([]);
//   const [subadmins, setSubadmins] = useState([]);

//   // ================= ACCESS =================
//   const allowedRoles = [
//     "publisher_manager",
//     "publisher",
//     "pub_executive",
//   ];

//   const hasAccess = user?.role?.some((r) => allowedRoles.includes(r));

//   // ================= FETCH SUBADMINS =================
//   const fetchSubadmins = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/get-subadmin`);

//       setSubadmins(res.data?.data || []);
//     } catch (err) {
//       console.error("Subadmin fetch error", err);
//     }
//   };

//   // ================= FETCH DECISION DATA =================
//   const fetchDecisionData = async () => {
//     try {
//       setLoading(true);

//       const payload = {
//         campaign_name,
//         os,
//         date: lastdate,
//       };

//       console.log("Fetching decision data with payload:", payload);

//       const res = await axios.post(
//         `${API}/api/decision`,
//         payload,
//       );

//       if (res.data?.success) {
//         setDataSource(res.data.data || []);
//       } else {
//         message.error("Failed to fetch data");
//       }
//     } catch (error) {
//       console.error(error);
//       message.error("API Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (hasAccess) {
//       fetchDecisionData();
//       fetchSubadmins();
//     }
//   }, [campaign_name, os, lastdate, hasAccess]);

//   // ================= FILTER DATA BY USER =================
//   const filteredData = useMemo(() => {
//     const normalize = (val) =>
//       val === null || val === undefined || val === ""
//         ? "-"
//         : val.toString().trim().toLowerCase();

//     if (!hasAccess) return [];

//     const username = normalize(user?.username);

//     const assignedIds = user?.assigned_subadmins || [];

//     // assigned subadmin usernames
//     const assignedNames = subadmins
//       .filter((s) => assignedIds.includes(s.id))
//       .map((s) => normalize(s.username));

//     return dataSource.filter((item) => {
//       const pubam = normalize(item.pubam);

//       // own data
//       if (pubam === username) return true;

//       // assigned subadmin data
//       if (assignedNames.includes(pubam)) return true;

//       // only publisher_manager can see n/a
//       if (
//         user?.role?.includes("publisher_manager") &&
//         (pubam === "n/a" || pubam === "-")
//       ) {
//         return true;
//       }

//       return false;
//     });
//   }, [dataSource, user, subadmins, hasAccess]);

//   // ================= STATUS COLOR =================
//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case "live":
//         return "green";
//       case "pause":
//         return "red";
//       default:
//         return "orange";
//     }
//   };

//   // ================= GRADE COLOR =================
//   const getGradeColor = (grade) => {
//     if (grade === "A") return "green";
//     if (grade === "B") return "blue";
//     if (grade === "C") return "orange";
//     return "red";
//   };

//   // ================= ELIGIBILITY POPUP =================
//   const renderEligibility = (flags) => {
//     return (
//       <div className="w-[260px] rounded-xl overflow-hidden shadow-lg bg-white">
//         <div className="p-3 space-y-2">
//           {Object.entries(flags || {}).map(([key, value]) => (
//             <div
//               key={key}
//               className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
//             >
//               <span className="text-gray-700 text-sm capitalize">
//                 {key.replace("_", " ")}
//               </span>

//               <Tag
//                 color={value ? "green" : "red"}
//                 className="rounded-full px-2"
//               >
//                 {value ? "✔" : "✖"}
//               </Tag>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // ================= METRICS POPUP =================
//   const renderMetrics = (metrics) => {
//     return (
//       <div className="w-[300px] rounded-xl overflow-hidden shadow-xl bg-white">
//         <div className="p-3 space-y-2">
//           {Object.entries(metrics || {}).map(([key, val]) => (
//             <div
//               key={key}
//               className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
//             >
//               <div className="flex flex-col">
//                 <span className="text-xs text-gray-500 uppercase">
//                   {key}
//                 </span>

//                 <span className="font-semibold text-gray-800">
//                   {val?.value}
//                 </span>
//               </div>

//               <Tag
//                 color={getGradeColor(val?.grade)}
//                 className="text-sm px-2 py-0.5 rounded-full"
//               >
//                 {val?.grade}
//               </Tag>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // ================= TABLE COLUMNS =================
//   const columns = [
//     {
//       title: "Pub AM",
//       dataIndex: "pubam",
//       key: "pubam",
//       width: 180,
//       render: (text) => (
//         <span className="font-medium text-gray-800">
//           {text}
//         </span>
//       ),
//     },
//     {
//       title: "Pub ID",
//       dataIndex: "pubid",
//       key: "pubid",
//       width: 120,
//     },
//     {
//       title: "PID",
//       dataIndex: "pid",
//       key: "pid",
//       ellipsis: true,
//     },
//     {
//       title: "Metrics",
//       key: "metrics",
//       width: 150,
//       render: (_, record) => (
//         <Popover
//           content={renderMetrics(record.metrics)}
//           title="Performance Metrics"
//           trigger="hover"
//         >
//           <Tag color="blue" className="cursor-pointer">
//             View Metrics
//           </Tag>
//         </Popover>
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       width: 140,
//       render: (status) => (
//         <Tag
//           color={getStatusColor(status)}
//           className="px-3 py-1 rounded-md"
//         >
//           {status}
//         </Tag>
//       ),
//     },
//   ];

//   // ================= NO ACCESS =================
//   if (!hasAccess) {
//     return (
//       <div
//         style={{
//           padding: 20,
//           textAlign: "center",
//           color: "#ff4d4f",
//           fontWeight: 600,
//         }}
//       >
//         You do not have permission to view this report
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <Card className="shadow-lg rounded-2xl border-0">
//         <div className="flex items-center justify-between mb-5">
//           <Title level={4} className="!mb-0">
//             Campaign Decision Report
//           </Title>
//         </div>

//         <Spin spinning={loading}>
//           <Table
//             columns={columns}
//             dataSource={filteredData}
//             rowKey={(record, index) => index}
//             bordered
//             pagination={{
//               pageSize: 10,
//               showSizeChanger: true,
//             }}
//             scroll={{ x: 900 }}
//             className="rounded-xl overflow-hidden"
//           />
//         </Spin>
//       </Card>
//     </div>
//   );
// };

// export default DecisionTable;

import React, { useEffect, useMemo, useState, startTransition } from "react";

import {
  Table,
  Tag,
  Card,
  Typography,
  message,
  Spin,
  Popover,
  Input,
  Checkbox,
} from "antd";

import axios from "axios";
import { useSelector } from "react-redux";
import { sortDropdownValues } from "../../Utils/sortDropdownValues";
import StyledTable from "../../Utils/StyledTable";

const API = import.meta.env.VITE_API_URL2;
const apiUrl = import.meta.env.VITE_API_URL;

const { Title } = Typography;

const DecisionTable = ({ campaign_name, os, lastdate, geo, campaign_ids }) => {
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [subadmins, setSubadmins] = useState([]);

  // ================= FILTER STATES =================
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});

  // ================= ACCESS =================
  const allowedRoles = [
    "publisher_manager",
    "publisher",
    "pub_executive",
    "optimization",
    "operations",
    "advertiser_manager",
    "advertiser",
    "adv_executive",
    "admin",
  ];

  const hasAccess = user?.role?.some((r) => allowedRoles.includes(r));

  // ================= FETCH SUBADMINS =================
  const fetchSubadmins = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-subadmin`);

      setSubadmins(res.data?.data || []);
    } catch (err) {
      console.error("Subadmin fetch error", err);
    }
  };

  // ================= FETCH DECISION DATA =================
  const fetchDecisionData = async () => {
    try {
      setLoading(true);

      const payload = {
        campaign_name,
        os,
        date: lastdate,
        geo,
        campaign_ids,
      };

      console.log("Fetching decision data with payload:", payload);

      const res = await axios.post(`${API}/api/decision`, payload);
      console.log("API response:", res);
      if (res.data?.success) {
        setDataSource(res.data.data || []);
      } else {
        message.error("Failed to fetch data");
      }
    } catch (error) {
      console.error(error);
      message.error("API Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchDecisionData();
      fetchSubadmins();
    }
  }, [campaign_name, os, lastdate, hasAccess]);

  // ================= FILTER DATA BY USER =================
  const roleFilteredData = useMemo(() => {
    const normalize = (val) =>
      val === null || val === undefined || val === ""
        ? "-"
        : val.toString().trim().toLowerCase();

    if (!hasAccess) return [];

    const username = normalize(user?.username);

    const assignedIds = user?.assigned_subadmins || [];

    const assignedNames = subadmins
      .filter((s) => assignedIds.includes(s.id))
      .map((s) => normalize(s.username));

    return dataSource.filter((item) => {
      const pubam = normalize(item.pubam);

      // operations & optimization can see everything
      // full access roles
      if (
        user?.role?.includes("operations") ||
        user?.role?.includes("optimization") ||
        user?.role?.includes("advertiser_manager") ||
        user?.role?.includes("advertiser") ||
        user?.role?.includes("adv_executive") ||
        user?.role?.includes("admin")
      ) {
        return true;
      }

      // own data
      if (pubam === username) return true;

      // assigned subadmin data
      if (assignedNames.includes(pubam)) return true;

      // publisher manager extra access
      if (
        user?.role?.includes("publisher_manager") &&
        (pubam === "n/a" || pubam === "-")
      ) {
        return true;
      }

      return false;
    });
  }, [dataSource, user, subadmins, hasAccess]);

  // ================= COLUMN FILTERING =================
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

  // ================= HANDLE FILTER =================
  const handleFilterChange = (values, key) => {
    startTransition(() => {
      setFilters((prev) => {
        const allValues = uniqueValues[key] || [];

        if (values.length === allValues.length) {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        }

        return {
          ...prev,
          [key]: values,
        };
      });
    });
  };

  // ================= UNIQUE VALUES =================
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

    setUniqueValues((prev) => ({
      ...prev,
      [key]: values,
    }));
  };

  // ================= FILTER DROPDOWN =================
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

        {/* SELECT ALL */}
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
                checked={selectedValues.includes(val)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selectedValues, val]
                    : selectedValues.filter((v) => v !== val);

                  handleFilterChange(next, key);

                  confirm({
                    closeDropdown: false,
                  });
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

  // ================= STATUS COLOR =================
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "live":
        return "green";

      case "pause":
        return "red";

      default:
        return "orange";
    }
  };

  // ================= GRADE COLOR =================
  const getGradeColor = (grade) => {
    if (grade === "A") return "green";
    if (grade === "B") return "blue";
    if (grade === "C") return "orange";

    return "red";
  };

  // ================= ELIGIBILITY POPUP =================
  const renderEligibility = (flags) => {
    return (
      <div className="w-[260px] rounded-xl overflow-hidden shadow-lg bg-white">
        <div className="p-3 space-y-2">
          {Object.entries(flags || {}).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-gray-700 text-sm capitalize">
                {key.replace("_", " ")}
              </span>

              <Tag
                color={value ? "green" : "red"}
                className="rounded-full px-2">
                {value ? "✔" : "✖"}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ================= METRICS POPUP =================
  const renderMetrics = (metrics) => {
    return (
      <div className="w-[300px] rounded-xl overflow-hidden shadow-xl bg-white">
        <div className="p-3 space-y-2">
          {Object.entries(metrics || {}).map(([key, val]) => (
            <div
              key={key}
              className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase">{key}</span>

                <span className="font-semibold text-gray-800">
                  {val?.value}
                </span>
              </div>

              <Tag
                color={getGradeColor(val?.grade)}
                className="text-sm px-2 py-0.5 rounded-full">
                {val?.grade}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    {
      title: "Pub AM",
      dataIndex: "pubam",
      key: "pubam",
      width: 180,

      filterDropdown: (props) => getFilterDropdown("pubam", props),

      onFilterDropdownOpenChange: (open) => {
        if (open) setColumnUniqueValues("pubam");
      },

      render: (text) => (
        <span className="font-medium text-gray-800">{text}</span>
      ),
    },

    {
      title: "Pub ID",
      dataIndex: "pubid",
      key: "pubid",
      width: 120,

      filterDropdown: (props) => getFilterDropdown("pubid", props),

      onFilterDropdownOpenChange: (open) => {
        if (open) setColumnUniqueValues("pubid");
      },
    },

    {
      title: "PID",
      dataIndex: "pid",
      key: "pid",
      ellipsis: true,

      filterDropdown: (props) => getFilterDropdown("pid", props),

      onFilterDropdownOpenChange: (open) => {
        if (open) setColumnUniqueValues("pid");
      },
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,

      filterDropdown: (props) => getFilterDropdown("status", props),

      onFilterDropdownOpenChange: (open) => {
        if (open) setColumnUniqueValues("status");
      },

      render: (status) => (
        <Tag color={getStatusColor(status)} className="px-3 py-1 rounded-md">
          {status}
        </Tag>
      ),
    },

    {
      title: "Metrics",
      key: "metrics",
      width: 150,

      render: (_, record) => (
        <Popover
          content={renderMetrics(record.metrics)}
          title="Performance Metrics"
          trigger="hover">
          <Tag color="blue" className="cursor-pointer">
            View Metrics
          </Tag>
        </Popover>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Card className="shadow-lg rounded-2xl border-0">
        <div className="flex items-center justify-between mb-5">
          <Title level={4} className="!mb-0">
            Campaign Decision Report
          </Title>
        </div>

        <Spin spinning={loading}>
          <StyledTable
            columns={columns}
            dataSource={filteredData}
            rowKey={(record, index) => index}
            bordered
            scroll={{ x: "max-content", y: "70vh" }}
            sticky
            className="rounded-xl overflow-hidden"
          />
        </Spin>
      </Card>
    </div>
  );
};

export default DecisionTable;
