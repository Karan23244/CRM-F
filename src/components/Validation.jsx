import React, { useState, useEffect, useRef } from "react";
import { Select, Input, Checkbox, DatePicker, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import InvoiceComponent from "./Invoice";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

function Validation() {
  const invoiceRef = useRef();
  const [advData, setAdvData] = useState([]);
  const [advAllData, setAllAdvData] = useState([]);
  const [selectedAdv, setSelectedAdv] = useState([]);
  const [toEmails, setToEmails] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [address, setAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [textContent, setTextContent] = useState(`Hi Team,

Greetings from Click Orbits!!
Kindly find attached the invoice for MONTH YYYY,
At the outset, we'd like to thank you for your continued support and relationship. 
It's a privilege for us to work with ADV NAME and a pleasure for us to provide you with the best of our services. 

For any clarification, kindly feel free to get in touch with us.`);
  const [htmlContent, setHtmlContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [isINR, setIsINR] = useState(false);
  const [inrValue, setInrValue] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [calculatedResult, setCalculatedResult] = useState(null);

  useEffect(() => {
    fetchAdvData();
    axios
      .get(`${apiUrl}/get-NameAdv`)
      .then((res) => setAdvData(res.data.data))
      .catch((err) => console.error("Error fetching advertisers", err));
  }, []);

  const fetchAdvData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-advdata`);
      if (response.data.success) {
        setAllAdvData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching advertiser data:", error);
    }
  };

  const amountWithSign = calculatedResult
    ? `${isINR ? "₹" : "$"}${calculatedResult}`
    : "";

  const handleAdvChange = (selectedValues) => {
    setSelectedAdv(selectedValues);
    const selectedAdvs = advData.filter((item) =>
      selectedValues.includes(item.adv_name)
    );
    const pocEmails = selectedAdvs
      .map((item) => item.poc_email)
      .filter(Boolean)
      .join(", ");
    const accEmails = selectedAdvs
      .map((item) => item.acc_email)
      .filter(Boolean)
      .join(", ");
    setToEmails(pocEmails);
    setCcEmails(accEmails);
  };

  useEffect(() => {
    if (textContent.trim()) {
      const html = textContent
        .split("\n")
        .map((line) => `<p>${line.trim()}</p>`)
        .join("");
      setHtmlContent(html);
    } else {
      setHtmlContent("");
    }
  }, [textContent]);

  useEffect(() => {
    if (!selectedAdv.length || !selectedMonth) {
      setCalculatedResult(null);
      return;
    }
    const selectedCampaigns = advAllData.filter((item) =>
      selectedAdv.some(
        (selected) =>
          selected.toLowerCase() === item.campaign_name?.toLowerCase()
      )
    );
    const filteredByMonth = selectedCampaigns.filter((item) => {
      if (!item.shared_date) return false;
      return (
        dayjs(item.shared_date).format("YYYY-MM") ===
        dayjs(selectedMonth).format("YYYY-MM")
      );
    });
    const total = filteredByMonth.reduce((acc, item) => {
      const approved = parseFloat(item.adv_approved_no) || 0;
      const payout = parseFloat(item.adv_payout) || 0;
      return acc + approved * payout;
    }, 0);

    if (isINR) {
      const rate = parseFloat(inrValue);
      if (!rate || rate <= 0) {
        setCalculatedResult(null);
        return;
      }
      setCalculatedResult((total * rate).toFixed(2));
    } else {
      setCalculatedResult(total.toFixed(2));
    }
  }, [selectedAdv, selectedMonth, advAllData, isINR, inrValue]);

  const handleAttachmentChange = (info) => {
    if (info.file.status === "done" || info.file.status === "uploading") {
      setAttachment(info.file.originFileObj);
      setAttachmentName(info.file.name);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    const formValues = {
      selectedAdv,
      toEmails,
      ccEmails,
      bccEmails,
      subject,
      textContent,
      htmlContent,
      attachmentName,
      isINR,
      inrValue,
      selectedMonth: selectedMonth
        ? dayjs(selectedMonth).format("YYYY-MM")
        : null,
      calculatedResult,
      address,
    };

    Object.entries(formValues).forEach(([key, val]) => {
      const valueToAppend = Array.isArray(val)
        ? JSON.stringify(val)
        : val ?? "";
      formData.append(key, valueToAppend);
    });

    if (attachment) {
      formData.append("attachment", attachment);
    }

    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const invoiceElement = invoiceRef.current;
      if (!invoiceElement) {
        console.error("Invoice element not found!");
        return;
      }

      const canvas = await html2canvas(invoiceElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output("blob");

      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
      window.open(pdfUrl);

      formData.append("invoice_pdf", pdfBlob, "invoice.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDF generation failed.");
    }
  };

  return (
    <div className="max-w-8xl mx-auto my-2 p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-3xl font-bold text-center mb-6">Validation Form</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-1">Advertisers</label>
          <Select
            mode="multiple"
            allowClear
            className="w-full"
            placeholder="Select advertisers"
            onChange={handleAdvChange}>
            {advData?.map((adv) => (
              <Option key={adv.id} value={adv.adv_name}>
                {adv.adv_name}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block font-medium mb-1">To</label>
          <Input
            value={toEmails}
            onChange={(e) => setToEmails(e.target.value)}
            placeholder="Comma-separated emails"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">CC</label>
          <Input
            value={ccEmails}
            onChange={(e) => setCcEmails(e.target.value)}
            placeholder="Comma-separated emails"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">BCC</label>
          <Input
            value={bccEmails}
            onChange={(e) => setBccEmails(e.target.value)}
            placeholder="Comma-separated emails"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block font-medium mb-1">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block font-medium mb-1">Plain Text</label>
          <Input.TextArea
            rows={15}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Plain text message"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="block font-medium mb-1">Address</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <Upload
            beforeUpload={() => false}
            onChange={handleAttachmentChange}
            maxCount={1}>
            <Button icon={<UploadOutlined />}>Attach File</Button>
          </Upload>
          {attachmentName && (
            <p className="mt-1 text-sm text-gray-600">
              Attached: {attachmentName}
            </p>
          )}
        </div>

        <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 items-center">
          <Checkbox
            checked={isINR}
            onChange={(e) => setIsINR(e.target.checked)}>
            ClickOrbits Pvt Ltd (INR)
          </Checkbox>
          <Checkbox
            checked={!isINR}
            onChange={(e) => setIsINR(!e.target.checked)}>
            ClickOrbits Pte Ltd (USD)
          </Checkbox>
          {isINR && (
            <Input
              type="number"
              className="w-40"
              value={inrValue}
              onChange={(e) => setInrValue(e.target.value)}
              placeholder="INR Rate (e.g., 83.5)"
            />
          )}
        </div>

        <div className="col-span-1 md:col-span-2">
          <DatePicker
            picker="month"
            className="w-full"
            onChange={(value) => setSelectedMonth(value)}
          />
        </div>

        <div className="col-span-1 md:col-span-2 text-right">
          <Button type="primary" onClick={handleSubmit}>
            Generate & Submit PDF
          </Button>
        </div>
      </div>

      {/* 🛠 Hidden component for PDF rendering */}
      <div className="hidden">
        <div ref={invoiceRef}>
          <InvoiceComponent
            advertisers={selectedAdv}
            address={address}
            month={selectedMonth}
            amount={amountWithSign}
          />
        </div>
      </div>
    </div>
  );
}

export default Validation;
