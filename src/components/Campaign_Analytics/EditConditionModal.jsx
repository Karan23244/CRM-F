import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Row,
  Col,
  Checkbox,
  message,
  Tooltip,
  Divider,
  Tag,
  Tabs,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";

/* ------------------ CONSTANTS ------------------ */
const METRICS = ["cti", "fraud", "ite", "etc"];
const ZONES = ["Green", "Yellow", "Orange", "Red"];

const zoneMeta = {
  Green: { color: "bg-green-500", text: "Safe zone" },
  Yellow: { color: "bg-yellow-400", text: "Warning zone" },
  Orange: { color: "bg-orange-500", text: "High risk" },
  Red: { color: "bg-red-500", text: "Critical risk" },
};

const emptyZoneRanges = () => ({
  range1: { min: null, max: null },
  range2: { min: null, max: null },
});

const buildInitialState = () =>
  METRICS.reduce((acc, metric) => {
    acc[metric] = ZONES.reduce((zAcc, zone) => {
      zAcc[zone] = emptyZoneRanges();
      return zAcc;
    }, {});
    return acc;
  }, {});

/* ------------------ COMPONENT ------------------ */
const EditConditionsModal = ({
  showModal,
  setShowModal,
  campaignName,
  apiUrl,
  onSaved,
}) => {
  /* ------------------ GLOBAL IGNORE ------------------ */
  const [globalIgnores, setGlobalIgnores] = useState({
    fraud: false,
    cti: false,
    ite: false,
    etc: false,
  });

  /* ------------------ ACTIVE METRIC ------------------ */
  const [selectedMetric, setSelectedMetric] = useState("cti");

  /* ------------------ CONDITIONS ------------------ */
  const [editValues, setEditValues] = useState(buildInitialState());
  useEffect(() => {
    if (!showModal) return;

    // Reset everything first
    setEditValues(buildInitialState());
    setGlobalIgnores({
      fraud: false,
      cti: false,
      ite: false,
      etc: false,
    });
    setSelectedMetric("cti");
  }, [showModal, campaignName]);
  /* ------------------ LOAD EXISTING DATA ------------------ */
  useEffect(() => {
    if (!showModal || !campaignName) return;

    const getZoneConditions = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/api/zone-conditions1/${campaignName}`,
        );

        if (res?.data?.data) {
          setEditValues(res.data.data.conditions);
          setGlobalIgnores(res.data.data.globalIgnores);
        }
      } catch (err) {
        console.error("Zone condition load failed:", err);
        message.error("Failed to load zone conditions");
      }
    };

    getZoneConditions();
  }, [showModal, campaignName, apiUrl]);

  /* ------------------ VALIDATION ------------------ */
  const isInvalid = () => {
    if (globalIgnores[selectedMetric]) return false;

    return ZONES.some((zone) => {
      const { range1, range2 } = editValues[selectedMetric][zone];

      if (range1.min != null && range1.max != null) {
        if (Number(range1.min) >= Number(range1.max)) return true;
      }

      if (zone !== "Green") {
        if (range2.min != null && range2.max != null) {
          if (Number(range2.min) >= Number(range2.max)) return true;
        }
      }

      return false;
    });
  };

  /* ------------------ SAVE ------------------ */
  const handleSave = async () => {
    if (isInvalid()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Invalid Min / Max values detected",
      });
      return;
    }

    const payload = {
      campaignName,
      globalIgnores,
      conditions: editValues,
    };

    // Confirmation Popup
    const confirm = await Swal.fire({
      title: "Save Conditions?",
      text: "Are you sure you want to save these zone conditions?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Save",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(`${apiUrl}/api/zone-conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Conditions saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      onSaved();
      setShowModal(false);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Failed to save conditions",
      });
    }
  };

  return (
    <Modal
      open={showModal}
      onCancel={() => setShowModal(false)}
      onOk={handleSave}
      width={980}
      title={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Edit Zone Conditions</p>
            <p className="text-xs text-gray-400">
              Campaign: {campaignName || "-"}
            </p>
          </div>
          <Tag color="blue" className="uppercase">
            {selectedMetric}
          </Tag>
        </div>
      }
      styles={{
        background: "#f8fafc",
        borderRadius: "12px",
        padding: "20px",
      }}>
      <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
        {/* ------------------ GLOBAL IGNORE ------------------ */}
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-2 mb-3">
            <p className="font-semibold">Global Ignore</p>
            <Tooltip title="Ignore validation and evaluation for selected metrics">
              <InfoCircleOutlined className="text-gray-400" />
            </Tooltip>
          </div>

          <div className="flex flex-wrap gap-5">
            {METRICS.map((metric) => (
              <Checkbox
                key={metric}
                checked={globalIgnores[metric]}
                onChange={(e) =>
                  setGlobalIgnores({
                    ...globalIgnores,
                    [metric]: e.target.checked,
                  })
                }>
                <span className="capitalize font-medium">{metric}</span>
              </Checkbox>
            ))}
          </div>
        </div>

        {/* ------------------ METRIC TABS ------------------ */}
        <div className="bg-white rounded-xl border px-4 pt-3">
          <Tabs
            activeKey={selectedMetric}
            onChange={setSelectedMetric}
            items={METRICS.map((metric) => ({
              key: metric,
              label: <span className="uppercase font-semibold">{metric}</span>,
            }))}
          />
        </div>

        {/* ------------------ ZONE CONDITIONS ------------------ */}
        <Row gutter={[16, 16]}>
          {ZONES.map((zone) => {
            const isGreen = zone === "Green";
            const zoneData = editValues[selectedMetric][zone];
            const disabled = globalIgnores[selectedMetric];

            return (
              <Col span={12} key={zone}>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className={`h-2 ${zoneMeta[zone].color}`} />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold">{zone} Zone</p>
                      <span className="text-xs text-gray-400">
                        {zoneMeta[zone].text}
                      </span>
                    </div>

                    <Divider orientation="left" plain>
                      Range 1
                    </Divider>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Input
                        disabled={disabled}
                        placeholder="Min"
                        type="number"
                        value={zoneData.range1.min ?? ""}
                        onChange={(e) => {
                          const updated = structuredClone(editValues);
                          updated[selectedMetric][zone].range1.min =
                            e.target.value || null;
                          setEditValues(updated);
                        }}
                      />
                      <Input
                        disabled={disabled}
                        placeholder="Max"
                        type="number"
                        value={zoneData.range1.max ?? ""}
                        onChange={(e) => {
                          const updated = structuredClone(editValues);
                          updated[selectedMetric][zone].range1.max =
                            e.target.value || null;
                          setEditValues(updated);
                        }}
                      />
                    </div>

                    <Divider orientation="left" plain>
                      Range 2
                    </Divider>

                    {isGreen ? (
                      <p className="text-xs text-gray-400 italic">
                        Range 2 not applicable for Green zone
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          disabled={disabled}
                          placeholder="Min"
                          type="number"
                          value={zoneData.range2.min ?? ""}
                          onChange={(e) => {
                            const updated = structuredClone(editValues);
                            updated[selectedMetric][zone].range2.min =
                              e.target.value || null;
                            setEditValues(updated);
                          }}
                        />
                        <Input
                          disabled={disabled}
                          placeholder="Max"
                          type="number"
                          value={zoneData.range2.max ?? ""}
                          onChange={(e) => {
                            const updated = structuredClone(editValues);
                            updated[selectedMetric][zone].range2.max =
                              e.target.value || null;
                            setEditValues(updated);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    </Modal>
  );
};

export default EditConditionsModal;
