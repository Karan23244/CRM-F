// src/components/Campaigns/CreateCampaignForm.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  AutoComplete,
  Modal,
} from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import geoData from "../../Data/geoData.json";
import { useLocation } from "react-router-dom";
import StyledTable from "../../Utils/StyledTable";
import { useNavigate } from "react-router-dom";
import SettingsPage from "./SettingsPage";
const apiUrl = import.meta.env.VITE_API_URL;
const apiChatUrl = import.meta.env.VITE_API_CHAT_URL;
const apiUrl2 = import.meta.env.VITE_API_URL3;
const apiUrl3 = import.meta.env.VITE_API_URL1;
const { Option } = Select;
const VERTICALS = [
  "Finance & Insurance",
  "Betting / Gambling",
  "Utilities & Services",
  "Dating & Social",
  "Business / Education Services",
  "E-commerce",
  "Travel & Transport",
  "Health & Pharmacy",
  "Entertainment & Subscription",
  "Gaming",
  "Food & Delivery",
];
const CreateCampaignForm = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const campaignId = queryParams.get("id");
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
  const [allPubs, setAllPubs] = useState([]);
  const [selectedPub, setSelectedPub] = useState(null);
  const [hideReferrer, setHideReferrer] = useState(false);
  const [pubLoading, setPubLoading] = useState(false);
  const [pubSubmitting, setPubSubmitting] = useState(false);
  const [approvedPublishers, setApprovedPublishers] = useState([]);
  const [viewingPub, setViewingPub] = useState(null);
  const campaignStatus = (editRecord?.status || "").toLowerCase();
  const isPublisherRole =
    Array.isArray(user?.role) &&
    (user.role.includes("publisher_manager") ||
      user.role.includes("publisher"));
  const [campaignOptions, setCampaignOptions] = useState([]);
  const campaignOptionsRef = useRef([]);
  const [selectedCampaign, setSelectedCampaign] = useState({
    name: "",
    sub_campaign_id: null,
  });

  const fetchCampaignSuggestions = async (searchText) => {
    try {
      if (!searchText?.trim()) {
        campaignOptionsRef.current = [];
        setCampaignOptions([]);
        return;
      }

      const res = await axios.get(`${apiUrl}/campaigns_list`);

      const data = res?.data || [];

      const filtered = data.filter((item) =>
        item.campaign_name
          ?.toLowerCase()
          .includes(searchText.toLowerCase())
      );

      const formatted = filtered.map((item) => ({
        value: item.campaign_name,
        label: item.sub_campaign_id != null
          ? `${item.campaign_name} (${item.os}) [${item.sub_campaign_id}]`
          : `${item.campaign_name} (${item.os})`,
        sub_campaign_id: item.sub_campaign_id,
        original_name: item.campaign_name,
      }));

      campaignOptionsRef.current = formatted;
      setCampaignOptions(formatted);
    } catch (error) {
      console.error("Campaign search error:", error);
    }
  };
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
                  !["AtiqueADV", "AnveshaADV"].includes(item.username),
              )
              .map((item) => item.username),
          ),
        ],
        payable_event: [
          ...new Set(
            payableEvent?.data?.data?.map((i) => i.payble_event) || [],
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
  const fetchCampaignById = async (id) => {
    try {
      const res = await axios.get(`${apiUrl}/campaign/${id}`);
      console.log("Fetched campaign for editing:", res.data);
      const data = res.data.data;
      console.log("Fetched campaign data:", data);
      // 👉 Instead of setFieldsValue
      navigate(location.pathname, {
        state: { record: data },
        replace: true,
      });
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (campaignId) {
      fetchCampaignById(campaignId);
    }
  }, [campaignId]);
  const getNextSubCampaignId = async () => {
    try {
      const res = await axios.get(`${apiUrl}/campaigns_list`);

      const data = res?.data || [];

      const ids = data
        .map((item) => Number(item.sub_campaign_id))
        .filter((id) => !isNaN(id));

      const maxId = ids.length ? Math.max(...ids) : 4000;

      return maxId < 4001 ? 4001 : maxId + 1;
    } catch (error) {
      console.error("Failed to generate sub campaign id", error);

      return 4001;
    }
  };
  const onFinish = async (values) => {
    trimAll(values);
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (editRecord) {
      await Promise.all([
        handleEditCampaign(values),
        handlePartialEditCampaign(values),
      ]);
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
    const selectedOS = values.geo_details?.[0]?.os;

    let preview_url = {};

    if (selectedOS === "Android" && values.preview_url) {
      preview_url.android = values.preview_url;
    }

    if (selectedOS === "iOS" && values.preview_url) {
      preview_url.ios = values.preview_url;
    }

    if (selectedOS === "Web" && values.preview_url) {
      preview_url.web = values.preview_url;
    }

    if (selectedOS === "both") {
      if (values.preview_url_android) {
        preview_url.android = values.preview_url_android;
      }

      if (values.preview_url_ios) {
        preview_url.ios = values.preview_url_ios;
      }
    }
    let finalSubCampaignId = selectedCampaign.sub_campaign_id;

    if (!finalSubCampaignId) {
      finalSubCampaignId = await getNextSubCampaignId();
    }
    const finalPayload = {
      Adv_name: values.Adv_name,
      campaign_name: values.campaign_name,
      sub_campaign_id: finalSubCampaignId,
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
      advertiser_impression_url: values.advertiser_impression_url || "",
      preview_url,
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

      if (res.data?.message === "Campaign(s) created successfully") {
        const campaignId = res.data.campaign_id; // ⚠ MUST be returned from backend

        if (!campaignId) {
          console.error(
            "❌ campaign_id missing from backend. Cannot save advertiser link.",
          );
        } else {
          // ============================================================
          // 2️⃣ SAVE ADVERTISER LINK
          // ============================================================
          const advertiserPayload = {
            campaign_id: campaignId,
            advertiser_link: values.tracking_url, // advertiser link
            advertiser_impression_url: values.advertiser_impression_url || "",
            adv_id: values.adv_d?.value, // default if not available
            click_id_param: "click_id",
          };

          const advRes = await axios.post(
            `${apiUrl2}/link/advertiser`,
            advertiserPayload,
          );
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
  const handlePartialEditCampaign = async (values) => {
    const adv_d = values.adv_d?.value || values.adv_d;
    const newOS = values.geo_details[0].os;
    const oldOS = editRecord.os;

    let originalGeo = [];
    if (Array.isArray(editRecord.geo)) {
      originalGeo = editRecord.geo.flat(Infinity);
    } else if (typeof editRecord.geo === "string") {
      try {
        const parsed = JSON.parse(editRecord.geo);
        originalGeo = Array.isArray(parsed) ? parsed.flat(Infinity) : [parsed];
      } catch {
        originalGeo = editRecord.geo ? [editRecord.geo] : [];
      }
    }

    const isDiff = (a, b) => {
      if (Array.isArray(a) && Array.isArray(b)) {
        return JSON.stringify([...a].sort()) !== JSON.stringify([...b].sort());
      }
      return String(a ?? "") !== String(b ?? "");
    };

    const newGeo = values.geo_details[0].geo;
    const changedFields = {};

    if (isDiff(values.Adv_name, editRecord.Adv_name)) changedFields.Adv_name = values.Adv_name;
    if (isDiff(values.campaign_name, editRecord.campaign_name)) changedFields.campaign_name = values.campaign_name;
    if (isDiff(values.Vertical, editRecord.Vertical)) changedFields.Vertical = values.Vertical;
    if (isDiff(values.state_city, editRecord.state_city)) changedFields.state_city = values.state_city;
    if (isDiff(values.mmp_tracker, editRecord.mmp_tracker)) changedFields.mmp_tracker = values.mmp_tracker;
    if (isDiff(values.kpi, editRecord.kpi)) changedFields.kpi = values.kpi;
    if (isDiff(values.tracking_url, editRecord.tracking_url)) changedFields.tracking_url = values.tracking_url;
    if (isDiff(values.preview_url, editRecord.preview_url)) changedFields.preview_url = values.preview_url;
    if (isDiff(values.da, editRecord.da)) changedFields.da = values.da;
    if (isDiff(values.status, editRecord.status)) changedFields.status = values.status;
    if (isDiff(adv_d, editRecord.adv_d)) changedFields.adv_d = adv_d;
    if (isDiff(newGeo, originalGeo)) changedFields.geo = newGeo;
    if (isDiff(newOS, oldOS)) {
      changedFields.os_new = newOS;
      changedFields.os_old = oldOS;
    }
    if (isDiff(values.geo_details[0].payout, editRecord.adv_payout)) {
      changedFields.adv_payout = values.geo_details[0].payout;
    }
    if (isDiff(values.geo_details[0].payable_event, editRecord.payable_event)) {
      changedFields.payable_event = values.geo_details[0].payable_event;
    }

    if (Object.keys(changedFields).length === 0) return;

    const payload = {
      campaign_id: String(editRecord.id),
      sub_campaign_id: String(editRecord.sub_campaign_id ?? ""),
      updates: [changedFields],
    };
    try {
      await axios.put(`${apiChatUrl}/groups/update-campaign-group-data`, payload);
    } catch (error) {
      console.error("PARTIAL EDIT CAMPAIGN ERROR:", error);
    }
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
      advertiser_impression_url: values.advertiser_impression_url || "",
      preview_url: values.preview_url || "",
      da: values.da,
      status: values.status,
    };
    try {
      const res = await axios.post(`${apiUrl}/campaign-update`, finalPayload);
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
            disabled={campaignStatus === "pause"}
            checked={currentStatus === "live"}
            onChange={() => handleToggle(record)}
          />
        );
      },
    },
  ];

  useEffect(() => {
    if (!editRecord) return;
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
      advertiser_impression_url: editRecord.advertiser_impression_url,
      da: editRecord.da,
      status: editRecord.status,
    });
  }, [editRecord, form]);

  useEffect(() => {
    if (editRecord && dropdownOptions.adv_list.length > 0) {
      const match = dropdownOptions.adv_list.find(
        (i) => Number(i.adv_id) === Number(editRecord.adv_d),
      );

      form.setFieldsValue({
        advertiser: Number(editRecord.adv_d),
        adv_d: match?.adv_id || "",
        Adv_name: match?.adv_name || "",
      });

      // 🔥 Force the Select to display "Adv_name (adv_d)"
      form.setFieldValue(
        "advertiser_label",
        `${match?.adv_name} (${match?.adv_id})`,
      );
    }
  }, [dropdownOptions.adv_list, editRecord, form]);

  // Fetch PID info when editRecord changes
  useEffect(() => {
    if (!editRecord) return;
    // 🔥 SEND campaign_name & OS to backend to fetch PID info
    const fetchPidInfo = async () => {
      console.log(editRecord.id, editRecord.campaign_name, editRecord.os);
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
          })),
        );

        setPausedPids(
          (res.data.paused_pids || []).map((item) => ({
            ...item,
            status: "pause",
          })),
        );
      } catch (error) {
        console.error("PID Fetch Error:", error);
      }
    };

    fetchPidInfo();
  }, [editRecord]);

  useEffect(() => {
    if (!editRecord?.tracking_url) return;
    const fetchPubs = async () => {
      try {
        setPubLoading(true);
        const res = await axios.get(`${apiUrl}/get-allpub`);
        setAllPubs(res?.data?.data?.map((i) => i.pub_id) || []);
      } finally {
        setPubLoading(false);
      }
    };
    fetchPubs();
  }, [editRecord]);

  useEffect(() => {
    if (!editRecord?.tracking_url) return;
    const fetchExistingLinks = async () => {
      try {
        const res = await axios.get(`${apiUrl2}/link/publisher`, {
          params: { campaign_id: editRecord.id },
        });
        const publishers = (res.data?.data || [])
          .filter((row) => row.status === "approved")
          .map((row) => ({
            pub_id: row.publisher_id,
            publisher_link: row.generated_link,
            impression_link: row.impression_link,
            offer_api: row.publisher_offer_api || "",
            status: row.status,
          }));
        setApprovedPublishers(publishers);
      } catch {
        // non-critical, silently ignore
      }
    };
    fetchExistingLinks();
  }, [editRecord]);

  const handleGenerateLink = async () => {
    if (!selectedPub) return;
    try {
      setPubSubmitting(true);
      const res = await axios.post(`${apiUrl2}/link/publisher`, {
        publisher_id: selectedPub,
        campaign_id: editRecord.id,
        hide_referrer: hideReferrer ? 1 : 0,
      });
      setApprovedPublishers((prev) => [
        ...prev,
        {
          pub_id: selectedPub,
          publisher_link: res.data?.publisher_link || "",
          impression_link: res.data?.impression_link || "",
          offer_api: res.data?.publisher_offer_api || "",
          status: "approved",
        },
      ]);
      setSelectedPub(null);
      setHideReferrer(false);
    } catch {
      Swal.fire("Error", "Error generating link", "error");
    } finally {
      setPubSubmitting(false);
    }
  };

  const handleDisapprove = async (pub_id) => {
    try {
      await axios.post(`${apiUrl2}/link/publisher/disapprove`, {
        campaign_id: editRecord.id,
        publisher_id: pub_id,
      });
      setApprovedPublishers((prev) => prev.filter((p) => p.pub_id !== pub_id));
      if (viewingPub?.pub_id === pub_id) setViewingPub(null);
    } catch {
      Swal.fire("Error", "Failed to disapprove publisher", "error");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({ icon: "success", title: "Copied!", text: "Copied to clipboard.", timer: 1500, showConfirmButton: false });
  };

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
    if (campaignStatus === "pause") {
      Swal.fire(
        "Campaign Paused",
        "You cannot save PID changes while campaign is paused.",
        "warning",
      );
      return;
    }
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
      String(val).toLowerCase().includes(searchText.toLowerCase()),
    ),
  );

  const filteredPausedPids = pausedPids?.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase()),
    ),
  );
  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      {/* ====== FORM CARD ====== */}
      {!isPublisherRole && (
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
              rules={[
                {
                  required: true,
                  message: "Please enter campaign name",
                },
              ]}
            >
              <AutoComplete
                placement="bottomLeft"
                getPopupContainer={(trigger) => trigger.parentNode}
                options={campaignOptions}
                disabled={!!editRecord}
                onSearch={(text) => {
                  fetchCampaignSuggestions(text);
                  if (!text?.trim()) {
                    setSelectedCampaign({ name: "", sub_campaign_id: null });
                  }
                }}
                onSelect={(value) => {
                  const found = campaignOptionsRef.current.find(
                    (opt) => opt.value === value
                  );
                  setSelectedCampaign({
                    name: found?.original_name || value,
                    sub_campaign_id: found?.sub_campaign_id ?? null,
                  });
                }}
                filterOption={false}
              >
                <Input
                  placeholder="Type Campaign Name"
                  className="h-11 rounded-lg border-gray-200 bg-gray-50"
                  suffix={
                    selectedCampaign.name != "" ? (
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {selectedCampaign.name}
                        {selectedCampaign.sub_campaign_id != null ? ` [${selectedCampaign.sub_campaign_id}]` : ""}
                      </span>
                    ) : null
                  }
                />
              </AutoComplete>
            </Form.Item>

            <Form.Item
              label="Vertical"
              name="Vertical"
              rules={[{ required: true, message: "Please select vertical" }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select Vertical"
                className="rounded-lg !h-11 border-gray-200 bg-gray-50"
                options={VERTICALS.map((vertical) => ({
                  value: vertical,
                  label: vertical,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="State/City"
              name="state_city"
              rules={[
                { required: true, message: "Please enter state or city" },
              ]}>
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
                              {
                                required: true,
                                message: "Please enter payout",
                              },
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
                              <Option value="Web">Web</Option>
                              <Option value="both" disabled={!!editRecord}>Both</Option>
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
              rules={[
                { required: true, message: "Please select MMP tracker" },
              ]}>
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
            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) => {
                const geoDetails = getFieldValue("geo_details") || [];
                const selectedOS = geoDetails?.[0]?.os;

                const urlValidator = (_, value) => {
                  if (!value) return Promise.reject(new Error("Please enter preview URL"));

                  const pattern =
                    /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/i;

                  return pattern.test(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error("Please enter valid URL"));
                };

                if (selectedOS === "both") {
                  return (
                    <>
                      <Form.Item
                        label="Android Preview Link"
                        name="preview_url_android"
                        rules={[{ validator: urlValidator }]}
                      >
                        <Input
                          placeholder="Enter Android Preview URL"
                          className="h-11 rounded-lg border-gray-200 bg-gray-50"
                        />
                      </Form.Item>

                      <Form.Item
                        label="iOS Preview Link"
                        name="preview_url_ios"
                        rules={[{ validator: urlValidator }]}
                      >
                        <Input
                          placeholder="Enter iOS Preview URL"
                          className="h-11 rounded-lg border-gray-200 bg-gray-50"
                        />
                      </Form.Item>
                    </>
                  );
                }

                return (
                  <Form.Item
                    label="Preview Link"
                    name="preview_url"
                    rules={[{ validator: urlValidator }]}
                  >
                    <Input
                      placeholder="Enter Preview URL"
                      className="h-11 rounded-lg border-gray-200 bg-gray-50"
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
            <Form.Item label="Click Tracking Link" name="tracking_url">
              <Input
                placeholder="Enter Click Tracking Link"
                className="h-11 rounded-lg border-gray-200 bg-gray-50"
              />
            </Form.Item>
            <Form.Item label="Impression Tracking Link" name="advertiser_impression_url">
              <Input
                placeholder="Enter Impression Tracking Link"
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
      )}
      {/* ====== LIVE / PAUSED CAMPAIGNS ====== */}
      {editRecord && (
        <div className="mt-8 w-full max-w-8xl">
          {/* Always show SettingsPage */}
          <SettingsPage campaignId={editRecord.id} adv_id={editRecord.adv_d} />

          {/* 👇 Only NON-publisher roles can see below components */}
          {!isPublisherRole && (
            <>
              {editRecord.tracking_url ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card title="Approved Publishers" className="shadow-md border-gray-100 rounded-2xl">
                    {approvedPublishers.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        No approved publishers yet. Select a Publisher ID and click Approve.
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 text-left">
                            <th className="px-4 py-2 font-semibold">Publisher ID</th>
                            <th className="px-4 py-2 font-semibold">Links</th>
                            <th className="px-4 py-2 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedPublishers.map((pub) => (
                            <tr key={pub.pub_id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-[#2F5D99]">{pub.pub_id}</td>
                              <td className="px-4 py-3">
                                <Button size="small" type="default"
                                  onClick={() => setViewingPub(pub)}>
                                  View
                                </Button>
                              </td>
                              <td className="px-4 py-3">
                                <Button size="small" danger
                                  onClick={() => handleDisapprove(pub.pub_id)}>
                                  Disapprove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Card>

                  <Modal
                    title={`Links for Publisher ${viewingPub?.pub_id}`}
                    open={!!viewingPub}
                    onCancel={() => setViewingPub(null)}
                    footer={null}
                    centered>
                    {viewingPub && (
                      <div className="space-y-4 mt-2">
                        {viewingPub.publisher_link && (
                          <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">Publisher Tracking Link:</p>
                            <div className="flex items-center gap-2">
                              <input type="text" readOnly value={viewingPub.publisher_link}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-700 text-sm" />
                              <Button size="small" className="!bg-green-600 hover:!bg-green-700 !text-white !rounded-lg"
                                onClick={() => copyToClipboard(viewingPub.publisher_link)}>Copy</Button>
                            </div>
                          </div>
                        )}
                        {viewingPub.impression_link && (
                          <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">Impression Link:</p>
                            <div className="flex items-center gap-2">
                              <input type="text" readOnly value={viewingPub.impression_link}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-700 text-sm" />
                              <Button size="small" className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg"
                                onClick={() => copyToClipboard(viewingPub.impression_link)}>Copy</Button>
                            </div>
                          </div>
                        )}
                        {viewingPub.offer_api && (
                          <div>
                            <p className="text-gray-600 text-sm font-medium mb-1">Publisher Offer API:</p>
                            <div className="flex items-center gap-2">
                              <input type="text" readOnly value={viewingPub.offer_api}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-700 text-sm" />
                              <Button size="small" className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg"
                                onClick={() => copyToClipboard(viewingPub.offer_api)}>Copy</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Modal>

                  {/* RIGHT — publisher selector + approve */}
                  <Card title="Not Approved Publishers" className="shadow-md border-gray-100 rounded-2xl">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-gray-700">Publisher ID</label>
                        <Select
                          placeholder="Select Publisher ID"
                          value={selectedPub}
                          onChange={(val) => setSelectedPub(val)}
                          showSearch
                          size="large"
                          loading={pubLoading}
                          className="rounded-lg w-full">
                          {allPubs
                            .filter((pid) => !approvedPublishers.find((a) => a.pub_id === pid))
                            .map((pid) => (
                              <Select.Option key={pid} value={pid}>{pid}</Select.Option>
                            ))}
                        </Select>
                      </div>
                      <div className="flex items-center px-4 py-2 border rounded-lg bg-white">
                        <Checkbox checked={hideReferrer} onChange={(e) => setHideReferrer(e.target.checked)}>
                          <span className="text-gray-700 font-medium">Hide Google Referrer</span>
                        </Checkbox>
                      </div>
                      <Button
                        type="primary"
                        size="large"
                        loading={pubSubmitting}
                        disabled={!selectedPub}
                        onClick={handleGenerateLink}
                        className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-xl !h-[48px] !text-lg !font-semibold !border-none !shadow-lg">
                        Approve
                      </Button>
                    </div>
                  </Card>
                </div>
              ) : (
                /* ── No tracking link: show Edit PID Status ── */
                <>
                  <div className="flex items-center justify-between m-4">
                    <h2 className="text-xl font-semibold text-gray-700">Edit PID Status</h2>
                    <div className="flex items-center gap-4 w-full max-w-sm ml-4">
                      <Input
                        placeholder="Search PID..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                      />
                      <Button
                        type="primary"
                        disabled={campaignStatus === "pause" || Object.keys(updatedStatus).length === 0}
                        onClick={handleSaveChanges}
                        className="px-6">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Live PID's" className="shadow-md border-gray-100 rounded-2xl">
                      {loading ? <Spin /> : <StyledTable columns={columns} dataSource={filteredLivePids} rowKey="id" />}
                    </Card>
                    <Card title="Paused PID's" className="shadow-md border-gray-100 rounded-2xl">
                      {loading ? <Spin /> : <StyledTable columns={columns} dataSource={filteredPausedPids} rowKey="id" />}
                    </Card>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateCampaignForm;

