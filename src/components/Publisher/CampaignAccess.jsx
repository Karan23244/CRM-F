import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";

import {
  Form,
  Row,
  Col,
  Select,
  Input,
  Button,
  Table,
  Space,
  Popconfirm,
  Card,
  message,
  Tag,
  Checkbox,
  Tooltip,
} from "antd";
import StyledTable from "../../Utils/StyledTable";
import { useSelector } from "react-redux";
import {
  PushpinOutlined,
  PushpinFilled,
  ClearOutlined,
} from "@ant-design/icons";

import {} from "antd";
import Swal from "sweetalert2";
const apiUrl = import.meta.env.VITE_API_URL;

const CampaignPublisherMapping = () => {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const userId = useSelector((state) => state.auth.user.id);
  const [form] = Form.useForm();

  const [campaigns, setCampaigns] = useState([]);
  const [pubAM, setPubAM] = useState([]);
  const [mappingData, setMappingData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [sortInfo, setSortInfo] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  useEffect(() => {
    fetchCampaigns();
    getPublisherAM();
    getMappings();
  }, []);
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };

  const togglePin = (key) =>
    setPinnedColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const clearAllFilters = () => {
    setFilters({});
    setPinnedColumns({});
    setFilterSearch({});
    setSortInfo({});
    message.success("Filters cleared");
  };

  const getCellValue = (row, key) => normalize(row[key]);

  const getExcelFilteredDataForColumn = (columnKey) => {
    return mappingData.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;

        return values.includes(getCellValue(row, key));
      });
    });
  };

  const updateUniqueValuesForColumn = (columnKey) => {
    const source = getExcelFilteredDataForColumn(columnKey);

    const values = [
      ...new Set(source.map((row) => getCellValue(row, columnKey))),
    ].sort((a, b) => String(a).localeCompare(String(b)));

    setUniqueValues((prev) => ({
      ...prev,
      [columnKey]: values,
    }));
  };
  //-----------------------------------------
  // Fetch Campaigns
  //-----------------------------------------

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  //-----------------------------------------
  // Fetch Publisher AM
  //-----------------------------------------

  const getPublisherAM = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-subadmin`);
      const filtered = res.data.data.filter((user) =>
        ["publisher", "pub_executive"].includes(user.role),
      );

      setPubAM(filtered);
    } catch (err) {
      console.log(err);
      message.error("Unable to fetch Publisher AM");
    }
  };

  //-----------------------------------------
  // Fetch Mapping
  //-----------------------------------------

  const getMappings = async () => {
    try {
      setTableLoading(true);
      const res = await axios.get(`${apiUrl}/campaign-publisher-map`, {
        params: {
          userid: userId,
          role: Array.isArray(role) ? role[0] : role,
        },
      });
      setMappingData(res.data.data || []);
    } catch (err) {
      console.log(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to fetch mappings",
      });
    } finally {
      setTableLoading(false);
    }
  };

  //-----------------------------------------
  // Campaign Change
  //-----------------------------------------

  const handleCampaignChange = (values) => {
    const selectedCampaigns = campaigns.filter((c) => values.includes(c.id));

    form.setFieldsValue({
      advertiser: [...new Set(selectedCampaigns.map((c) => c.adv_am))].join(
        ", ",
      ),
      da: [...new Set(selectedCampaigns.map((c) => c.da).filter(Boolean))].join(
        ", ",
      ),
    });
  };

  //-----------------------------------------
  // Submit
  //-----------------------------------------

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const selectedCampaigns = campaigns.filter((c) =>
        values.campaign.includes(c.id),
      );

      const selectedPublisher = pubAM.find(
        (user) => user.id === values.publisher_am,
      );

      const payload = {
        entries: selectedCampaigns.map((campaign) => ({
          campaign_id: campaign.id,
          campaign_name: campaign.campaign_name,
          adv_name: campaign.adv_am,
          da: campaign.da,
          pub_am: selectedPublisher.username,
          userid: selectedPublisher.id,
        })),
      };


      if (editing) {
        await axios.put(
          `${apiUrl}/campaign-publisher-map/${editing.access_id}`,
          payload,
        );

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Campaign Access Updated Successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const res = await axios.post(
          `${apiUrl}/campaign-publisher-map`,
          payload,
        );
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Campaign Access Created Successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      form.resetFields();
      setEditing(null);
      getMappings();
    } catch (err) {
      console.log(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  //-----------------------------------------
  // Edit
  //-----------------------------------------

  const handleEdit = (record) => {
    // All mappings belonging to same access_id
    const relatedMappings = mappingData.filter(
      (item) => item.access_id === record.access_id,
    );

    // Get all campaign ids
    const campaignIds = relatedMappings.map((item) => item.campaign_id);

    setEditing(record);

    form.setFieldsValue({
      campaign: campaignIds,
      advertiser: relatedMappings[0]?.adv_name,
      publisher_am: relatedMappings[0]?.userid,
    });

    // Auto fill advertiser & DA
    handleCampaignChange(campaignIds);
  };

  //-----------------------------------------
  // Delete
  //-----------------------------------------

  const handleDelete = async (accessId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${apiUrl}/campaign-publisher-map/${accessId}`);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Mapping has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });

      getMappings();
    } catch (err) {
      console.log(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Delete Failed",
      });
    }
  };
  //-----------------------------------------
  // Cancel Edit
  //-----------------------------------------

  const handleCancel = () => {
    setEditing(null);
    form.resetFields();
  };
  const selectedCampaignId = Form.useWatch("campaign", form);

  const sortedCampaigns = React.useMemo(() => {
    return [...campaigns].sort((a, b) =>
      `${a.campaign_name}`.localeCompare(`${b.campaign_name}`),
    );
  }, [campaigns]);
  //-----------------------------------------
  // Table Columns
  //-----------------------------------------
  const getColumnWithFilterAndPin = (dataIndex, title, renderFn) => {
    const isPinned = pinnedColumns[dataIndex];

    const isFiltered =
      filters[dataIndex] &&
      filters[dataIndex].length !== (uniqueValues[dataIndex] || []).length;

    return {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: isFiltered ? "#1677ff" : "inherit",
          }}>
          <span>{title}</span>

          {isPinned ? (
            <PushpinFilled
              style={{ color: "#1677ff" }}
              onClick={(e) => {
                e.stopPropagation();
                togglePin(dataIndex);
              }}
            />
          ) : (
            <PushpinOutlined
              onClick={(e) => {
                e.stopPropagation();
                togglePin(dataIndex);
              }}
            />
          )}
        </div>
      ),

      dataIndex,
      key: dataIndex,

      fixed: isPinned ? "left" : false,

      sorter: true,

      sortOrder: sortInfo.columnKey === dataIndex ? sortInfo.order : null,

      onHeaderCell: () => ({
        onClick: () => {
          setSortInfo((prev) => {
            if (prev.columnKey !== dataIndex) {
              return {
                columnKey: dataIndex,
                order: "ascend",
              };
            }

            if (prev.order === "ascend") {
              return {
                columnKey: dataIndex,
                order: "descend",
              };
            }

            return {};
          });
        },
      }),

      filterDropdown: () => {
        const allValues = uniqueValues[dataIndex] || [];

        const selectedValues =
          filters[dataIndex] === undefined ? allValues : filters[dataIndex];

        const searchText = filterSearch[dataIndex] || "";

        const visibleValues = allValues.filter((v) =>
          v.toLowerCase().includes(searchText.toLowerCase()),
        );

        const isAllSelected = selectedValues.length === allValues.length;

        const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

        return (
          <div style={{ width: 250 }}>
            <div style={{ padding: 8 }}>
              <Input
                allowClear
                placeholder="Search"
                value={searchText}
                onChange={(e) =>
                  setFilterSearch((prev) => ({
                    ...prev,
                    [dataIndex]: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ padding: "0 8px" }}>
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

            <div
              style={{
                maxHeight: 220,
                overflow: "auto",
                padding: 8,
              }}>
              {visibleValues.map((val) => (
                <div key={val}>
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
                    }}>
                    {val}
                  </Checkbox>
                </div>
              ))}
            </div>
          </div>
        );
      },

      onFilterDropdownOpenChange: (open) => {
        if (open) updateUniqueValuesForColumn(dataIndex);
      },

      render: renderFn
        ? (text, record) => renderFn(text, record)
        : (text) => normalize(text),
    };
  };
  const filteredData = React.useMemo(() => {
    let result = mappingData.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (!values || values.length === 0) return true;

        return values.includes(getCellValue(row, key));
      });
    });

    if (sortInfo.columnKey && sortInfo.order) {
      result = [...result].sort((a, b) => {
        const valA = getCellValue(a, sortInfo.columnKey);
        const valB = getCellValue(b, sortInfo.columnKey);

        const comparison =
          !isNaN(valA) && !isNaN(valB)
            ? Number(valA) - Number(valB)
            : String(valA).localeCompare(String(valB));

        return sortInfo.order === "ascend" ? comparison : -comparison;
      });
    }

    return result;
  }, [mappingData, filters, sortInfo]);
  const columns = [
    getColumnWithFilterAndPin("campaign_name", "Campaign"),

    getColumnWithFilterAndPin("adv_name", "Advertiser"),

    getColumnWithFilterAndPin("pub_am", "Publisher AM"),

    {
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record.access_id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Campaign Publisher Mapping">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="campaign"
              label="Campaign"
              rules={[
                {
                  required: true,
                  message: "Please select campaign(s)",
                },
              ]}>
              <Select
                mode="multiple"
                showSearch
                allowClear
                size="large"
                placeholder="Search campaign..."
                optionFilterProp="label"
                onChange={handleCampaignChange}
                maxTagCount="responsive"
                options={sortedCampaigns.map((c) => ({
                  value: c.id,
                  label: `${c.campaign_name} (${c.id})`,
                  campaign: c,
                }))}
                optionRender={(option) => {
                  const c = option.data.campaign;

                  return (
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-semibold">
                          {c.campaign_name} ({c.id})
                        </div>

                        <div className="text-xs text-gray-400">ID: {c.id}</div>
                      </div>

                      <div className="flex gap-2">
                        <Tag color="blue">{c.os}</Tag>

                        {c.da && <Tag color="purple">{c.da}</Tag>}
                      </div>
                    </div>
                  );
                }}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="advertiser" label="Advertiser">
              <Input disabled />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="publisher_am"
              label="Publisher AM"
              rules={[
                {
                  required: true,
                  message: "Select Publisher AM",
                },
              ]}>
              <Select
                showSearch
                placeholder="Select Publisher AM"
                optionFilterProp="label"
                options={pubAM.map((user) => ({
                  value: user.id,
                  label: user.username, // Show username
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editing ? "Update" : "Save"}
          </Button>

          {editing && <Button onClick={handleCancel}>Cancel</Button>}
        </Space>
      </Form>
      <Button
        icon={<ClearOutlined />}
        onClick={clearAllFilters}
        style={{ marginTop: 20, marginBottom: 10 }}>
        Clear Filters
      </Button>
      <StyledTable
        style={{ marginTop: 10 }}
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={tableLoading}
      />
    </Card>
  );
};

export default CampaignPublisherMapping;
