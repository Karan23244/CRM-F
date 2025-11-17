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

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const CampaignList = () => {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const [campaigns, setCampaigns] = useState([]);
  const [filters, setFilters] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [editingCell, setEditingCell] = useState({ id: null, key: null });
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenCampaignColumns");
    return saved ? JSON.parse(saved) : [];
  });
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  console.log("Hidden Columns:", campaigns);
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
      const res = await axios.get(`${apiUrl}/campaigns`);
      setCampaigns(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch campaigns", "error");
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Save changes
  // const handleSave = async (record, updatedValues = {}) => {
  //   try {
  //     await axios.put(`${apiUrl}/campaigns/${record.id}`, {
  //       ...record,
  //       ...updatedValues,
  //     });

  //     Swal.fire({
  //       title: "Updated!",
  //       text: `${Object.keys(updatedValues)[0]} field updated successfully.`,
  //       icon: "success",
  //       timer: 1500,
  //       showConfirmButton: false,
  //     });

  //     setEditingCell({ id: null, key: null });
  //     fetchCampaigns();
  //   } catch (err) {
  //     console.error(err);
  //     Swal.fire("Error", "Failed to update campaign", "error");
  //   }
  // };
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

  const getUniqueOptions = (key) => [
    ...new Set(campaigns.map((c) => c[key]).filter(Boolean)),
  ];

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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Filter Dropdown */}
            <Dropdown
              trigger={["click"]}
              dropdownRender={() => (
                <div style={{ padding: 8, width: 180 }}>
                  <Select
                    showSearch
                    allowClear
                    placeholder={`Filter ${title}`}
                    value={filters[dataIndex]}
                    onChange={(val) => handleDropdownFilter(val, dataIndex)}
                    style={{ width: "100%" }}
                    options={getUniqueOptions(dataIndex).map((opt) => ({
                      label: opt,
                      value: opt,
                    }))}
                  />
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
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color:
              filters["Adv_name"] || filters["adv_d"] ? "#1677ff" : "inherit",
            gap: 6,
          }}>
          <span>Adv AM/Adv ID</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Filter Dropdown */}
            <Dropdown
              trigger={["click"]}
              dropdownRender={() => (
                <div style={{ padding: 8, width: 180 }}>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Filter Advertiser"
                    value={filters["Adv_name"]}
                    onChange={(val) => handleDropdownFilter(val, "Adv_name")}
                    style={{ width: "100%" }}
                    options={getUniqueOptions("Adv_name").map((opt) => ({
                      label: opt,
                      value: opt,
                    }))}
                  />
                </div>
              )}>
              <FilterOutlined
                onClick={(e) => e.stopPropagation()} // ✅ prevent sorting when clicking filter
                style={{
                  color: filters["Adv_name"] ? "#1677ff" : "#888",
                  cursor: "pointer",
                }}
              />
            </Dropdown>

            {/* Pin Icon */}
            {pinnedColumns["Adv AM/Adv ID"] ? (
              <PushpinFilled
                onClick={(e) => {
                  e.stopPropagation(); // ✅ prevent header sort
                  togglePin("Adv AM/Adv ID");
                }}
                style={{ color: "#1677ff", cursor: "pointer" }}
              />
            ) : (
              <PushpinOutlined
                onClick={(e) => {
                  e.stopPropagation(); // ✅ prevent header sort
                  togglePin("Adv AM/Adv ID");
                }}
                style={{ color: "#888", cursor: "pointer" }}
              />
            )}
          </div>
        </div>
      ),

      key: "Adv AM/Adv ID",
      dataIndex: "Adv AM/Adv ID",
      fixed: pinnedColumns["Adv AM/Adv ID"] ? "left" : false,

      sorter: (a, b) => {
        const advA = `${a.Adv_name || ""} ${a.adv_d || ""}`.toLowerCase();
        const advB = `${b.Adv_name || ""} ${b.adv_d || ""}`.toLowerCase();
        return advA.localeCompare(advB);
      },
      sortOrder: sortInfo.columnKey === "Adv AM/Adv ID" ? sortInfo.order : null,

      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";
          if (sortInfo.columnKey === "Adv AM/Adv ID") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend") newOrder = null;
            else newOrder = "ascend";
          }
          setSortInfo({
            columnKey: "Adv AM/Adv ID",
            order: newOrder,
          });
        },
      }),

      render: (_, record) => (
        <div>
          <p>
            {record.Adv_name || "-"} / {record.adv_d || "-"}
          </p>
        </div>
      ),
    },
    getColumnWithFilterAndPin("campaign_name", "Campaign Name"),
    getColumnWithFilterAndPin("id", "Campaign ID"),
    getColumnWithFilterAndPin("geo", "Geo"),
    getColumnWithFilterAndPin("os", "OS"),
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
          dataSource={campaigns}
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
