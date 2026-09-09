import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Spin, InputNumber } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API = import.meta.env.VITE_API_URL2;
// ─────────────────────────────────────────────────────────────
// Custom tooltip
// ─────────────────────────────────────────────────────────────
const CTITooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  /*
   * Every Recharts series points to the same original row.
   * Grab it from first payload item.
   */
  const row = payload[0]?.payload || {};

  const formatPercent = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    return `${Number(value).toFixed(2)}%`;
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d9d9d9",
        borderRadius: 8,
        padding: "10px 12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        minWidth: 190,
      }}>
      <div
        style={{
          fontWeight: 700,
          marginBottom: 8,
        }}>
        {dayjs(label).isValid() ? dayjs(label).format("DD MMM YYYY") : label}
      </div>

      <div style={{ marginBottom: 4 }}>
        <strong>Total Clicks:</strong>{" "}
        {Number(row.clicks || 0).toLocaleString()}
      </div>

      <div style={{ marginBottom: 4 }}>
        <strong>Total Installs:</strong>{" "}
        {Number(row.installs || 0).toLocaleString()}
      </div>

      <div style={{ marginBottom: 4 }}>
        <strong>CTI:</strong> {formatPercent(row.daily_cti)}
        {row.daily_cti_capped && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 11,
              color: "#fa8c16",
            }}>
            (above chart max)
          </span>
        )}
      </div>

      <div>
        <strong>28 Day Moving CTI:</strong> {formatPercent(row.moving_cti_28)}
        {row.moving_cti_28_capped && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 11,
              color: "#fa8c16",
            }}>
            (above chart max)
          </span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

const CTITrendChart = ({ configId, startDate, endDate, geo = [] }) => {
  const [loading, setLoading] = useState(false);

  const [chartData, setChartData] = useState([]);
  const [limits, setLimits] = useState({
    upper: null,
    lower: null,
  });

  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const [yAxisMax, setYAxisMax] = useState(0.16);
  const [yAxisStep, setYAxisStep] = useState(0.02);
  // Stable GEO dependency
  const geoKey = useMemo(
    () => JSON.stringify(Array.isArray(geo) ? geo : []),
    [geo],
  );

  // ─────────────────────────────────────────────────────────
  // Fetch graph data
  // ─────────────────────────────────────────────────────────

  const fetchCTITrend = async () => {
    if (!configId || !startDate || !endDate) {
      setChartData([]);
      setLimits({
        upper: null,
        lower: null,
      });
      setMeta(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const requestPayload = {
        config_id: configId,
        start_date: startDate,
        end_date: endDate,
        geo: Array.isArray(geo) ? geo : [],
      };

      console.log("CTI Trend Request:", requestPayload);

      const response = await axios.post(
        `${API}/api/campaign-cti-trend`,
        requestPayload,
      );

      console.log("CTI Trend Response:", response.data);

      const result = response.data?.data;

      const series = Array.isArray(result?.series) ? result.series : [];

      setChartData(series);

      setLimits({
        upper:
          result?.limits?.upper !== null && result?.limits?.upper !== undefined
            ? Number(result.limits.upper)
            : null,

        lower:
          result?.limits?.lower !== null && result?.limits?.lower !== undefined
            ? Number(result.limits.lower)
            : null,
      });

      setMeta({
        campaign_name: result?.campaign_name,
        campaign_ids: result?.campaign_ids || [],
        os: result?.os,
      });
    } catch (err) {
      console.error("CTI Trend API Error:", err);

      setChartData([]);
      setLimits({
        upper: null,
        lower: null,
      });
      setMeta(null);

      setError(err?.response?.data?.message || "Failed to load CTI trend data");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Auto fetch only when graph-related params change
  //
  // Primary/secondary dashboard windows do NOT trigger this.
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCTITrend();
  }, [configId, startDate, endDate, geoKey]);
  const yAxisTicks = useMemo(() => {
    const max = Number(yAxisMax);
    const step = Number(yAxisStep);

    if (!max || !step || max <= 0 || step <= 0) {
      return [0, 1, 2, 3, 4, 5];
    }

    const ticks = [];

    for (let value = 0; value <= max + 0.000001; value += step) {
      ticks.push(Number(value.toFixed(4)));
    }

    // Make sure max itself is always present
    if (ticks[ticks.length - 1] !== max) {
      ticks.push(max);
    }

    return ticks;
  }, [yAxisMax, yAxisStep]);
  const plotData = useMemo(() => {
    const normalizeCTI = (value) => {
      // Treat N/A / null / undefined / empty as zero
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "N/A"
      ) {
        return 0;
      }

      const num = Number(value);

      return Number.isFinite(num) ? num : 0;
    };

    return chartData.map((row) => {
      const dailyCTI = normalizeCTI(row.daily_cti);

      const movingCTI = normalizeCTI(row.moving_cti_28);

      return {
        ...row,

        // Actual normalized values
        daily_cti_actual: dailyCTI,
        moving_cti_28_actual: movingCTI,

        // Values drawn on chart
        daily_cti_plot: Math.min(dailyCTI, Number(yAxisMax)),

        moving_cti_28_plot: Math.min(movingCTI, Number(yAxisMax)),

        // Above graph max
        daily_cti_capped: dailyCTI > Number(yAxisMax),

        moving_cti_28_capped: movingCTI > Number(yAxisMax),

        // Helpful for tooltip
        daily_cti_was_na:
          row.daily_cti === null ||
          row.daily_cti === undefined ||
          row.daily_cti === "" ||
          row.daily_cti === "N/A",

        moving_cti_was_na:
          row.moving_cti_28 === null ||
          row.moving_cti_28 === undefined ||
          row.moving_cti_28 === "" ||
          row.moving_cti_28 === "N/A",
      };
    });
  }, [chartData, yAxisMax]);

  // ─────────────────────────────────────────────────────────
  // No campaign selected
  // ─────────────────────────────────────────────────────────

  if (!configId) {
    return (
      <Empty
        description="Select a campaign to view CTI trend"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
            }}>
            Click-To-Install Trend
          </div>

          {meta && (
            <div
              style={{
                fontSize: 12,
                color: "#777",
                marginTop: 4,
              }}>
              {meta.campaign_name} {meta.os ? `• ${meta.os}` : ""}
              {" • "}
              {startDate} → {endDate}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 12,
            flexWrap: "wrap",
          }}>
          <div>
            <div
              style={{
                fontSize: 12,
                marginBottom: 4,
                color: "#666",
              }}>
              Y Axis Max
            </div>

            <InputNumber
              min={0.25}
              step={0.25}
              value={yAxisMax}
              onChange={(value) => {
                if (value && Number(value) > 0) {
                  setYAxisMax(Number(value));
                }
              }}
              addonAfter="%"
              style={{ width: 120 }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                marginBottom: 4,
                color: "#666",
              }}>
              Y Axis Step
            </div>

            <InputNumber
              min={0.05}
              max={yAxisMax}
              step={0.05}
              value={yAxisStep}
              onChange={(value) => {
                if (value && Number(value) > 0) {
                  setYAxisStep(Number(value));
                }
              }}
              addonAfter="%"
              style={{ width: 120 }}
            />
          </div>

          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchCTITrend}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{
            marginBottom: 16,
          }}
        />
      )}

      {/* Loading */}
      {loading ? (
        <div
          style={{
            height: 420,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
          <Spin size="large" />
        </div>
      ) : chartData.length === 0 ? (
        <Empty
          description="No CTI data available for selected period"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <ResponsiveContainer width="100%" height={430}>
          <LineChart
            data={plotData}
            margin={{
              top: 25,
              right: 35,
              left: 10,
              bottom: 20,
            }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            {/* X Axis */}
            <XAxis
              dataKey="date"
              tickFormatter={(date) => dayjs(date).format("DD MMM")}
              minTickGap={25}
            />

            {/* Y Axis */}
            <YAxis
              domain={[0, Number(yAxisMax)]}
              ticks={yAxisTicks}
              allowDataOverflow
              tickFormatter={(value) => {
                const num = Number(value);

                return Number.isInteger(num)
                  ? `${num}%`
                  : `${Number(num.toFixed(2))}%`;
              }}
              label={{
                value: "CTI %",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip content={<CTITooltip />} />

            <Legend />

            {/* -----------------------------------------
                A — Upper Limit
               ----------------------------------------- */}
            {limits.upper !== null && (
              <ReferenceLine
                y={Math.min(Number(limits.upper), Number(yAxisMax))}
                stroke="#ff4d4f"
                strokeWidth={2}
                label={{
                  value: `Upper Limit ${limits.upper}%`,
                  position: "insideTopRight",
                  fill: "#ff4d4f",
                }}
              />
            )}

            {/* -----------------------------------------
                B — Lower Limit
               ----------------------------------------- */}
            {limits.lower !== null && (
              <ReferenceLine
                y={Math.min(Number(limits.lower), Number(yAxisMax))}
                stroke="#ff4d4f"
                strokeWidth={2}
                label={{
                  value: `Lower Limit ${limits.lower}%`,
                  position: "insideBottomRight",
                  fill: "#ff4d4f",
                }}
              />
            )}

            {/* -----------------------------------------
                D — Daily CTI
                Solid line + points
               ----------------------------------------- */}
            <Line
              type="monotone"
              dataKey="daily_cti_plot"
              name="Click To Install Ratio (CTI)"
              stroke="#1677ff"
              strokeWidth={2}
              dot={{
                r: 3,
              }}
              activeDot={{
                r: 6,
              }}
              connectNulls={false}
              isAnimationActive={false}
            />

            {/* -----------------------------------------
                C — 28 Day Moving CTI
                Dotted line
               ----------------------------------------- */}
            <Line
              type="monotone"
              dataKey="moving_cti_28_plot"
              name="28 Days Moving Avg. (CTI)"
              stroke="#722ed1"
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CTITrendChart;
