import React, { useEffect, useState } from "react";
import { Table, InputNumber, Input, Card, Select, Dropdown } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import {
  FilterOutlined,
  PushpinOutlined,
  PushpinFilled,
} from "@ant-design/icons";

const apiUrl =
  import.meta.env.VITE_API_URL;

function PublisherCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [filters, setFilters] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [editingCell, setEditingCell] = useState({
    id: null,
    key: null,
  });

  // 🔹 Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${apiUrl}/campaigns`);
      setCampaigns(res.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to fetch campaigns", "error");
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // 🔹 Auto-save handler with merge to retain old data
  const handleSave = async (record, updatedValues = {}) => {
    const updatedData = { ...record, ...updatedValues };

    try {
      await axios.put(`${apiUrl}/campaigns/${record.id}`, updatedData);
      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Campaign updated successfully",
        timer: 1000,
        showConfirmButton: false,
      });
      setEditingCell({ id: null, key: null });
      fetchCampaigns();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to update campaign", "error");
    }
  };

  // 🔹 Filter handling
  const handleDropdownFilter = (value, dataIndex) => {
    setFilters((prev) => ({ ...prev, [dataIndex]: value }));
  };

  // 🔹 Get unique dropdown options
  const getUniqueOptions = (key) => {
    const values = campaigns
      .map((item) => item[key])
      .filter((v) => v !== undefined && v !== null);
    return [...new Set(values)];
  };

  // 🔹 Pin/unpin column
  const togglePin = (key) => {
    setPinnedColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 🔹 Column generator with filter + pin
  const getColumnWithFilterAndPin = (dataIndex, label, renderFn) => {
    const options = getUniqueOptions(dataIndex);
    return {
      title: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: filters[dataIndex] ? "#1677ff" : "inherit",
            gap: 6,
          }}>
          <span>{label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Filter Dropdown */}
            <Dropdown
              trigger={["click"]}
              dropdownRender={() => (
                <div style={{ padding: 8, width: 180 }}>
                  <Select
                    showSearch
                    allowClear
                    placeholder={`Filter ${label}`}
                    value={filters[dataIndex]}
                    onChange={(value) => handleDropdownFilter(value, dataIndex)}
                    style={{ width: "100%" }}
                    options={options.map((opt) => ({
                      label: opt,
                      value: opt,
                    }))}
                  />
                </div>
              )}>
              <FilterOutlined
                style={{
                  color: filters[dataIndex] ? "#1677ff" : "#888",
                  cursor: "pointer",
                }}
              />
            </Dropdown>

            {/* Pin icon */}
            {pinnedColumns[dataIndex] ? (
              <PushpinFilled
                style={{ color: "#1677ff", cursor: "pointer" }}
                onClick={() => togglePin(dataIndex)}
              />
            ) : (
              <PushpinOutlined
                style={{ color: "#888", cursor: "pointer" }}
                onClick={() => togglePin(dataIndex)}
              />
            )}
          </div>
        </div>
      ),
      dataIndex,
      key: dataIndex,
      filteredValue: filters[dataIndex] ? [filters[dataIndex]] : null,
      onFilter: (value, record) =>
        record[dataIndex]?.toString().toLowerCase() ===
        value?.toString().toLowerCase(),
      fixed: pinnedColumns[dataIndex] ? "left" : false,
      render: renderFn || ((text) => text || "-"),
    };
  };

  // 🔹 Editable cell renderer (text → input on click)
  const getEditableCell = (field, inputType = "text") => ({
    render: (_, record) => {
      const isEditing =
        editingCell.id === record.id && editingCell.key === field;

      if (isEditing) {
        if (inputType === "number") {
          return (
            <InputNumber
              min={0}
              defaultValue={record[field]}
              autoFocus
              onBlur={(e) =>
                handleSave(record, {
                  [field]: Number(e.target.value),
                })
              }
            />
          );
        }
        return (
          <Input
            defaultValue={record[field]}
            autoFocus
            onBlur={(e) => handleSave(record, { [field]: e.target.value })}
          />
        );
      }

      return (
        <div
          onClick={() => setEditingCell({ id: record.id, key: field })}
          style={{ cursor: "pointer" }}>
          {record[field] || "-"}
        </div>
      );
    },
  });

  // 🔹 Columns setup
  const columns = [
    getColumnWithFilterAndPin("id", "Campaign ID"),
    getColumnWithFilterAndPin("Adv_name", "Advertiser"),
    getColumnWithFilterAndPin("adv_d", "Advertiser ID"),
    getColumnWithFilterAndPin("campaign_name", "Campaign Name"),
    getColumnWithFilterAndPin("Vertical", "Vertical"),
    getColumnWithFilterAndPin("geo", "Geo"),
    getColumnWithFilterAndPin("payable_event", "Payable Event"),
    getColumnWithFilterAndPin("os", "OS"),
    getColumnWithFilterAndPin("pid", "PID"),
    getColumnWithFilterAndPin("kpi", "KPI"),
    getColumnWithFilterAndPin("adv_payout", "Adv Payout"),

    // ✅ Editable columns (click to edit)
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

    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (val) => (val ? dayjs(val).format("YYYY-MM-DD HH:mm") : "-"),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title="Campaigns Data"
        className="shadow-md rounded-2xl border border-gray-200">
        <div style={{ overflowX: "auto" }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={campaigns}
            bordered
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>
    </div>
  );
}

export default PublisherCampaigns;
