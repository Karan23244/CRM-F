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
import { sortDropdownValues } from "../../Utils/sortDropdownValues";
import { useSelector } from "react-redux";
const { TextArea } = Input;
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const PubIdTable = () => {
  const roles = useSelector((state) => state.auth.user?.role || []);

  const [data, setData] = useState([]);
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [firstFilterColumn, setFirstFilterColumn] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenPublisherColumns");
    return saved ? JSON.parse(saved) : [];
  });
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  const isPublisher =
    roles.includes("publisher") || roles.includes("publisher_manager");

  const isAdvertiser =
    roles.includes("advertiser") || roles.includes("advertiser_manager");

  const isAdmin = roles.includes("admin");
  console.log(isAdmin);
  const advColumnKey = isAdmin || isAdvertiser ? "adv_display" : "adv_id";
  const pubColumnKey = isAdmin || isPublisher ? "pub_display" : "pub_id";

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
    adv_display: "ADV ID",
    pub_display: "PUB ID",
    adv_id: "ADV ID",
    pub_id: "PUB ID",
    category: "Category",
    geo: "Geo",
    os: "OS",
    review: "Review",
    achieved: "Achieved",
    note: "Note",
    updated_at: "Updated At",
  };
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
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
  const getExcelFilteredDataForColumn = (columnKey) => {
    return data.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true; // ignore self
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      });
    });
  };
  const normalizeGeo = (geo) => {
    if (!geo) return [];
    let value = geo;

    // 1️⃣ Keep parsing JSON strings until it’s not a string anymore
    while (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        // "US,IN" case
        return value
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean);
      }
    }

    // 2️⃣ Recursively flatten until only strings remain
    const flattenDeep = (arr) =>
      Array.isArray(arr) ? arr.flatMap(flattenDeep) : [arr];

    const flattened = flattenDeep(value);

    // 3️⃣ Return clean country codes only
    return flattened.map((v) => String(v).trim()).filter(Boolean);
  };
  useEffect(() => {
    const valuesObj = {};

    Object.keys(columnHeadings).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);

      // ✅ SPECIAL CASE FOR GEO
      if (col === "geo") {
        const allGeos = source.flatMap((row) => normalizeGeo(row.geo));
        valuesObj[col] = sortDropdownValues([...new Set(allGeos)]);
      } else {
        valuesObj[col] = sortDropdownValues([
          ...new Set(source.map((row) => normalize(row[col]))),
        ]);
      }
    });

    setUniqueValues(valuesObj);
  }, [data, filters]); // ✅ filters added

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
      filterDropdown: () => {
        const allValues = uniqueValues[dataIndex] || [];
        const selectedValues = filters[dataIndex] ?? allValues;
        const searchText = filterSearch[dataIndex] || "";

        const visibleValues = allValues.filter((val) =>
          val.toString().toLowerCase().includes(searchText.toLowerCase())
        );

        const isAllSelected = selectedValues.length === allValues.length;
        const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

        return (
          <div
            className="w-[260px] rounded-xl"
            onClick={(e) => e.stopPropagation()}>
            {/* 🔍 Search */}
            <div className="sticky top-0 bg-white p-2 border-b">
              <Input
                allowClear
                placeholder="Search values"
                value={searchText}
                onChange={(e) =>
                  setFilterSearch((prev) => ({
                    ...prev,
                    [dataIndex]: e.target.value,
                  }))
                }
              />
            </div>

            {/* ☑ Select All */}
            <div className="px-3 py-2">
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFilters((prev) => {
                    const updated = { ...prev };
                    if (checked) delete updated[dataIndex];
                    else updated[dataIndex] = [];
                    return updated;
                  });
                }}>
                Select All
              </Checkbox>
            </div>

            {/* 📋 Values */}
            <div className="max-h-[220px] overflow-y-auto px-2 pb-2 space-y-1">
              {visibleValues.map((val) => (
                <label
                  key={val}
                  className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-blue-50">
                  <Checkbox
                    checked={selectedValues.includes(val)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedValues, val]
                        : selectedValues.filter((v) => v !== val);

                      setFilters((prev) => ({
                        ...prev,
                        [dataIndex]: next,
                      }));
                    }}
                  />
                  <span className="truncate">{val}</span>
                </label>
              ))}

              {visibleValues.length === 0 && (
                <div className="py-4 text-center text-gray-400 text-sm">
                  No matching values
                </div>
              )}
            </div>
          </div>
        );
      },
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
    // 🔍 Global search
    const matchesSearch = Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase());

    if (!matchesSearch) return false;

    // 🎯 Excel-style filters
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
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
    getColumnWithFilterAndPin("adv_AM", "ADV AM"),
    getColumnWithFilterAndPin(advColumnKey, "ADV ID"),
    getColumnWithFilterAndPin("pub_name", "PUB AM"),
    getColumnWithFilterAndPin(pubColumnKey, "PUB ID"),
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
