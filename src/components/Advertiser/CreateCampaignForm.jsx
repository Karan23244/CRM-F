// src/components/Campaigns/CreateCampaignForm.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Table,
  Spin,
  Switch,
  Checkbox,
} from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import geoData from "../../Data/geoData.json";
import { useLocation } from "react-router-dom";
import StyledTable from "../../Utils/StyledTable";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL;
const apiUrl2 = import.meta.env.VITE_API_URL3;
const { Option } = Select;

const CreateCampaignForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editRecord = location.state?.record || null;
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [form] = Form.useForm();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState({
    pub_name: [],
    payable_event: [],
    mmp_tracker: [],
    geo: [],
    adv_list: [],
  });
  const [livePids, setLivePids] = useState([]);
  const [pausedPids, setPausedPids] = useState([]);
  const [geoRows, setGeoRows] = useState([{ geo: "", payout: "", os: "" }]);
  const [updatedStatus, setUpdatedStatus] = useState({});
  const [searchText, setSearchText] = useState("");

  // const fetchCampaigns = useCallback(async () => {
  //   try {
  //     setLoading(true);
  //     const res = await axios.get(`${apiUrl}/campaigns`);
  //     setCampaigns(res.data || []);
  //   } catch (err) {
  //     console.error(err);
  //     Swal.fire("Error", "Failed to fetch campaigns", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchCampaigns();
  // }, [fetchCampaigns]);
  // Trim string values safely
  const trimAll = (obj) => {
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      if (typeof val === "string") {
        obj[key] = val.trim(); // only removes start + end spaces
      }
    });
    return obj;
  };

  const fetchDropdowns = useCallback(async () => {
    try {
      const [advmName, payableEvent, mmpTracker, adv_id] = await Promise.all([
        axios.get(`${apiUrl}/get-subadmin`),
        axios.get(`${apiUrl}/get-paybleevernt`),
        axios.get(`${apiUrl}/get-mmptracker`),
        axios.get(`${apiUrl}/advid-data/${userId}`),
      ]);
      setDropdownOptions({
        pub_name: [
          ...new Set(
            advmName?.data?.data
              ?.filter(
                (item) =>
                  (item.role === "publisher_manager" ||
                    item.role === "publisher") &&
                  !["AtiqueADV", "AnveshaADV"].includes(item.username)
              )
              .map((item) => item.username)
          ),
        ],
        payable_event: [
          ...new Set(
            payableEvent?.data?.data?.map((i) => i.payble_event) || []
          ),
        ],
        mmp_tracker: [
          ...new Set(mmpTracker?.data?.data?.map((i) => i.mmptext) || []),
        ],
        adv_list:
          adv_id?.data?.advertisements?.map((i) => ({
            adv_id: i.adv_id,
            adv_name: i.adv_name,
          })) || [],
        geo: [...new Set(geoData.geo?.map((i) => i.code) || [])],
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to fetch dropdown data", "error");
    }
  }, [userId]);
  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // const onFinish = async (values) => {
  //   trimAll(values);
  //   if (isSubmitting) return; // ⛔ Prevent double click
  //   setIsSubmitting(true); // 🔒 Lock submit
  //   if (editRecord) {
  //     await handleEditCampaign(values);
  //     setIsSubmitting(false);
  //     return;
  //   }

  //   // Extract ONLY the IDs
  //   const adv_id = values.advertiser?.value || values.advertiser;
  //   const adv_d = values.adv_d?.value || values.adv_d;
  //   const geoArray = values.geo_details.map((item) => item.geo);
  //   const payoutValue = values.geo_details.map((item) => [item.payout]);
  //   const osValue = values.geo_details.map((item) => [item.os]);
  //   const payableEvents = values.geo_details.map((item) => [
  //     item.payable_event,
  //   ]);

  //   const finalPayload = {
  //     Adv_name: values.Adv_name,
  //     campaign_name: values.campaign_name,
  //     Vertical: values.Vertical,
  //     geo: geoArray,
  //     adv_payout: payoutValue, // FIXED
  //     os: osValue, // FIXED (no array)
  //     state_city: values.state_city,
  //     payable_event: payableEvents,
  //     mmp_tracker: values.mmp_tracker,
  //     adv_d: adv_d,
  //     kpi: values.kpi || "",
  //     tracking_url: values.tracking_url || "",
  //     preview_url: values.preview_url || "",
  //     da: values.da,
  //     status: values.status,
  //     user_id: userId,
  //   };
  //   console.log("Final Payload:", finalPayload);
  //   // remove nested structure (optional but recommended)
  //   delete finalPayload.geo_details;

  //   try {
  //     const res = await axios.post(`${apiUrl}/campaignsnew`, finalPayload);
  //     console.log(res);
  //     if (res.data?.message === "Campaign(s) created successfully") {
  //       Swal.fire({
  //         icon: "success",
  //         title: "Created!",
  //         text: res.data.message,
  //         timer: 1200,
  //         showConfirmButton: false,
  //       });
  //       form.resetFields();
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     Swal.fire("Error", "Error creating campaign", "error");
  //   }
  //   setIsSubmitting(false);
  // };
  const onFinish = async (values) => {
    trimAll(values);
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (editRecord) {
      await handleEditCampaign(values);
      setIsSubmitting(false);
      return;
    }

    const adv_id = values.advertiser?.value || values.advertiser;
    const adv_d = values.adv_d?.value || values.adv_d;

    const geoArray = values.geo_details.map((item) => item.geo);
    const payoutValue = values.geo_details.map((item) => [item.payout]);
    const osValue = values.geo_details.map((item) => [item.os]);
    const payableEvents = values.geo_details.map((item) => [
      item.payable_event,
    ]);

    const finalPayload = {
      Adv_name: values.Adv_name,
      campaign_name: values.campaign_name,
      Vertical: values.Vertical,
      geo: geoArray,
      adv_payout: payoutValue,
      os: osValue,
      state_city: values.state_city,
      payable_event: payableEvents,
      mmp_tracker: values.mmp_tracker,
      adv_d: adv_d,
      kpi: values.kpi || "",
      tracking_url: values.tracking_url || "",
      preview_url: values.preview_url || "",
      da: values.da,
      status: values.status,
      user_id: userId,
    };

    delete finalPayload.geo_details;

    try {
      // ============================================================
      // 1️⃣ CREATE CAMPAIGN
      // ============================================================
      const res = await axios.post(`${apiUrl}/campaignsnew`, finalPayload);

      console.log("Create Campaign Response:", res.data);

      if (res.data?.message === "Campaign(s) created successfully") {
        const campaignId = res.data.campaign_id; // ⚠ MUST be returned from backend

        console.log("Received Campaign ID:", campaignId);

        if (!campaignId) {
          console.error(
            "❌ campaign_id missing from backend. Cannot save advertiser link."
          );
        } else {
          // ============================================================
          // 2️⃣ SAVE ADVERTISER LINK
          // ============================================================
          const advertiserPayload = {
            campaign_id: campaignId,
            advertiser_link: values.tracking_url, // advertiser link
            adv_id: values.adv_d?.value, // default if not available
            click_id_param: "click_id",
          };

          console.log("Sending Advertiser Payload:", advertiserPayload);

          const advRes = await axios.post(
            `${apiUrl2}/link/advertiser`,
            advertiserPayload
          );

          console.log("Advertiser API Response:", advRes.data);
        }

        Swal.fire({
          icon: "success",
          title: "Created!",
          text: res.data.message,
          timer: 1200,
          showConfirmButton: false,
        });

        form.resetFields();
      }
    } catch (error) {
      console.error("Final Error:", error);
      Swal.fire("Error", "Error creating campaign", "error");
    }

    setIsSubmitting(false);
  };
  const handleEditCampaign = async (values) => {
    // Extract ONLY the IDs
    const adv_id = values.advertiser?.value || values.advertiser;
    const adv_d = values.adv_d?.value || values.adv_d;
    // current OS selected on form
    const newOS = values.geo_details[0].os;

    // original OS from record
    const oldOS = editRecord.os;

    // check if OS changed
    const isOSChanged = newOS !== oldOS;
    const finalPayload = {
      id: editRecord.id,

      Adv_name: values.Adv_name,
      campaign_name: values.campaign_name,
      Vertical: values.Vertical,

      // 🔥 Only one row, only one geo array
      geo: values.geo_details[0].geo,

      adv_payout: values.geo_details[0].payout,
      os_new: isOSChanged ? newOS : oldOS,
      os_old: isOSChanged ? oldOS : oldOS,
      state_city: values.state_city,

      payable_event: values.geo_details[0].payable_event,
      mmp_tracker: values.mmp_tracker,
      adv_d: adv_d,

      kpi: values.kpi || "",
      tracking_url: values.tracking_url || "",
      preview_url: values.preview_url || "",
      da: values.da,
      status: values.status,
    };
    console.log(finalPayload);
    try {
      const res = await axios.post(`${apiUrl}/campaign-update`, finalPayload);
      console.log(res);
      const msg = res?.data?.message;
      if (msg && msg.includes("updated")) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: msg,
          timer: 1000,
          showConfirmButton: false,
        }).then(() => {
          navigate("/dashboard/campaignlist");
        });
      }
    } catch (error) {
      console.error("EDIT CAMPAIGN ERROR:", error);
      Swal.fire("Error", "Error updating campaign", "error");
    }
  };

  const columns = [
    {
      title: "PID",
      dataIndex: "pid",
    },
    {
      title: "Status",
      render: (text, record) => {
        const originalStatus = (record.status || "").toLowerCase();

        const currentStatus = (
          updatedStatus[record.id] || originalStatus
        ).toLowerCase();

        return (
          <Switch
            checked={currentStatus === "live"}
            onChange={() => handleToggle(record)}
          />
        );
      },
    },
  ];

  useEffect(() => {
    if (!editRecord) return;
    console.log("Editing Record:", editRecord);
    // --- SAFE GEO PARSING ---
    let parsedGeo = [];

    if (Array.isArray(editRecord.geo)) {
      // Flatten any depth to get simple ["BS"]
      parsedGeo = editRecord.geo.flat(Infinity);
    } else if (typeof editRecord.geo === "string") {
      try {
        const json = JSON.parse(editRecord.geo);

        if (Array.isArray(json)) {
          parsedGeo = json.flat(Infinity);
        } else if (json) {
          parsedGeo = [json];
        } else {
          parsedGeo = [];
        }
      } catch {
        parsedGeo = editRecord.geo ? [editRecord.geo] : [];
      }
    } else {
      parsedGeo = [];
    }

    // --- OS NORMALIZATION ---
    const normalizedOS =
      editRecord.os?.toLowerCase() === "ios"
        ? "iOS"
        : editRecord.os?.toLowerCase() === "android"
        ? "Android"
        : editRecord.os;

    // --- PREPARE GEO DETAILS ROW ---
    const geoDetailsRow = [
      {
        geo: parsedGeo,
        payout: editRecord.adv_payout || "",
        os: normalizedOS || "",
        payable_event: editRecord.payable_event || "",
      },
    ];

    // --- SET FORM VALUES ---
    form.setFieldsValue({
      advertiser: Number(editRecord.adv_d),
      adv_d: Number(editRecord.adv_d),
      Adv_name: editRecord.Adv_name,

      campaign_name: editRecord.campaign_name,
      Vertical: editRecord.Vertical,
      state_city: editRecord.state_city,

      geo_details: geoDetailsRow,

      payable_event: editRecord.payable_event,
      mmp_tracker: editRecord.mmp_tracker,

      adv_payout: editRecord.adv_payout,
      kpi: editRecord.kpi,
      category: editRecord.category,
      Target: editRecord.Target,
      achieve_number: editRecord.achieve_number,

      preview_url: editRecord.preview_url,
      tracking_url: editRecord.tracking_url,
      da: editRecord.da,
      status: editRecord.status,
    });
  }, [editRecord, form]);

  useEffect(() => {
    if (editRecord && dropdownOptions.adv_list.length > 0) {
      const match = dropdownOptions.adv_list.find(
        (i) => Number(i.adv_id) === Number(editRecord.adv_d)
      );

      form.setFieldsValue({
        advertiser: Number(editRecord.adv_d),
        adv_d: match?.adv_id || "",
        Adv_name: match?.adv_name || "",
      });

      // 🔥 Force the Select to display "Adv_name (adv_d)"
      form.setFieldValue(
        "advertiser_label",
        `${match?.adv_name} (${match?.adv_id})`
      );
    }
  }, [dropdownOptions.adv_list, editRecord, form]);

  // Fetch PID info when editRecord changes
  useEffect(() => {
    if (!editRecord) return;
    console.log(editRecord);
    // 🔥 SEND campaign_name & OS to backend to fetch PID info
    const fetchPidInfo = async () => {
      try {
        const res = await axios.post(`${apiUrl}/pid-update`, {
          campaign_id: editRecord.id,
          campaign_name: editRecord.campaign_name,
          os: editRecord.os,
        });
        setLivePids(
          (res.data.live_pids || []).map((item) => ({
            ...item,
            status: "live",
          }))
        );

        setPausedPids(
          (res.data.paused_pids || []).map((item) => ({
            ...item,
            status: "pause",
          }))
        );
      } catch (error) {
        console.error("PID Fetch Error:", error);
      }
    };

    fetchPidInfo();
  }, [editRecord]);
  // TOGGLE HANDLER
  const handleToggle = (record) => {
    const original = (record.status || "").toLowerCase();
    const newState = original === "live" ? "pause" : "live";

    setUpdatedStatus((prev) => ({
      ...prev,
      [record.id]: newState,
    }));

    // Move between tables LIVE ↔ PAUSE
    if (newState === "live") {
      setPausedPids((prev) => prev.filter((p) => p.id !== record.id));
      setLivePids((prev) => [...prev, { ...record, status: "live" }]);
    } else {
      setLivePids((prev) => prev.filter((p) => p.id !== record.id));
      setPausedPids((prev) => [...prev, { ...record, status: "pause" }]);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const payload = {
        data: Object.entries(updatedStatus).map(([id, status]) => ({
          id,
          status,
        })),
      };

      await axios.post(`${apiUrl}/pid-updatestatus`, payload);

      Swal.fire("Success", "PID status updated!", "success");
      setUpdatedStatus({});
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to update PID status", "error");
    }
  };
  const filteredLivePids = livePids?.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const filteredPausedPids = pausedPids?.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      {/* ====== FORM CARD ====== */}
      <Card className="w-full max-w-8xl rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {editRecord ? "Edit Campaign" : "Create New Campaign"}
        </h2>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            advertiser: editRecord
              ? {
                  value: Number(editRecord?.adv_d),
                  label: `${editRecord?.Adv_name} (${editRecord?.adv_d})`,
                }
              : null,

            adv_d: editRecord?.adv_d || "",
            Adv_name: editRecord?.Adv_name || "",

            geo_details: editRecord ? editRecord.geo_details || [{}] : [{}],
          }}
          onFinish={onFinish}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
          <Form.Item
            label="Advertiser"
            name="advertiser"
            rules={[{ required: true, message: "Please select advertiser" }]}>
            <Select
              showSearch
              labelInValue
              placeholder="Select Advertiser"
              optionFilterProp="label"
              optionLabelProp="label"
              value={form.getFieldValue("advertiser")}
              className="!h-11"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(val, option) => {
                form.setFieldsValue({
                  adv_d: val,
                  Adv_name: option?.adv_name,
                });
              }}>
              {dropdownOptions.adv_list.map((item) => (
                <Option
                  key={item.adv_id}
                  value={item.adv_id}
                  label={`${item.adv_name} (${item.adv_id})`}
                  adv_name={item.adv_name}>
                  {item.adv_name} ({item.adv_id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 👇 REQUIRED HIDDEN FIELDS */}
          <Form.Item name="adv_d" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="Adv_name" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Campaign Name"
            name="campaign_name"
            rules={[{ required: true, message: "Please enter campaign name" }]}>
            <Input
              placeholder="Enter Campaign Name"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>

          <Form.Item
            label="Vertical"
            name="Vertical"
            rules={[{ required: true, message: "Please select vertical" }]}>
            <Select
              placeholder="Select Vertical"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              <Option value="Finance">Finance</Option>
              <Option value="Gaming">Gaming</Option>
              <Option value="E-commerce">E-commerce</Option>
              <Option value="Utilities">Utilities</Option>
              <Option value="Health">Health</Option>
              <Option value="Betting Sports">Betting Sports</Option>
              <Option value="Betting Casino">Betting Casino</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="State/City"
            name="state_city"
            rules={[{ required: true, message: "Please enter state or city" }]}>
            <Input
              placeholder="Enter State or City"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>
          {/* ======================= GEO + PAYOUT + OS MULTI-ROW UI ======================= */}
          <Form.List name="geo_details">
            {(fields, { add, remove }) => (
              <div className="md:col-span-2">
                <h3 className="text-md mb-3">
                  GEO • Payout • OS (Add Multiple Rows)
                </h3>

                <div className="space-y-4 mb-4">
                  {fields.map(({ key, name }, index) => (
                    <div
                      key={key}
                      className="grid grid-cols-1 md:grid-cols-12 gap-x-5 p-3 rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
                      {/* GEO */}
                      <div className="md:col-span-6">
                        <Form.Item
                          label={<span className="">Geo</span>}
                          name={[name, "geo"]}
                          rules={[
                            { required: true, message: "Please select Geo" },
                          ]}>
                          <Select
                            mode="multiple"
                            placeholder="Select Geo"
                            className="!h-11 rounded-lg border-gray-300 bg-white"
                            showSearch>
                            {dropdownOptions.geo.map((g) => (
                              <Option key={g} value={g}>
                                {g}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>

                      {/* PAYOUT */}
                      <div className="md:col-span-6">
                        <Form.Item
                          label={<span className="">Payout</span>}
                          name={[name, "payout"]}
                          rules={[
                            { required: true, message: "Please enter payout" },
                          ]}>
                          <Input
                            type="number"
                            placeholder="Enter payout"
                            className="h-11 rounded-lg border-gray-300 bg-white"
                          />
                        </Form.Item>
                      </div>
                      {/* PAYABLE EVENT */}
                      <div className="md:col-span-6">
                        <Form.Item
                          label="Payable Event"
                          name={[name, "payable_event"]}
                          rules={[
                            {
                              required: true,
                              message: "Please select payable event",
                            },
                          ]}>
                          <Select
                            placeholder="Select Payable Event"
                            className="!h-11 rounded-lg border-gray-300 bg-white"
                            showSearch>
                            {dropdownOptions.payable_event.map((event) => (
                              <Option key={event} value={event}>
                                {event}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>

                      {/* OS */}
                      <div className="md:col-span-6">
                        <Form.Item
                          label={<span className="">OS</span>}
                          name={[name, "os"]}
                          rules={[
                            { required: true, message: "Please select OS" },
                          ]}>
                          <Select
                            placeholder="Select OS"
                            className="!h-11 rounded-lg border-gray-300 bg-white">
                            <Option value="Android">Android</Option>
                            <Option value="iOS">iOS</Option>
                            <Option value="both">Both</Option>
                          </Select>
                        </Form.Item>
                      </div>

                      {/* DELETE BUTTON */}
                      <div className="flex items-end">
                        {fields.length > 1 && (
                          <Button
                            danger
                            onClick={() => remove(name)}
                            className="!h-11 !px-6 rounded-lg shadow-sm">
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* ADD MORE BUTTON */}
                  {!editRecord && (
                    <Button
                      type="dashed"
                      className="w-full !h-12 border-[#2F5D99] text-[#2F5D99] font-medium rounded-lg"
                      onClick={() => add()}>
                      + Add More Row
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Form.List>

          <Form.Item
            label="MMP Tracker"
            name="mmp_tracker"
            rules={[{ required: true, message: "Please select MMP tracker" }]}>
            <Select
              showSearch
              placeholder="Select MMP Tracker"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              {dropdownOptions.mmp_tracker.map((e) => (
                <Option key={e} value={e}>
                  {e}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="KPI"
            name="kpi"
            rules={[{ required: true, message: "Please enter KPI" }]}>
            <Input
              placeholder="Enter KPI"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>
          <Form.Item
            label="Preview Link"
            name="preview_url"
            rules={[{ required: true, message: "Please enter KPI" }]}>
            <Input
              placeholder="Enter KPI"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>
          <Form.Item label="Tracking Link" name="tracking_url">
            <Input
              placeholder="Enter Tracking Link"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>
          <Form.Item
            label="DA"
            name="da"
            rules={[{ required: true, message: "Please select DA type" }]}>
            <Select
              placeholder="Select DA"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              <Option value="Direct">Direct</Option>
              <Option value="Agency">Agency</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[
              { required: true, message: "Please select campaign status" },
            ]}>
            <Select
              placeholder="Select Status"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              <Option value="Live">Live</Option>
              <Option value="Pause">Pause</Option>
            </Select>
          </Form.Item>

          <Form.Item className="md:col-span-2 flex justify-end mt-4">
            <Button
              type="default"
              htmlType="submit"
              loading={loading || isSubmitting}
              className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-10 !py-5 !h-12 !text-lg !border-none !shadow-md">
              {editRecord ? "Edit Campaign" : "Create Campaign"}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* ====== LIVE / PAUSED CAMPAIGNS ====== */}
      {editRecord && (
        <>
          {/* Top Bar */}
          <div className="mt-8 w-full max-w-8xl">
            <GenrateLink
              campaignId={editRecord.id}
              trackingurl={editRecord.tracking_url}
              className="w-full"
            />
            <div className="flex items-center justify-between m-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Edit PID Status
              </h2>

              <div className="flex items-center gap-4 w-full max-w-sm ml-4">
                <Input
                  placeholder="Search PID..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
                <Button
                  type="primary"
                  disabled={Object.keys(updatedStatus).length === 0}
                  onClick={handleSaveChanges}
                  className="px-6">
                  Save Changes
                </Button>
              </div>
            </div>

            {/* PID Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
              <Card
                title="Live PID's"
                className="shadow-md border-gray-100 rounded-2xl">
                {loading ? (
                  <Spin />
                ) : (
                  <StyledTable
                    columns={columns}
                    dataSource={filteredLivePids}
                    rowKey="id"
                    pagination={{
                      pageSizeOptions: ["10", "20", "50"],
                      showSizeChanger: true,
                      defaultPageSize: 10,
                    }}
                  />
                )}
              </Card>

              <Card
                title="Paused PID's"
                className="shadow-md border-gray-100 rounded-2xl">
                {loading ? (
                  <Spin />
                ) : (
                  <StyledTable
                    columns={columns}
                    dataSource={filteredPausedPids}
                    rowKey="id"
                    pagination={{
                      pageSizeOptions: ["10", "20", "50"],
                      showSizeChanger: true,
                      defaultPageSize: 10,
                    }}
                  />
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateCampaignForm;

const GenrateLink = ({ campaignId, trackingurl }) => {
  const [allPubs, setAllPubs] = useState([]);
  const [selectedPub, setSelectedPub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [hideReferrer, setHideReferrer] = useState(false);

  useEffect(() => {
    fetchPublisherIds();
  }, []);

  const fetchPublisherIds = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/get-allpub`);
      const pubList = res?.data?.data?.map((i) => i.pub_id) || [];
      setAllPubs(pubList);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPub) return;

    try {
      setSubmitting(true);
      console.log({
        publisher_id: selectedPub,
        campaign_id: campaignId,
        hide_referrer: hideReferrer ? 1 : 0,
      });

      const res = await axios.post(`${apiUrl2}/link/publisher`, {
        publisher_id: selectedPub,
        campaign_id: campaignId,
        hide_referrer: hideReferrer ? 1 : 0,
      });
      console.log("Generate Link Response:", res);
      // ⬇ THIS should be returned by your backend
      // Example: { link: "https://track.com/campaign/5543?pub=100" }
      const url = res.data?.publisher_link;

      if (url) {
        setTrackingUrl(url);
      }
    } catch (err) {
      alert("Error generating link");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingUrl);
    Swal.fire({
      icon: "success",
      title: "Copied!",
      text: "Tracking URL copied to clipboard.",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <Card className="m-6 rounded-2xl border border-gray-200 shadow-lg p-6 bg-white">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Generate Tracking Link
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-end">
              {/* Left Controls */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Publisher Select */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Publisher ID
                  </label>
                  <Select
                    placeholder="Select Publisher ID"
                    value={selectedPub}
                    onChange={(val) => setSelectedPub(val)}
                    showSearch
                    size="large"
                    className="rounded-lg">
                    {allPubs.map((pid) => (
                      <Select.Option key={pid} value={pid}>
                        {pid}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                {/* Checkbox */}
                <div className="flex flex-col gap-2 border border-white">
                  <label className="text-sm font-semibold text-gray-700">
                    Referrer Settings
                  </label>
                  <div className="h-[40px] flex items-center px-4 border rounded-lg bg-white">
                    <Checkbox
                      checked={hideReferrer}
                      onChange={(e) => setHideReferrer(e.target.checked)}>
                      <span className="text-gray-700 font-medium">
                        Hide Google Referrer
                      </span>
                    </Checkbox>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                type="primary"
                size="large"
                loading={submitting}
                onClick={handleSubmit}
                className="!bg-[#2F5D99] hover:!bg-[#24487A] 
                 !text-white !rounded-xl 
                 !px-10 !h-[48px] 
                 !text-lg !font-semibold 
                 !border-none !shadow-lg">
                Generate Tracking Link
              </Button>
            </div>
          </div>

          {/* Result Box */}
          {trackingUrl && (
            <div className="mt-6 p-4 border border-gray-300 rounded-xl bg-gray-50 shadow-sm">
              <p className="text-gray-700 font-medium mb-2">Generated Link:</p>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg bg-white text-gray-700"
                  value={trackingUrl}
                  readOnly
                />
                <Button
                  className="!bg-green-600 hover:!bg-green-700 !text-white !rounded-lg"
                  onClick={copyToClipboard}>
                  Copy
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
