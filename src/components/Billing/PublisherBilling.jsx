import { Table, Spin, message, DatePicker } from "antd";
import { useEffect, useState } from "react";
import { fetchBilling } from "../../Utils/billingApi";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import StyledTable from "../../Utils/StyledTable";

export default function PublisherBillingTable() {
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
      const res = await fetchBilling("publisher", {
        user_id: user.id,
        role: user.role,
        assigned_subadmins: user.assigned_subadmins,
        month: selectedMonth, // 👈 send month
      });
      console.log("Billing data response:", res); // ✅ log response
      setData(res.data || []);
    } catch (e) {
      message.error("Failed to load publisher billing");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { title: "Month", dataIndex: "month", align: "center" },
    { title: "Publisher ID", dataIndex: "pub_id", align: "center" },
    { title: "Campaign", dataIndex: "campaign_name", align: "center" },
    { title: "Geo", dataIndex: "geo", align: "center" },
    { title: "OS", dataIndex: "os", align: "center" },
    {
      title: "Payout",
      dataIndex: "pub_payout",
      align: "center",
      render: (v) => v ?? "-",
    },
    { title: "Approved", dataIndex: "pub_apno", align: "center" },
  ];

  return (
    <Spin spinning={loading}>
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Publisher Billing
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
            pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          className="custom-table"
        />
      </div>
    </Spin>
  );
}
