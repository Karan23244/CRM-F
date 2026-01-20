// export default Listoffer;
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Card,
  Tag,
  Checkbox,
} from "antd";
import StyledTable from "../../Utils/StyledTable";
const apiUrl = import.meta.env.VITE_API_URL4;
import { useNavigate } from "react-router-dom";
const Listdeals = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [tableFilters, setTableFilters] = useState({});
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  // ---------------- FETCH CAMPAIGNS ----------------
  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/campaigns`);
      console.log("Fetched campaigns:", res.data);
      const normalized = (res.data.data || []).map((c) => ({
        ...c,
        is_active: Number(c.is_active),
      }));
      setCampaigns(normalized);
    } catch {
      Swal.fire("Error", "Failed to load campaigns", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ---------------- STATUS TOGGLE ----------------
  const toggleStatus = async (campaign) => {
    try {
      await axios.put(`${apiUrl}/api/campaigns/${campaign.id}/status`, {
        is_active: campaign.is_active === 1 ? 0 : 1,
      });
      fetchCampaigns();
    } catch {
      Swal.fire("Error", "Status update failed", "error");
    }
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Campaign?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    await axios.delete(`${apiUrl}/api/campaigns/${id}`);
    Swal.fire("Deleted", "Campaign removed", "success");
    fetchCampaigns();
  };

  // ---------------- EDIT ----------------
  const openEditModal = (campaign) => {
    setEditData(campaign);
    form.setFieldsValue(campaign);
    setOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const res = await axios.put(
        `${apiUrl}/api/campaigns/${editData.id}`,
        values,
        {
          withCredentials: true,
        }
      );
      console.log("Update response:", res);
      Swal.fire("Updated", "Campaign updated successfully", "success");
      setOpen(false);
      fetchCampaigns();
    } catch (err) {
      console.log("Update error:", err);
      Swal.fire("Error", "Update failed", "error");
    }
  };
  const STATUS_MAP = {
    1: "Active",
    0: "Inactive",
  };

  const normalize = (val, key) => {
    if (val === null || val === undefined || val === "") return "-";

    if (key === "is_active") {
      return STATUS_MAP[Number(val)];
    }

    return val.toString().trim();
  };

  const getExcelFilteredDataForColumn = (columnKey) => {
    return campaigns.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;

        return values.includes(normalize(row[key], key));
      });
    });
  };

  useEffect(() => {
    if (!campaigns.length) return;

    const valuesObj = {};
    Object.keys(campaigns[0]).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);
      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col], col))),
      ].sort((a, b) => a.localeCompare(b));
    });

    setUniqueValues(valuesObj);
  }, [campaigns, filters]);
  const finalFilteredCampaigns = campaigns.filter((row) => {
    // Global search
    if (
      searchText &&
      !Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase())
    )
      return false;

    // Excel filters
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });
  const createExcelColumn = ({ key, title }) => {
    const allValues = uniqueValues[key] || [];
    const selectedValues = filters[key] || allValues;
    const searchVal = filterSearch[key] || "";

    const visibleValues = allValues.filter((v) =>
      v.toLowerCase().includes(searchVal.toLowerCase())
    );

    const isAllSelected = selectedValues.length === allValues.length;
    const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

    return {
      title,
      dataIndex: key,
      key,

      filterDropdown: () => (
        <div className="w-[260px]" onClick={(e) => e.stopPropagation()}>
          {/* Search */}
          <div className="p-2 border-b">
            <Input
              allowClear
              placeholder="Search"
              value={searchVal}
              onChange={(e) =>
                setFilterSearch((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
            />
          </div>

          {/* Select All */}
          <div className="px-3 py-2">
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => {
                setFilters((prev) => {
                  const next = { ...prev };
                  if (e.target.checked) delete next[key];
                  else next[key] = [];
                  return next;
                });
              }}>
              Select All
            </Checkbox>
          </div>

          {/* Values */}
          <div className="max-h-[220px] overflow-y-auto px-2 pb-2">
            {visibleValues.map((val) => (
              <label
                key={val}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-blue-50">
                <Checkbox
                  checked={selectedValues.includes(val)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedValues, val]
                      : selectedValues.filter((v) => v !== val);

                    setFilters((prev) => ({
                      ...prev,
                      [key]: next,
                    }));
                  }}
                />
                <span className="truncate">{val}</span>
              </label>
            ))}
          </div>
        </div>
      ),

      filtered: !!filters[key]?.length,
    };
  };

  // ---------------- TABLE COLUMNS ----------------
  const columns = [
    {
      title: "#",
      render: (_, __, index) => index + 1,
    },
    createExcelColumn({ key: "title", title: "Title" }),
    {
      ...createExcelColumn({ key: "categories", title: "Category" }),
      render: (cat) => <Tag color="purple">{cat}</Tag>,
    },

    {
      ...createExcelColumn({ key: "payout", title: "Payout" }),
      render: (p) => <Tag color="#2F5D99">{p}</Tag>,
    },
    {
      ...createExcelColumn({ key: "is_active", title: "Status" }),
      render: (is_active, campaign) => (
        <Switch
          checked={Number(campaign.is_active) === 1}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => toggleStatus(campaign)}
          style={{
            backgroundColor:
              Number(campaign.is_active) === 1 ? "#2F5D99" : undefined,
          }}
        />
      ),
    },
    {
      title: "Actions",
      render: (campaign) => (
        <Space>
          <Button
            type="primary"
            size="small"
            className="!bg-[#2F5D99]"
            onClick={() => navigate(`/dashboard/createdeals/edit/${campaign.id}`)}>
            Edit
          </Button>
          <Button danger size="small" onClick={() => handleDelete(campaign.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card className="shadow-md rounded-xl">
      <div className="mb-4 flex justify-between items-center">
        <Input.Search
          placeholder="Search campaigns..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
        />

        <Button
          danger
          onClick={() => {
            setSearchText("");
            setFilters({});
            setFilterSearch({});
          }}>
          Remove All Filters
        </Button>
      </div>

      <StyledTable
        dataSource={finalFilteredCampaigns}
        columns={columns}
        loading={loading}
      />

      {/* ================= EDIT MODAL ================= */}
      <Modal
        open={open}
        title="Edit Campaign"
        onCancel={() => setOpen(false)}
        onOk={handleUpdate}
        okText="Save Changes">
        <Form layout="vertical" form={form}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Category"
            name="categories"
            rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Payout" name="payout" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Listdeals;
