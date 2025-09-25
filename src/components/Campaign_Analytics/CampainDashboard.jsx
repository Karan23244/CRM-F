// Campaign Dashboard
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Zone from "./Zone";
import PidsOnAlert from "./PidAlert";
import PidStable from "./PidStable";
import {
  Select,
  Card,
  Space,
  Typography,
  Spin,
  Row,
  Col,
  DatePicker,
} from "antd";
import UploadForm from "./UploadForm";
import { useSelector } from "react-redux";
import PerformanceComparison from "./PerformanceComparison";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import Swal from "sweetalert2";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
import minMax from "dayjs/plugin/minMax";

dayjs.extend(minMax);
const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const cardStyle = {
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  border: "1px solid #f0f0f0",
};
const apiUrl = "https://gapi.clickorbits.in"; // Replace with your actual API URL

export default function OptimizationPage() {
  const user = useSelector((state) => state.auth.user);
  const [rawData, setRawData] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/campaign-metrics`);
      const validData = Array.isArray(res.data) ? res.data : [];

      setRawData(validData);
    } catch (error) {
      message.error("Failed to fetch data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const campaigns = useMemo(
    () => [...new Set(rawData.map((r) => r.campaign_name))],
    [rawData]
  );

  // Handle range selection
  // const handleDateChange = (dates) => {
  //   if (!dates || dates.length !== 2) {
  //     setSelectedDateRange([null, null]);
  //     return;
  //   }

  //   const [start, end] = dates;
  //   if (!start || !end) return;

  //   // Collect available dates for the selected campaign
  //   const allMetricsDates = new Set(
  //     rawData
  //       .filter((r) => r.campaign_name === selectedCampaign)
  //       .map((r) => dayjs(r.metrics_date).format("YYYY-MM-DD"))
  //   );

  //   let cursor = start.clone();
  //   let missing = false;
  //   while (cursor.isSameOrBefore(end, "day")) {
  //     if (!allMetricsDates.has(cursor.format("YYYY-MM-DD"))) {
  //       missing = true;
  //       break;
  //     }
  //     cursor = cursor.add(1, "day");
  //   }

  //   if (missing) {
  //     Swal.fire({
  //       icon: "warning",
  //       title: "Incomplete Data",
  //       text: "Data not available for the full selected range. Please select a correct date range.",
  //     });
  //     return;
  //   }

  //   setSelectedDateRange([start, end]);
  // };
  const availableDates = useMemo(() => {
    if (!selectedCampaign) return [];
    return rawData
      .filter((r) => r.campaign_name === selectedCampaign)
      .map((r) => {
        const cleanDateStr = r.metrics_date.split(" ")[0]; // take only date part
        return dayjs(cleanDateStr, ["YYYY-MM-DD", "DD/MM/YY"]).startOf("day");
      });
  }, [rawData, selectedCampaign]);

  const availableDateSet = useMemo(() => {
    return new Set(availableDates.map((d) => d.format("YYYY-MM-DD")));
  }, [availableDates]);

  const minDate = useMemo(
    () => (availableDates.length ? dayjs.min(availableDates) : null),
    [availableDates]
  );
  const maxDate = useMemo(
    () => (availableDates.length ? dayjs.max(availableDates) : null),
    [availableDates]
  );

  const disabledDate = (current) => {
    if (!current || !minDate || !maxDate) return true;
    // disable dates outside min/max or not in the available set
    return (
      current.isBefore(minDate, "day") ||
      current.isAfter(maxDate, "day") ||
      !availableDateSet.has(current.format("YYYY-MM-DD"))
    );
  };

  const handleDateChange = (dates) => {
    if (!dates || dates.length !== 2) {
      setSelectedDateRange([null, null]);
      return;
    }
    setSelectedDateRange(dates);
  };

  // Filter + Aggregate
  const filteredData = useMemo(() => {
    if (!selectedCampaign || !selectedDateRange[0] || !selectedDateRange[1])
      return [];

    const [selectedStart, selectedEnd] = selectedDateRange;

    const campaignData = rawData.filter((r) => {
      // 🟢 Take only the date part before any space
      const cleanDateStr = r.metrics_date.split(" ")[0];

      // Try parsing in both formats
      let mDate = dayjs(cleanDateStr, "YYYY-MM-DD", true).isValid()
        ? dayjs(cleanDateStr, "YYYY-MM-DD")
        : dayjs(cleanDateStr, "DD/MM/YY");

      return (
        r.campaign_name === selectedCampaign &&
        mDate.isSameOrAfter(selectedStart, "day") &&
        mDate.isSameOrBefore(selectedEnd, "day")
      );
    });

    // step 2: accumulate by pid
    const aggregated = campaignData.reduce((acc, curr) => {
      const key = curr.pid;
      if (!acc[key]) {
        acc[key] = { ...curr };
      } else {
        acc[key].clicks += curr.clicks || 0;
        acc[key].noi += curr.noi || 0;
        acc[key].noe += curr.noe || 0;
        acc[key].nocrm += curr.nocrm || 0;
        acc[key].pi += curr.pi || 0;
        acc[key].pe += curr.pe || 0;
        acc[key].rti += curr.rti || 0;
      }
      return acc;
    }, {});

    return Object.values(aggregated);
  }, [rawData, selectedCampaign, selectedDateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!selectedCampaign || !selectedDateRange[0] || !selectedDateRange[1]) {
      Swal.fire({
        icon: "warning",
        title: "Missing Selection",
        text: "Please select a campaign and a valid date range first.",
      });
      return;
    }

    const startDate = selectedDateRange[0].format("YYYY-MM-DD");
    const endDate = selectedDateRange[1].format("YYYY-MM-DD");
    const dateRangeStr = `${startDate} - ${endDate}`;

    Swal.fire({
      title: "Are you sure?",
      text: `Delete campaign "${selectedCampaign}" for ${dateRangeStr}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${apiUrl}/api/campaigndelete`, {
            data: {
              campaign_name: selectedCampaign,
              start_date: startDate,
              end_date: endDate,
            },
          });

          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Campaign and related events deleted successfully.",
            timer: 2000,
            showConfirmButton: false,
          });

          fetchData();
        } catch (err) {
          console.error("Error deleting campaign", err);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Failed to delete campaign.",
          });
        }
      }
    });
  };
  console.log(filteredData);
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Upload Form */}
      {user?.permissions?.can_see_input1 === 1 && (
        <Card style={cardStyle} className="mb-6">
          <UploadForm onUploadSuccess={fetchData} />
        </Card>
      )}

      {/* Header & Filters */}
      <Space direction="vertical" size="large" className="w-full pt-5">
        <Title level={3} className="!m-0 !text-gray-800">
          Optimization Dashboard
        </Title>

        <Card style={cardStyle}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <label className="block mb-1 font-medium text-gray-700">
                Select Campaign
              </label>
              <Select
                value={selectedCampaign}
                onChange={setSelectedCampaign}
                size="large"
                className="w-full"
                placeholder="Choose a campaign"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }>
                {campaigns.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={12}>
              <label className="block mb-1 font-medium text-gray-700">
                Select Date Range
              </label>
              {/* <RangePicker
                value={selectedDateRange}
                size="large"
                className="w-full"
                allowClear
                inputReadOnly
                onChange={handleDateChange}
                format="YYYY-MM-DD"
              /> */}
              <RangePicker
                value={selectedDateRange}
                size="large"
                className="w-full"
                allowClear
                inputReadOnly
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                disabledDate={disabledDate}
              />
              {minDate && maxDate && (
                <div className="mt-2 text-sm text-gray-600">
                  Available Range:{" "}
                  <span className="font-medium">
                    {minDate.format("YYYY-MM-DD")} →{" "}
                    {maxDate.format("YYYY-MM-DD")}
                  </span>
                </div>
              )}
            </Col>
          </Row>
        </Card>
      </Space>

      {user?.username === "Akshat" && (
        <div className="mt-4">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:from-red-600 hover:to-red-700 hover:scale-105 transition-all duration-200 ease-in-out">
            Delete Selected Campaign
          </button>
        </div>
      )}

      {/* Data Sections */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card style={cardStyle} className="rounded-xl shadow-md">
            <Zone
              data={filteredData}
              canEdit={user?.permissions?.can_see_button1 === 1}
              selectedDateRange={selectedDateRange}
            />
          </Card>
        </Col>

        <Col span={24}>
          <PerformanceComparison
            rawData={rawData}
            selectedCampaign={selectedCampaign}
          />
        </Col>

        <Col span={24}>
          <Card
            style={cardStyle}
            className="rounded-xl shadow-md"
            title="PIDs on Alert">
            <PidsOnAlert />
          </Card>
        </Col>

        <Col span={24}>
          <Card
            style={cardStyle}
            className="rounded-xl shadow-md"
            title="Stable PIDs">
            <PidStable />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
