import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Tag,
  Space,
  Card,
  Checkbox,
} from "antd";
import StyledTable from "../../Utils/StyledTable";
import { useNavigate } from "react-router-dom";
const apiUrl = import.meta.env.VITE_API_URL4;

const Listoffer = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  console.log(deals);
  const STATUS_MAP = {
    1: "Active",
    0: "Inactive",
  };

  const normalize = (val, key) => {
    if (val === null || val === undefined || val === "") return "-";

    if (key === "status") {
      return STATUS_MAP[Number(val)];
    }

    return val.toString().trim();
  };
  const getExcelFilteredDataForColumn = (columnKey) => {
    return deals.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;

        return values.includes(normalize(row[key], key));
      });
    });
  };
  useEffect(() => {
    if (!deals.length) return;

    const valuesObj = {};
    Object.keys(deals[0]).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);
      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col], col))),
      ].sort((a, b) => a.localeCompare(b));
    });

    setUniqueValues(valuesObj);
  }, [deals, filters]);
  const finalFilteredDeals = deals.filter((row) => {
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
      return values.includes(normalize(row[key], key));
    });
  });

  // ---------------- FETCH DEALS ----------------
  const fetchDeals = async () => {
    try {
      const res = await axios.get("https://api.steptosale.com/api/deals/", {
        withCredentials: true,
      });
      console.log(res);
      const normalized = (res.data.data || []).map((d) => ({
        ...d,
        status: Number(d.status),
      }));
      setDeals(normalized);
    } catch {
      Swal.fire("Error", "Failed to load deals", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // ---------------- STATUS TOGGLE ----------------
  const toggleStatus = async (deal) => {
    try {
      const res = await axios.put(`${apiUrl}/api/deals/${deal.id}/status/`, {
        withCredentials: true,
        status: deal.status === 1 ? 0 : 1,
      });
      console.log(res);
      fetchDeals();
    } catch {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Deal?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${apiUrl}/api/deals/${id}/`, {
        withCredentials: true,
      });
      Swal.fire("Deleted", "Deal deleted successfully", "success");
      fetchDeals();
    } catch {
      Swal.fire("Error", "Failed to delete deal", "error");
    }
  };

  // ---------------- EDIT ----------------
  const openEditModal = (deal) => {
    setEditDeal(deal);
    form.setFieldsValue(deal);
    setOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`${apiUrl}/api/deals/${editDeal.id}`, values);
      Swal.fire("Updated", "Deal updated successfully", "success");
      setOpen(false);
      fetchDeals();
    } catch {
      Swal.fire("Error", "Failed to update deal", "error");
    }
  };
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

    createExcelColumn({ key: "offer", title: "Offer" }),
    {
      ...createExcelColumn({ key: "discount_payout", title: "Payout" }),
      render: (_, d) => (
        <Tag color="#2F5D99">
          {d.discount_payout} {d.currency}
        </Tag>
      ),
    },
    {
      ...createExcelColumn({ key: "status", title: "Status" }),
      render: (status, deal) => (
        <Switch
          checked={deal.status === 1}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => toggleStatus(deal)}
          style={{
            backgroundColor: Number(deal.status) === 1 ? "#2F5D99" : undefined,
          }}
        />
      ),
    },
    {
      title: "Actions",
      render: (deal) => (
        <Space>
          <Button
            type="primary"
            size="small"
            className="!bg-[#2F5D99]"
            onClick={() => navigate(`/dashboard/createoffer/edit/${deal.id}`)}>
            Edit
          </Button>

          <Button danger size="small" onClick={() => handleDelete(deal.id)}>
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
          placeholder="Search deals..."
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
        dataSource={finalFilteredDeals}
        columns={columns}
        loading={loading}
      />

      {/* ================= EDIT MODAL ================= */}
      <Modal
        open={open}
        title="Edit Deal"
        onCancel={() => setOpen(false)}
        onOk={handleUpdate}
        okText="Save Changes">
        <Form layout="vertical" form={form}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Offer" name="offer" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Discount Payout"
            name="discount_payout"
            rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Geo" name="geo">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Listoffer;
