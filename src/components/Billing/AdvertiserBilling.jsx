import { Table, Spin, message, Select } from "antd";
import { useEffect, useState } from "react";
import { fetchBilling } from "../../Utils/billingApi";
import { useSelector } from "react-redux";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import StyledTable from "../../Utils/StyledTable";
const { Option } = Select;

export default function AdvertiserBillingTable() {
  const user = useSelector((state) => state.auth?.user);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    dayjs().format("YYYY-MM"), // ✅ default current month
  );

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchBilling("advertiser", {
        user_id: user.id,
        role: user.role,
        assigned_subadmins: user.assigned_subadmins,
        month: selectedMonth,
      });

      setData(res.data || []);
    } catch (e) {
      message.error("Failed to load advertiser billing");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { title: "Month", dataIndex: "month", align: "center" },
    { title: "Advertiser ID", dataIndex: "adv_id", align: "center" },
    { title: "Campaign", dataIndex: "campaign_name", align: "center" },
    { title: "Geo", dataIndex: "geo", align: "center" },
    { title: "OS", dataIndex: "os", align: "center" },
    {
      title: "Payout",
      dataIndex: "adv_payout",
      align: "center",
      render: (v) => v ?? "-",
    },
    { title: "Approved", dataIndex: "approved_no", align: "center" },
  ];

  return (
    <Spin spinning={loading}>
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Advertiser Billing
        </h2>

        {/* ✅ Month Picker */}
        <div className="mb-4">
          <DatePicker
            picker="month"
            format="YYYY-MM"
            allowClear={false}
            value={dayjs(selectedMonth, "YYYY-MM")}
            disabledDate={(current) =>
              current && current > dayjs().endOf("month")
            }
            onChange={(date, dateString) => {
              setSelectedMonth(dateString);
            }}
          />
        </div>

        <StyledTable
          rowKey="id"
          columns={columns}
          dataSource={data}
          bordered
          tableLayout="fixed"
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
          }}
        />
      </div>
    </Spin>
  );
}
