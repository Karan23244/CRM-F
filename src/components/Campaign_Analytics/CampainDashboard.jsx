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
const { Title } = Typography;
const { Option } = Select;
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
      const res = await fetch(`${apiUrl}/api/campaign-metrics`);
      const json = await res.json();
      setRawData(json);

      const campaigns = [...new Set(json.map((r) => r.campaign_name))];
      if (campaigns.length) {
        setSelectedCampaign(campaigns[0]);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };
  // When campaign changes, preselect start as 1st of that month
  useEffect(() => {
    fetchData();
  }, []);

  const campaigns = useMemo(
    () => [...new Set(rawData.map((r) => r.campaign_name))],
    [rawData]
  );
  // Date ranges only for the selected campaign
  const parsedRanges = useMemo(() => {
    return rawData
      .filter((r) => r.campaign_name === selectedCampaign)
      .map((r) => {
        const [start, end] = r.date_range.split(" - ");
        return {
          start: dayjs(start, "YYYY-MM-DD"),
          end: dayjs(end, "YYYY-MM-DD"),
        };
      });
  }, [rawData, selectedCampaign]);

  // Collect all available end dates (unchanged)
  const availableEndDates = useMemo(
    () => parsedRanges.map((r) => r.end),
    [parsedRanges]
  );

  // For fast lookup in disabledDate
  const allowedEndSet = useMemo(
    () => new Set(availableEndDates.map((d) => d.format("YYYY-MM-DD"))),
    [availableEndDates]
  );
  // helper: is the clicked day an allowed end date?
  const isAllowedEnd = (d) => d && allowedEndSet.has(d.format("YYYY-MM-DD"));

  useEffect(() => {
    if (!availableEndDates.length) return;

    const latestEnd = availableEndDates.reduce(
      (a, b) => (b.isAfter(a) ? b : a),
      availableEndDates[0]
    );

    // Use latestEnd to calculate the first day of its month
    const start = latestEnd.clone().startOf("month").date(1);

    setSelectedDateRange([start, latestEnd]);
  }, [availableEndDates]);

  const filteredData = useMemo(() => {
    if (!selectedDateRange[0] || !selectedDateRange[1]) return [];

    const [selectedStart, selectedEnd] = selectedDateRange;

    return rawData.filter((r) => {
      const [start, end] = r.date_range.split(" - ");
      const startDate = dayjs(start, "YYYY-MM-DD");
      const endDate = dayjs(end, "YYYY-MM-DD");

      // Strict match: campaign AND exact date range
      const inCampaign = r.campaign_name === selectedCampaign;
      const exactRange =
        startDate.isSame(selectedStart, "day") &&
        endDate.isSame(selectedEnd, "day");

      return inCampaign && exactRange;
    });
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
        text: "Please select campaign and date range first.",
      });
      return;
    }

    const dateRangeStr = `${selectedDateRange[0].format(
      "YYYY-MM-DD"
    )} - ${selectedDateRange[1].format("YYYY-MM-DD")}`;

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
              date_range: dateRangeStr,
            },
          });

          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Campaign deleted successfully.",
            timer: 2000,
            showConfirmButton: false,
          });

          fetchData(); // refresh after delete
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
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Upload Form */}
      {/* Show UploadForm only if user has permission */}
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
                allowClear>
                {campaigns.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={12}>
              <label className="block mb-1 font-medium text-gray-700">
                Select Date (end date only)
              </label>
              <DatePicker
                value={selectedDateRange[1]}
                size="large"
                className="w-full"
                allowClear={false}
                inputReadOnly
                // use onChange (more reliable in antd DatePicker than onSelect)
                onChange={(date) => {
                  if (!date) return;
                  // ignore clicks on disallowed days (shouldn't happen, but safe)
                  if (!isAllowedEnd(date)) return;

                  // always snap start to the 1st of the selected date's month
                  const start = date.clone().startOf("month");
                  setSelectedDateRange([start, date]);
                }}
                disabledDate={(current) => {
                  if (!current) return true;

                  // don't allow picking the 1st directly
                  if (current.date() === 1) return true;

                  // only allow dates that appear in your available end-date set
                  return !isAllowedEnd(current);
                }}
              />
              {selectedDateRange[0] && selectedDateRange[1] && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected Range:{" "}
                  <span className="font-medium">
                    {selectedDateRange[0].format("YYYY-MM-DD")} →{" "}
                    {selectedDateRange[1].format("YYYY-MM-DD")}
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
            />
          </Card>
        </Col>

        <Col span={24}>
          <PerformanceComparison
            rawData={rawData}
            selectedCampaign={selectedCampaign}
          />
        </Col>
        {/* Each card in its own row */}
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
