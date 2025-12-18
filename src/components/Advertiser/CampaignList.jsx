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
  Modal,
} from "antd";
import {
  FilterOutlined,
  PushpinOutlined,
  PushpinFilled,
  ClearOutlined,
  EyeOutlined,
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
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [selectedCampaignName, setSelectedCampaignName] = useState("");
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
  const handleViewLinks = (record) => {
    setSelectedCampaignName(record.campaign_name);
    setSelectedLinks(record.links || []); // <-- update according to your API field
    setIsLinkModalOpen(true);
  };

  const handleCloseLinks = () => {
    setIsLinkModalOpen(false);
  };

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

  const togglePin = (key) =>
    setPinnedColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const normalizeGeo = (geo) => {
    if (!geo) return [];
    console.log("Normalizing geo:", geo);
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

  // 🔥 Dynamic filter option generator
  const getUniqueOptions = (columnKey) => {
    const sourceRows =
      Object.keys(filters).length === 0 || firstFilterColumn === columnKey
        ? campaigns
        : filteredCampaigns;

    // ✅ GEO — always normalize + flatten
    if (columnKey === "geo") {
      return [...new Set(sourceRows.flatMap((r) => normalizeGeo(r.geo)))];
    }

    // ✅ All other columns
    return [...new Set(sourceRows.map((r) => r[columnKey]))].filter(Boolean);
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
        if (key === "geo") {
          const rowGeos = normalizeGeo(row.geo);
          return filters.geo.some((g) => rowGeos.includes(g));
        }
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
      ["advertiser", "advertiser_manager", "operations", "admin"].includes(r)
    )
  ) {
    editableFields.push("adv_note", "status");
  }

  if (
    roles.some((r) => ["publisher", "publisher_manager", "admin"].includes(r))
  ) {
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
  const allowedRoles = ["publisher", "publisher_manager"];
  const isPublisherRole = user?.role?.some((r) => allowedRoles.includes(r));

  // All Columns
  const allColumns = [
    getColumnWithFilterAndPin("da", "DA"),
    // Role-based ADV column
    isPublisherRole
      ? getColumnWithFilterAndPin("adv_d", "ADV ID")
      : getColumnWithFilterAndPin("adv_full", "ADV ID"),

    getColumnWithFilterAndPin("adv_am", "ADV AM"),
    getColumnWithFilterAndPin(
      "campaign_name",
      "Campaign Name",
      (text, record) => (
        <span
          style={{
            cursor: roles.some((r) =>
              [
                "advertiser",
                "advertiser_manager",
                "operations",
                "admin",
              ].includes(r)
            )
              ? "pointer"
              : "not-allowed",
          }}
          onClick={() => {
            if (
              roles.some((r) =>
                [
                  "advertiser",
                  "advertiser_manager",
                  "operations",
                  "admin",
                ].includes(r)
              )
            ) {
              navigate("/dashboard/createcampaign", { state: { record } });
            }
          }}>
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
    //     getColumnWithFilterAndPin(
    //   "postback_url",
    //   "Postback URL",
    //   getEditableCell("status").render
    // ),
    // {
    //   title: "Tracking Links",
    //   key: "links",
    //   align: "center",
    //   render: (_, record) => (
    //     <Button
    //       type="primary"
    //       ghost
    //       icon={<EyeOutlined />}
    //       onClick={() => handleViewLinks(record)}
    //       style={{
    //         borderColor: "#2F5D99",
    //         color: "#2F5D99",
    //       }}
    //       onMouseEnter={(e) => {
    //         e.currentTarget.style.backgroundColor = "#2F5D99";
    //         e.currentTarget.style.color = "white";
    //       }}
    //       onMouseLeave={(e) => {
    //         e.currentTarget.style.backgroundColor = "transparent";
    //         e.currentTarget.style.color = "#2F5D99";
    //       }}>
    //       View Links
    //     </Button>
    //   ),
    // },

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
      <Modal
        title={
          <div
            style={{
              background: "#2F5D99",
              color: "white",
              padding: "12px 0",
              borderRadius: "8px 8px 0 0",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "600",
            }}>
            Links for {selectedCampaignName}
          </div>
        }
        open={isLinkModalOpen}
        onCancel={handleCloseLinks}
        footer={[
          <Button key="close" onClick={handleCloseLinks} type="primary">
            Close
          </Button>,
        ]}
        centered
        bodyStyle={{
          maxHeight: "60vh",
          overflowY: "auto",
          backgroundColor: "#f9fafb",
          padding: "20px",
          borderRadius: "0 0 10px 10px",
        }}
        closable={false}>
        {selectedLinks?.length > 0 ? (
          <div className="flex flex-col gap-3">
            {selectedLinks.map((link, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 flex items-center justify-between">
                <div className="text-gray-800 break-all w-3/4">{link}</div>

                <Button
                  size="small"
                  onClick={() => navigator.clipboard.writeText(link)}
                  style={{
                    backgroundColor: "#2F5D99",
                    color: "white",
                    borderRadius: "6px",
                  }}>
                  Copy
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-base py-6">
            No links found for this campaign.
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CampaignList;
