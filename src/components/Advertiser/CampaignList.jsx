import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Input,
  InputNumber,
  Select,
  Dropdown,
  Card,
  message,
  Button,
  Checkbox,
} from "antd";
import {
  FilterOutlined,
  PushpinOutlined,
  PushpinFilled,
  ClearOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import StyledTable from "../../Utils/StyledTable";
import { useNavigate } from "react-router-dom";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const CampaignList = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const [campaigns, setCampaigns] = useState([]);
  const [filters, setFilters] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [searchText, setSearchText] = useState("");
  const [editingCell, setEditingCell] = useState({ id: null, key: null });
  const [firstFilterColumn, setFirstFilterColumn] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenCampaignColumns");
    return saved ? JSON.parse(saved) : [];
  });
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  // persist hidden columns
  useEffect(() => {
    localStorage.setItem(
      "hiddenCampaignColumns",
      JSON.stringify(hiddenColumns)
    );
  }, [hiddenColumns]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/campaigns`, {
        params: {
          user_id: user?.id || user?._id, // <-- sending user ID here
        },
      });
      setCampaigns(res.data.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch campaigns", "error");
    }
  }, [user]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);
  // Handle cell save
  const handleSave = async (record, updatedValues = {}) => {
    try {
      // If user updates "status"
      if (updatedValues.status) {
        const endpoint =
          updatedValues.status === "Live"
            ? `${apiUrl}/resume-campaign`
            : `${apiUrl}/pause-campaign`;

        await axios.post(endpoint, {
          campaign_id: record.id.toString(),
          os: record.os || "Android", // fallback if OS not set
        });

        Swal.fire({
          title: "Status Updated!",
          text: `Campaign ${
            updatedValues.status === "Live" ? "resumed" : "paused"
          } successfully.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchCampaigns();
      } else {
        // For other editable fields (adv_note, category, etc.)
        await axios.put(`${apiUrl}/campaigns/${record.id}`, {
          ...record,
          ...updatedValues,
        });

        Swal.fire({
          title: "Updated!",
          text: `${Object.keys(updatedValues)[0]} updated successfully.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setEditingCell({ id: null, key: null });
      fetchCampaigns(); // Refresh data
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update campaign", "error");
    }
  };
  // Helpers
  const handleDropdownFilter = (value, key) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const togglePin = (key) =>
    setPinnedColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  // const getUniqueOptions = (key) => [
  //   ...new Set(campaigns.map((c) => c[key]).filter(Boolean)),
  // ];
  // 🔥 Dynamic filter option generator
  const getUniqueOptions = (columnKey) => {
    const noFiltersApplied = Object.keys(filters).length === 0;

    // If NO filters applied → show full options
    if (noFiltersApplied) {
      return [...new Set(campaigns.map((r) => r[columnKey]))].filter(Boolean);
    }

    // If THIS is the first filtered column → show full options
    if (firstFilterColumn === columnKey) {
      return [...new Set(campaigns.map((r) => r[columnKey]))].filter(Boolean);
    }

    // Otherwise → show options based on already filtered rows
    return [...new Set(filteredCampaigns.map((r) => r[columnKey]))].filter(
      Boolean
    );
  };

  // Editable cell factory
  const getEditableCell = (field, type = "text") => ({
    render: (_, record) => {
      const isEditing =
        editingCell.id === record.id && editingCell.key === field;

      if (isEditing) {
        if (field === "category") {
          const categoryOptions = [
            { label: "Stable", value: "Stable" },
            { label: "Scale", value: "Scale" },
            { label: "Category Three", value: "Category Three" },
          ];
          return (
            <Select
              defaultValue={record[field]}
              options={categoryOptions}
              autoFocus
              style={{ width: "100%" }}
              onChange={(val) => handleSave(record, { [field]: val })}
              onBlur={() => setEditingCell({ id: null, key: null })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave(record, { [field]: e.target.value });
                }
              }}
            />
          );
        }
        if (field === "status") {
          const statusOptions = [
            { label: "Live", value: "Live" },
            { label: "Pause", value: "Pause" },
          ];
          return (
            <Select
              defaultValue={record[field]}
              options={statusOptions}
              autoFocus
              style={{ width: "100%" }}
              onChange={(val) => handleSave(record, { [field]: val })}
              onBlur={() => setEditingCell({ id: null, key: null })}
            />
          );
        }
        const input =
          type === "number" ? (
            <InputNumber
              min={0}
              defaultValue={record[field]}
              autoFocus
              style={{ width: "100%" }}
              onPressEnter={(e) =>
                handleSave(record, { [field]: Number(e.target.value) })
              }
              onBlur={(e) =>
                handleSave(record, { [field]: Number(e.target.value) })
              }
            />
          ) : (
            <Input
              defaultValue={record[field]}
              autoFocus
              onPressEnter={(e) =>
                handleSave(record, { [field]: e.target.value })
              }
              onBlur={(e) => handleSave(record, { [field]: e.target.value })}
            />
          );

        return input;
      }

      return (
        <div
          onClick={() => {
            if (editableFields.includes(field)) {
              setEditingCell({ id: record.id, key: field });
            }
          }}
          style={{
            cursor: editableFields.includes(field) ? "pointer" : "default",
          }}>
          {record[field] || "-"}
        </div>
      );
    },
  });

  // Reusable column generator with Filter + Pin + Sort
  const getColumnWithFilterAndPin = (dataIndex, title, renderFn = null) => {
    const isPinned = pinnedColumns[dataIndex];
    const isFiltered = !!filters[dataIndex];
    const isSorted = sortInfo.columnKey === dataIndex;

    return {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: isFiltered ? "#1677ff" : "inherit",
            gap: 6,
          }}>
          <span>{title}</span>
          <div
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}>
            {/* Filter Dropdown */}
            <Dropdown
              trigger={["click"]}
              dropdownRender={() => (
                <div
                  style={{
                    padding: 8,
                    backgroundColor: "white",
                    borderRadius: 4,
                  }}>
                  {/* Select All */}
                  <div style={{ marginBottom: 8 }}>
                    {getUniqueOptions(dataIndex)
                      .sort((a, b) =>
                        !isNaN(a) && !isNaN(b)
                          ? a - b
                          : a.toString().localeCompare(b.toString())
                      )
                      .map((val) => (
                        <Select.Option key={val} value={val} label={val}>
                          <Checkbox checked={filters[dataIndex]?.includes(val)}>
                            {val}
                          </Checkbox>
                        </Select.Option>
                      ))}
                  </div>

                  {/* Multiselect */}
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder={`Select ${title}`}
                    style={{ width: 250 }}
                    value={filters[dataIndex] || []}
                    onChange={(val) => {
                      setFilters((prev) => {
                        const newFilters = { ...prev, [dataIndex]: val };

                        // If no first filter is selected, set this column as first
                        if (!firstFilterColumn && val.length > 0) {
                          setFirstFilterColumn(dataIndex);
                        }

                        // If this column is cleared and it was the first filter → reset first filter
                        if (
                          firstFilterColumn === dataIndex &&
                          val.length === 0
                        ) {
                          setFirstFilterColumn(null);
                        }

                        return newFilters;
                      });
                    }}
                    optionLabelProp="label"
                    maxTagCount="responsive"
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toString()
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }>
                    {getUniqueOptions(dataIndex)
                      .filter((v) => v !== "" && v !== null && v !== undefined)
                      .sort((a, b) =>
                        !isNaN(a) && !isNaN(b)
                          ? a - b
                          : a.toString().localeCompare(b.toString())
                      )
                      .map((val) => (
                        <Select.Option key={val} value={val} label={val}>
                          <Checkbox checked={filters[dataIndex]?.includes(val)}>
                            {val}
                          </Checkbox>
                        </Select.Option>
                      ))}
                  </Select>
                </div>
              )}>
              <FilterOutlined
                onClick={(e) => e.stopPropagation()} // 👈 prevent header click
                style={{
                  color: isFiltered ? "#1677ff" : "#888",
                  cursor: "pointer",
                }}
              />
            </Dropdown>

            {/* Pin Icon */}
            {isPinned ? (
              <PushpinFilled
                onClick={(e) => {
                  e.stopPropagation(); // 👈 prevent header click
                  togglePin(dataIndex);
                }}
                style={{ color: "#1677ff", cursor: "pointer" }}
              />
            ) : (
              <PushpinOutlined
                onClick={(e) => {
                  e.stopPropagation(); // 👈 prevent header click
                  togglePin(dataIndex);
                }}
                style={{ color: "#888", cursor: "pointer" }}
              />
            )}
          </div>
        </div>
      ),

      key: dataIndex,
      dataIndex,
      fixed: isPinned ? "left" : false,
      sorter: (a, b) =>
        (a[dataIndex] || "")
          .toString()
          .localeCompare((b[dataIndex] || "").toString()),
      sortOrder: isSorted ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === dataIndex) {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend") newOrder = null;
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: dataIndex,
            order: newOrder,
          });
        },
      }),
      render: renderFn
        ? (text, record) => renderFn(text, record)
        : (text) => text || "-",
    };
  };
  // 🔍 APPLY SEARCH + FILTERS + SORT
  const filteredCampaigns = campaigns
    .filter((row) => {
      // SEARCH
      const rowText = Object.values(row).join(" ").toLowerCase();
      const matchesSearch = rowText.includes(searchText.toLowerCase());

      // FILTERS
      const matchesFilters = Object.keys(filters).every((key) => {
        if (!filters[key] || filters[key].length === 0) return true;

        return filters[key].includes(row[key]);
      });

      return matchesSearch && matchesFilters;
    })
    .sort((a, b) => {
      if (!sortInfo.order || !sortInfo.columnKey) return 0;

      const col = sortInfo.columnKey;
      const valA = (a[col] || "").toString().toLowerCase();
      const valB = (b[col] || "").toString().toLowerCase();

      return sortInfo.order === "ascend"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

  // ✅ Normalize to array safely
  let roles = [];
  try {
    roles =
      typeof role === "string"
        ? JSON.parse(role)
        : Array.isArray(role)
        ? role
        : [role];
  } catch {
    roles = [role];
  }

  // ✅ Build editable fields dynamically
  let editableFields = [];

  if (
    roles.some((r) =>
      ["advertiser", "advertiser_manager", "operations"].includes(r)
    )
  ) {
    editableFields.push("adv_note", "status");
  }

  if (roles.some((r) => ["publisher", "publisher_manager"].includes(r))) {
    editableFields.push("category", "Target", "achieve_number");
  }

  // ✅ Remove duplicates (in case of overlap)
  editableFields = [...new Set(editableFields)];
  // ✅ Clear All Filters, Sorts, Pins, and Hidden Columns
  const clearAllFilters = () => {
    setFilters({});
    setSortInfo({ columnKey: null, order: null });
    setPinnedColumns({});
    setHiddenColumns([]);
    localStorage.removeItem("hiddenCampaignColumns");
    message.success(
      "✅ All filters, sorts, pins, and hidden columns have been cleared"
    );
  };
  // All Columns
  const allColumns = [
    // {
    //   title: (
    //     <div
    //       style={{
    //         display: "flex",
    //         justifyContent: "space-between",
    //         alignItems: "center",
    //         color:
    //           filters["Adv_name"] || filters["adv_d"] ? "#1677ff" : "inherit",
    //         gap: 6,
    //       }}>
    //       <span>Adv AM (Adv ID)</span>
    //       <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    //         {/* Filter Dropdown */}
    //         <Dropdown
    //           trigger={["click"]}
    //           dropdownRender={() => (
    //             <div
    //               style={{
    //                 padding: 8,
    //                 backgroundColor: "white",
    //                 borderRadius: 4,
    //                 width: 260,
    //               }}>
    //               {/* Select All */}
    //               <div style={{ marginBottom: 8 }}>
    //                 <Checkbox
    //                   indeterminate={
    //                     filters["Adv_name"]?.length > 0 &&
    //                     filters["Adv_name"]?.length <
    //                       getUniqueOptions("Adv_name").filter(
    //                         (v) => v !== "" && v !== null && v !== undefined
    //                       ).length
    //                   }
    //                   checked={
    //                     filters["Adv_name"]?.length ===
    //                     getUniqueOptions("Adv_name").filter(
    //                       (v) => v !== "" && v !== null && v !== undefined
    //                     ).length
    //                   }
    //                   onChange={(e) =>
    //                     setFilters((prev) => ({
    //                       ...prev,
    //                       Adv_name: e.target.checked
    //                         ? getUniqueOptions("Adv_name").filter(
    //                             (v) => v !== "" && v !== null && v !== undefined
    //                           )
    //                         : [],
    //                     }))
    //                   }>
    //                   Select All
    //                 </Checkbox>
    //               </div>

    //               {/* Multiselect Advertiser Filter */}
    //               <Select
    //                 mode="multiple"
    //                 allowClear
    //                 showSearch
    //                 placeholder="Filter Advertiser"
    //                 style={{ width: "100%" }}
    //                 value={filters["Adv_name"] || []}
    //                 onChange={(val) =>
    //                   setFilters((prev) => ({ ...prev, Adv_name: val }))
    //                 }
    //                 optionLabelProp="label"
    //                 maxTagCount="responsive"
    //                 filterOption={(input, option) =>
    //                   (option?.label ?? "")
    //                     .toString()
    //                     .toLowerCase()
    //                     .includes(input.toLowerCase())
    //                 }>
    //                 {getUniqueOptions("Adv_name")
    //                   .filter((v) => v !== "" && v !== null && v !== undefined)
    //                   .sort((a, b) =>
    //                     !isNaN(a) && !isNaN(b)
    //                       ? a - b
    //                       : a.toString().localeCompare(b.toString())
    //                   )
    //                   .map((val) => (
    //                     <Select.Option key={val} value={val} label={val}>
    //                       <Checkbox
    //                         checked={filters["Adv_name"]?.includes(val)}>
    //                         {val}
    //                       </Checkbox>
    //                     </Select.Option>
    //                   ))}
    //               </Select>
    //             </div>
    //           )}>
    //           <FilterOutlined
    //             onClick={(e) => e.stopPropagation()} // ✅ prevent sorting when clicking filter
    //             style={{
    //               color: filters["Adv_name"] ? "#1677ff" : "#888",
    //               cursor: "pointer",
    //             }}
    //           />
    //         </Dropdown>

    //         {/* Pin Icon */}
    //         {pinnedColumns["Adv AM (Adv ID)"] ? (
    //           <PushpinFilled
    //             onClick={(e) => {
    //               e.stopPropagation(); // ✅ prevent header sort
    //               togglePin("Adv AM (Adv ID)");
    //             }}
    //             style={{ color: "#1677ff", cursor: "pointer" }}
    //           />
    //         ) : (
    //           <PushpinOutlined
    //             onClick={(e) => {
    //               e.stopPropagation(); // ✅ prevent header sort
    //               togglePin("Adv AM (Adv ID)");
    //             }}
    //             style={{ color: "#888", cursor: "pointer" }}
    //           />
    //         )}
    //       </div>
    //     </div>
    //   ),

    //   key: "Adv AM (Adv ID)",
    //   dataIndex: "Adv AM (Adv ID)",
    //   fixed: pinnedColumns["Adv AM (Adv ID)"] ? "left" : false,

    //   sorter: (a, b) => {
    //     const advA = `${a.Adv_name || ""} ${a.adv_d || ""}`.toLowerCase();
    //     const advB = `${b.Adv_name || ""} ${b.adv_d || ""}`.toLowerCase();
    //     return advA.localeCompare(advB);
    //   },
    //   sortOrder: sortInfo.columnKey === "Adv AM/Adv ID" ? sortInfo.order : null,

    //   onHeaderCell: () => ({
    //     onClick: () => {
    //       let newOrder = "ascend";
    //       if (sortInfo.columnKey === "Adv AM/Adv ID") {
    //         if (sortInfo.order === "ascend") newOrder = "descend";
    //         else if (sortInfo.order === "descend") newOrder = null;
    //         else newOrder = "ascend";
    //       }
    //       setSortInfo({
    //         columnKey: "Adv AM (Adv ID)",
    //         order: newOrder,
    //       });
    //     },
    //   }),

    //   render: (_, record) => (
    //     <div>
    //       <p>
    //         {record.Adv_name || "-"} ({record.adv_d || "-"})
    //       </p>
    //     </div>
    //   ),
    // },
    getColumnWithFilterAndPin("da", "DA"),
    getColumnWithFilterAndPin("adv_full", "ADV ID"),
    getColumnWithFilterAndPin("adv_am", "ADV AM"),
    getColumnWithFilterAndPin(
      "campaign_name",
      "Campaign Name",
      (text, record) => (
        <span
          style={{ cursor: "pointer" }}
          onClick={() =>
            navigate("/dashboard/createcampaign", { state: { record } })
          }>
          {text}
        </span>
      )
    ),
    getColumnWithFilterAndPin("id", "Campaign ID"),
    getColumnWithFilterAndPin("geo", "Geo", (geo) => {
      if (!geo) return "-";

      try {
        // If geo is a string, try to parse it (backend might send JSON string)
        if (typeof geo === "string") {
          geo = JSON.parse(geo);
        }
      } catch {
        // If parse fails, keep original string
        return geo;
      }

      // If geo is array of arrays → flatten
      if (Array.isArray(geo)) {
        return geo.flat ? geo.flat().join(", ") : [].concat(...geo).join(", ");
      }

      // Fallback — return as string
      return String(geo);
    }),

    getColumnWithFilterAndPin("os", "OS"),
    getColumnWithFilterAndPin("payable_event", "Payable Event"),
    getColumnWithFilterAndPin(
      "category",
      "Category",
      getEditableCell("category").render
    ),
    getColumnWithFilterAndPin(
      "Target",
      "Target",
      getEditableCell("Target", "number").render
    ),
    getColumnWithFilterAndPin(
      "achieve_number",
      "Achieve Number",
      getEditableCell("achieve_number", "number").render
    ),
    getColumnWithFilterAndPin(
      "adv_note",
      "Advertiser Note",
      getEditableCell("adv_note").render
    ),
    getColumnWithFilterAndPin(
      "status",
      "Status",
      getEditableCell("status").render
    ),
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (val) => (val ? dayjs(val).format("YYYY-MM-DD HH:mm") : "-"),
    },
  ];

  // Filter out hidden columns before rendering
  const visibleColumns = allColumns.filter(
    (col) => !hiddenColumns.includes(col.key)
  );

  const columnHeadings = allColumns.reduce((acc, col) => {
    acc[col.key] = col.title.props?.children?.[0] || col.title || col.key;
    return acc;
  }, {});

  const desiredOrder = allColumns.map((col) => col.key);

  return (
    <div className="p-4">
      <Card
        title="Campaigns"
        className="shadow-md rounded-2xl border border-gray-200">
        {/* 🧩 Hide Column Selector */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input
            placeholder="Search anything..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="Select columns to hide"
            style={{ minWidth: 250 }}
            value={hiddenColumns}
            onChange={(values) => setHiddenColumns(values)}
            maxTagCount="responsive">
            {desiredOrder.map((key) => (
              <Select.Option key={key} value={key}>
                {columnHeadings[key] || key}
              </Select.Option>
            ))}
          </Select>

          <Button icon={<ClearOutlined />} onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </div>

        {/* 🧾 Table */}
        <StyledTable
          rowKey="id"
          columns={visibleColumns}
          dataSource={filteredCampaigns}
          bordered
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
};

export default CampaignList;
