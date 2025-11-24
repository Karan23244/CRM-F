import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Select,
  Dropdown,
  message,
  InputNumber,
  Button,
  Checkbox,
} from "antd";
import {
  PushpinOutlined,
  PushpinFilled,
  FilterOutlined,
  SwapOutlined,
  ClearOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";
import StyledTable from "../../Utils/StyledTable";

const { TextArea } = Input;
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const PubIdTable = () => {
  const [data, setData] = useState([]);
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenPublisherColumns");
    return saved ? JSON.parse(saved) : [];
  });
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  useEffect(() => {
    localStorage.setItem(
      "hiddenPublisherColumns",
      JSON.stringify(hiddenColumns)
    );
  }, [hiddenColumns]);

  // 🧭 Columns order
  const desiredOrder = [
    "campaign_id",
    "adv_AM",
    "adv_id",
    "pub_name",
    "pub_id",
    "campaign_name",
    "geo",
    "os",
    "achieved",
    "review",
    "note",
    "category",
    "updated_at",
  ];

  // 🏷️ Column display names
  const columnHeadings = {
    campaign_id: "Campaign ID",
    campaign_name: "Campaign Name",
    pub_id: "Publisher ID",
    pub_name: "Publisher AM",
    adv_id: "Advertiser ID",
    adv_AM: "Advertiser AM",
    category: "Category",
    geo: "Geo",
    os: "OS",
    review: "Review",
    achieved: "Achieved",
    note: "Note",
    updated_at: "Updated At",
  };

  // 🔹 Fetch PUBID Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/getpubdata`);

      const sortedData = (res.data.data || []).reverse(); // latest first
      console.log("Fetched PUBID data:", sortedData);
      setData(sortedData);
    } catch (error) {
      console.error("Error fetching PUBID data:", error);
      message.error("❌ Failed to fetch PUBID data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Auto Save Handler
  const handleAutoSave = async (record, field, value) => {
    if (record[field] === value) {
      setEditingCell({ rowId: null, field: null });
      return;
    }

    const id = record.id;
    try {
      const updatedRecord = { ...record, [field]: value };
      setData((prev) =>
        prev.map((item) => (item.id === id ? updatedRecord : item))
      );

      const response = await axios.put(`${apiUrl}/updatePubidData/${id}`, {
        [field]: value,
      });

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Updated!",
          text: `${field} updated successfully.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Update failed!",
          text: "Server did not confirm the update.",
        });
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to update value.",
      });
    } finally {
      setEditingCell({ rowId: null, field: null });
    }
  };

  // 🔹 Filter handling
  const handleDropdownFilter = (value, dataIndex) => {
    setFilters((prev) => ({ ...prev, [dataIndex]: value }));
  };

  // // 🔹 Get unique dropdown options
  // const getUniqueOptions = (key) => {
  //   const values = data
  //     .map((item) => item[key])
  //     .filter((v) => v !== undefined && v !== null);
  //   return [...new Set(values)];
  // };
  const getUniqueOptions = (columnKey) => {
    // If THIS column already has a filter applied → it should always show full data
    const hasSelfFilter = filters[columnKey] && filters[columnKey].length > 0;

    // If NO filters applied anywhere → show full data for all columns
    const noFiltersApplied = Object.keys(filters).length === 0;

    // If this column is being opened → type === "full-data"
    // If other columns → type === "filtered-data"

    // Determine whether to use full dataset or filtered dataset
    let source = data; // full dataset

    if (!hasSelfFilter && !noFiltersApplied) {
      // Other columns should show only filtered options
      source = filteredData;
    }

    // Extract unique values
    return [
      ...new Set(
        source
          .map((c) => c[columnKey])
          .filter((v) => v !== "" && v !== null && v !== undefined)
      ),
    ];
  };
  // 🔹 Pin/unpin column
  const togglePin = (key) => {
    setPinnedColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Filter Dropdown */}
            <Dropdown
              trigger={["click"]}
              dropdownRender={() => (
                <div
                  onClick={(e) => e.stopPropagation()}
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
                    onChange={(val) =>
                      setFilters((prev) => ({ ...prev, [dataIndex]: val }))
                    }
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
  // ✅ APPLY FILTER + SEARCH HERE
  const filteredData = data.filter((row) => {
    // 🔍 Search
    const rowString = Object.values(row).join(" ").toLowerCase();
    const matchesSearch = rowString.includes(searchText.toLowerCase());
    // FILTERS
    const matchesFilters = Object.keys(filters).every((key) => {
      if (!filters[key] || filters[key].length === 0) return true;

      return filters[key].includes(row[key]);
    });

    return matchesSearch && matchesFilters;
  });
  // 🔹 Editable Cell Helper
  const renderEditableCell = (record, field, value, type = "text") => {
    const isEditing =
      editingCell.rowId === record.id && editingCell.field === field;

    if (!isEditing) {
      return (
        <div
          style={{ cursor: "pointer", minHeight: 32 }}
          onClick={() => setEditingCell({ rowId: record.id, field })}>
          {value || "-"}
        </div>
      );
    }

    switch (type) {
      case "select-category":
        return (
          <Select
            autoFocus
            defaultValue={value}
            onBlur={() => setEditingCell({ rowId: null, field: null })}
            onChange={(val) => handleAutoSave(record, field, val)}
            options={[
              { label: "Stable", value: "Stable" },
              { label: "Scale", value: "Scale" },
              { label: "Category Three", value: "Category Three" },
            ]}
            style={{ width: "100%" }}
          />
        );
      case "select-review":
        return (
          <Select
            autoFocus
            defaultValue={value}
            onBlur={() => setEditingCell({ rowId: null, field: null })}
            onChange={(val) => handleAutoSave(record, field, val)}
            options={[
              { label: "Ok", value: "Ok" },
              { label: "Advertiser Pending", value: "Advertiser Pending" },
              { label: "Publisher Pending", value: "Publisher Pending" },
              { label: "Operations Pending", value: "Operations Pending" },
            ]}
            style={{ width: "100%" }}
          />
        );
      case "number":
        return (
          <InputNumber
            autoFocus
            defaultValue={value}
            onBlur={(e) => handleAutoSave(record, field, e.target.value || 0)}
            onPressEnter={(e) =>
              handleAutoSave(record, field, e.target.value || 0)
            }
            min={0}
            className="w-[100px]"
          />
        );
      case "textarea":
        return (
          <TextArea
            autoFocus
            defaultValue={value}
            onBlur={(e) => handleAutoSave(record, field, e.target.value || "")}
            onPressEnter={(e) =>
              handleAutoSave(record, field, e.target.value || "")
            }
            rows={1}
            className="w-full"
          />
        );
      default:
        return value || "-";
    }
  };
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

  // 🔹 Define columns
  const allColumns = [
    // {
    //   title: (
    //     <div
    //       style={{
    //         display: "flex",
    //         justifyContent: "space-between",
    //         alignItems: "center",
    //         color:
    //           filters["adv_AM"] || filters["adv_id"] ? "#1677ff" : "inherit",
    //         gap: 6,
    //       }}>
    //       <span>ADV AM(ADV ID)</span>
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
    //               }}
    //               onClick={(e) => e.stopPropagation()}>
    //               {/* Select All */}
    //               <div style={{ marginBottom: 8 }}>
    //                 <Checkbox
    //                   indeterminate={
    //                     filters["pub_name"]?.length > 0 &&
    //                     filters["pub_name"]?.length <
    //                       getUniqueOptions("pub_name").filter(
    //                         (v) => v !== "" && v !== null && v !== undefined
    //                       ).length
    //                   }
    //                   checked={
    //                     filters["pub_name"]?.length ===
    //                     getUniqueOptions("pub_name").filter(
    //                       (v) => v !== "" && v !== null && v !== undefined
    //                     ).length
    //                   }
    //                   onChange={(e) =>
    //                     setFilters((prev) => ({
    //                       ...prev,
    //                       pub_name: e.target.checked
    //                         ? [
    //                             ...getUniqueOptions("pub_name").filter(
    //                               (v) =>
    //                                 v !== "" && v !== null && v !== undefined
    //                             ),
    //                           ]
    //                         : [],
    //                     }))
    //                   }>
    //                   Select All
    //                 </Checkbox>
    //               </div>

    //               {/* Multiselect Dropdown */}
    //               <Select
    //                 mode="multiple"
    //                 allowClear
    //                 showSearch
    //                 placeholder="Filter Publisher"
    //                 style={{ width: "100%" }}
    //                 value={filters["pub_name"] || []}
    //                 onChange={(val) =>
    //                   setFilters((prev) => ({ ...prev, pub_name: val }))
    //                 }
    //                 optionLabelProp="label"
    //                 maxTagCount="responsive"
    //                 filterOption={(input, option) =>
    //                   (option?.label ?? "")
    //                     .toString()
    //                     .toLowerCase()
    //                     .includes(input.toLowerCase())
    //                 }>
    //                 {getUniqueOptions("pub_name")
    //                   .filter((v) => v !== "" && v !== null && v !== undefined)
    //                   .sort((a, b) =>
    //                     !isNaN(a) && !isNaN(b)
    //                       ? a - b
    //                       : a.toString().localeCompare(b.toString())
    //                   )
    //                   .map((val) => (
    //                     <Select.Option key={val} value={val} label={val}>
    //                       <Checkbox
    //                         checked={filters["pub_name"]?.includes(val)}>
    //                         {val}
    //                       </Checkbox>
    //                     </Select.Option>
    //                   ))}
    //               </Select>
    //             </div>
    //           )}>
    //           <FilterOutlined
    //             onClick={(e) => e.stopPropagation()} // 🛑 prevent sort when clicking filter
    //             style={{
    //               color: filters["adv_AM"] ? "#1677ff" : "#888",
    //               cursor: "pointer",
    //             }}
    //           />
    //         </Dropdown>

    //         {/* Pin Icon */}
    //         {pinnedColumns["advertiser_details"] ? (
    //           <PushpinFilled
    //             onClick={(e) => {
    //               e.stopPropagation(); // 🛑 prevent sort when pin clicked
    //               togglePin("advertiser_details");
    //             }}
    //             style={{ color: "#1677ff", cursor: "pointer" }}
    //           />
    //         ) : (
    //           <PushpinOutlined
    //             onClick={(e) => {
    //               e.stopPropagation(); // 🛑 prevent sort when pin clicked
    //               togglePin("advertiser_details");
    //             }}
    //             style={{ color: "#888", cursor: "pointer" }}
    //           />
    //         )}
    //       </div>
    //     </div>
    //   ),
    //   key: "advertiser_details",
    //   dataIndex: "advertiser_details",
    //   sorter: (a, b) => {
    //     const advA = `${a.adv_AM || ""} ${a.adv_id || ""}`.toLowerCase();
    //     const advB = `${b.adv_AM || ""} ${b.adv_id || ""}`.toLowerCase();
    //     return advA.localeCompare(advB);
    //   },
    //   sortOrder:
    //     sortInfo.columnKey === "advertiser_details" ? sortInfo.order : null,
    //   fixed: pinnedColumns["advertiser_details"] ? "left" : false,
    //   onHeaderCell: () => ({
    //     onClick: () => {
    //       let newOrder = "ascend";
    //       if (sortInfo.columnKey === "advertiser_details") {
    //         if (sortInfo.order === "ascend") newOrder = "descend";
    //         else if (sortInfo.order === "descend") newOrder = null;
    //         else newOrder = "ascend";
    //       }
    //       setSortInfo({
    //         columnKey: "advertiser_details",
    //         order: newOrder,
    //       });
    //     },
    //   }),
    //   render: (_, record) => (
    //     <div>
    //       <p>
    //         {record.adv_AM || "-"}({record.adv_id || "-"})
    //       </p>
    //     </div>
    //   ),
    // },

    // {
    //   title: (
    //     <div
    //       style={{
    //         display: "flex",
    //         justifyContent: "space-between",
    //         alignItems: "center",
    //         color:
    //           filters["pub_name"] || filters["pub_id"] ? "#1677ff" : "inherit",
    //         gap: 6,
    //       }}>
    //       <span>PUB AM(PUB ID)</span>
    //       <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    //         {/* Filter Dropdown */}
    //         <Dropdown
    //           trigger={["click"]}
    //           dropdownRender={() => (
    //             <>
    //               <div
    //                 onClick={(e) => e.stopPropagation()}
    //                 style={{
    //                   padding: 8,
    //                   backgroundColor: "white",
    //                   borderRadius: 4,
    //                   width: 260,
    //                 }}>
    //                 {/* Select All */}
    //                 <div style={{ marginBottom: 8 }}>
    //                   <Checkbox
    //                     indeterminate={
    //                       filters["pub_name"]?.length > 0 &&
    //                       filters["pub_name"]?.length <
    //                         getUniqueOptions("pub_name").filter(
    //                           (v) => v !== "" && v !== null && v !== undefined
    //                         ).length
    //                     }
    //                     checked={
    //                       filters["pub_name"]?.length ===
    //                       getUniqueOptions("pub_name").filter(
    //                         (v) => v !== "" && v !== null && v !== undefined
    //                       ).length
    //                     }
    //                     onChange={(e) =>
    //                       setFilters((prev) => ({
    //                         ...prev,
    //                         pub_name: e.target.checked
    //                           ? getUniqueOptions("pub_name").filter(
    //                               (v) =>
    //                                 v !== "" && v !== null && v !== undefined
    //                             )
    //                           : [],
    //                       }))
    //                     }>
    //                     Select All
    //                   </Checkbox>
    //                 </div>

    //                 {/* Multiselect Publisher Filter */}
    //                 <Select
    //                   mode="multiple"
    //                   allowClear
    //                   showSearch
    //                   placeholder="Filter Publisher"
    //                   style={{ width: "100%" }}
    //                   value={filters["pub_name"] || []}
    //                   onChange={(val) =>
    //                     setFilters((prev) => ({ ...prev, pub_name: val }))
    //                   }
    //                   optionLabelProp="label"
    //                   maxTagCount="responsive"
    //                   filterOption={(input, option) =>
    //                     (option?.label ?? "")
    //                       .toString()
    //                       .toLowerCase()
    //                       .includes(input.toLowerCase())
    //                   }>
    //                   {getUniqueOptions("pub_name")
    //                     .filter(
    //                       (v) => v !== "" && v !== null && v !== undefined
    //                     )
    //                     .sort((a, b) =>
    //                       !isNaN(a) && !isNaN(b)
    //                         ? a - b
    //                         : a.toString().localeCompare(b.toString())
    //                     )
    //                     .map((val) => (
    //                       <Select.Option key={val} value={val} label={val}>
    //                         <Checkbox
    //                           checked={filters["pub_name"]?.includes(val)}>
    //                           {val}
    //                         </Checkbox>
    //                       </Select.Option>
    //                     ))}
    //                 </Select>
    //               </div>
    //             </>
    //           )}>
    //           <FilterOutlined
    //             onClick={(e) => e.stopPropagation()} // 🛑 prevent header click
    //             style={{
    //               color: filters["pub_name"] ? "#1677ff" : "#888",
    //               cursor: "pointer",
    //             }}
    //           />
    //         </Dropdown>

    //         {/* Pin Icon */}
    //         {pinnedColumns["publisher_details"] ? (
    //           <PushpinFilled
    //             onClick={(e) => {
    //               e.stopPropagation(); // 🛑 prevent sort
    //               togglePin("publisher_details");
    //             }}
    //             style={{ color: "#1677ff", cursor: "pointer" }}
    //           />
    //         ) : (
    //           <PushpinOutlined
    //             onClick={(e) => {
    //               e.stopPropagation(); // 🛑 prevent sort
    //               togglePin("publisher_details");
    //             }}
    //             style={{ color: "#888", cursor: "pointer" }}
    //           />
    //         )}
    //       </div>
    //     </div>
    //   ),
    //   key: "publisher_details",
    //   dataIndex: "publisher_details",
    //   fixed: pinnedColumns["publisher_details"] ? "left" : false,
    //   sorter: (a, b) => {
    //     const pubA = `${a.pub_name || ""} ${a.pub_id || ""}`.toLowerCase();
    //     const pubB = `${b.pub_name || ""} ${b.pub_id || ""}`.toLowerCase();
    //     return pubA.localeCompare(pubB);
    //   },
    //   sortOrder:
    //     sortInfo.columnKey === "publisher_details" ? sortInfo.order : null,
    //   onHeaderCell: () => ({
    //     onClick: () => {
    //       let newOrder = "ascend";
    //       if (sortInfo.columnKey === "publisher_details") {
    //         if (sortInfo.order === "ascend") newOrder = "descend";
    //         else if (sortInfo.order === "descend") newOrder = null;
    //         else newOrder = "ascend";
    //       }
    //       setSortInfo({
    //         columnKey: "publisher_details",
    //         order: newOrder,
    //       });
    //     },
    //   }),
    //   render: (_, record) => (
    //     <div>
    //       <p>
    //         {record.pub_name || "-"}({record.pub_id || "-"})
    //       </p>
    //     </div>
    //   ),
    // },
    getColumnWithFilterAndPin("adv_AM", "ADV AM"),
    getColumnWithFilterAndPin("adv_display", "ADV ID"),
    getColumnWithFilterAndPin("pub_name", "PUB AM"),
    getColumnWithFilterAndPin("pub_display", "PUB ID"),
    getColumnWithFilterAndPin("campaign_name", "Campaign Name"),
    getColumnWithFilterAndPin("campaign_id", "Campaign ID"),
    getColumnWithFilterAndPin("geo", "Geo"),
    getColumnWithFilterAndPin("os", "OS"),
    getColumnWithFilterAndPin("category", "Category", (text, record) =>
      renderEditableCell(record, "category", text, "select-category")
    ),
    getColumnWithFilterAndPin(
      "achieved",
      "Payable Number Achieved",
      (text, record) => renderEditableCell(record, "achieved", text, "number")
    ),
    getColumnWithFilterAndPin("review", "Review", (text, record) =>
      renderEditableCell(record, "review", text, "select-review")
    ),

    getColumnWithFilterAndPin("note", "Note", (text, record) =>
      renderEditableCell(record, "note", text, "textarea")
    ),
    {
      title: "Updated At",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (text) => {
        if (!text) return "-";
        const date = new Date(text);
        return date.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      },
    },
  ];

  // 🔹 Filter out hidden columns before rendering
  const visibleColumns = allColumns.filter(
    (col) => !hiddenColumns.includes(col.key)
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        PUBID Data Table
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          placeholder="Search anything..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
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
            <Option key={key} value={key}>
              {columnHeadings[key] || key}
            </Option>
          ))}
        </Select>

        <Button icon={<ClearOutlined />} onClick={clearAllFilters}>
          Clear All Filters
        </Button>
      </div>

      <StyledTable
        columns={visibleColumns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: "max-content" }}
        bordered
        className="rounded-lg"
      />
    </div>
  );
};

export default PubIdTable;
