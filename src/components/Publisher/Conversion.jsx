import React, { useEffect, useState } from "react";
import { Select, DatePicker, Spin } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const apiUrl = import.meta.env.VITE_API_URL;

const OPTIONAL_FIELDS = [
  { key: "p1", label: "P1" },
  { key: "p2", label: "P2" },
  { key: "p3", label: "P3" },
  { key: "p4", label: "P4" },
  { key: "p5", label: "P5" },
  { key: "total_payout", label: "Payout" },
];

const Conversion = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [visibleOptionalFields, setVisibleOptionalFields] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const fetchConversions = async (startDate, endDate) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/get-conversions?startDate=${startDate}&endDate=${endDate}`,
      );
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error("Failed to fetch conversions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dateRange?.length) return;
    fetchConversions(
      dateRange[0].format("YYYY-MM-DD"),
      dateRange[1].format("YYYY-MM-DD"),
    );
  }, [dateRange]);

  const campaignOptions = data.map((item) => ({
    value: item.campaign_id,
    label: `${item.campaign_name} (ID: ${item.campaign_id})`,
  }));

  const displayedData = selectedCampaign
    ? data.filter((item) => item.campaign_id === selectedCampaign)
    : data;

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="py-5">
        <h2 className="text-2xl font-semibold">Conversions</h2>
        <p className="text-gray-600">
          View and manage conversion data for publishers and campaigns.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:flex-wrap gap-3 mb-6 w-full">
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (!dates) return;
            setDateRange(dates);
          }}
          allowClear={false}
          style={{ width: 260 }}
        />

        <Select
          allowClear
          placeholder="Select Campaign"
          value={selectedCampaign}
          onChange={(val) => setSelectedCampaign(val ?? null)}
          options={campaignOptions}
          style={{ width: 260 }}
        />

        <Select
          mode="multiple"
          allowClear
          placeholder="Show optional fields..."
          value={visibleOptionalFields}
          onChange={setVisibleOptionalFields}
          style={{ minWidth: 220 }}
          maxTagCount="responsive">
          {OPTIONAL_FIELDS.map(({ key, label }) => (
            <Select.Option key={key} value={key}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      ) : !selectedCampaign ? (
        <div className="text-center py-16 text-gray-400">
          Select a campaign above to view its conversion data.
        </div>
      ) : displayedData.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No conversion data found for this campaign.
        </div>
      ) : (
        (() => {
          const item = displayedData[0];
          const totalEvents =
            item.event_data?.reduce((sum, e) => sum + e.count, 0) ?? 0;

          return (
            <div className="border border-gray-200 rounded-xl p-6 shadow-sm bg-white w-full">
              {/* Header */}
              <div className="mb-5">
                <span className="text-xs text-gray-400 font-medium">
                  Campaign #{item.campaign_id}
                </span>
                <h3 className="text-2xl font-semibold text-gray-800 mt-0.5">
                  {item.campaign_name}
                </h3>
              </div>

              {/* Total Clicks */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 mb-5">
                <span className="text-sm text-gray-500">Total Clicks</span>
                <span className="font-semibold text-gray-800 text-base">
                  {item.total_clicks}
                </span>
              </div>

              {/* Optional Fields */}
              {visibleOptionalFields.length > 0 && (
                <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {visibleOptionalFields.map((field) => {
                    const label = OPTIONAL_FIELDS.find(
                      (f) => f.key === field,
                    )?.label;
                    const value = item[field];
                    return (
                      <div
                        key={field}
                        className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col">
                        <span className="text-xs text-gray-400 mb-0.5">
                          {label}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {value !== null && value !== undefined ? value : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Events */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
                  Events
                </p>
                {item.event_data?.length ? (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                    {item.event_data.map((ev) => (
                      <div
                        key={ev.event}
                        className="flex justify-between items-center px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                        <span className="capitalize text-gray-700 text-sm font-medium">
                          {ev.event}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {ev.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No events recorded</p>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">Total Events</span>
                  <p className="text-xl font-bold text-gray-800">{totalEvents}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Conversion Rate</span>
                  <p className="text-xl font-bold text-blue-600">
                    {item.conversion_rate}%
                  </p>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default Conversion;
