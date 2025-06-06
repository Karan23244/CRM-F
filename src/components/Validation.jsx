import React, { useEffect, useState, useRef } from "react";
import { Select, Input, Checkbox, DatePicker, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import InvoiceComponent from "./Invoice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ReactDOMServer from "react-dom/server";
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

function Validation() {
  const [advData, setAdvData] = useState([]);
  const [advAllData, setAllAdvData] = useState([]);
  const [selectedAdv, setSelectedAdv] = useState([]);
  const [toEmails, setToEmails] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bccEmails, setBccEmails] = useState("");
  const [address, setAddress] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [subject, setSubject] = useState("");
  const [textContent, setTextContent] = useState(``);
  const [htmlContent, setHtmlContent] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [isINR, setIsINR] = useState(false);
  const [inrValue, setInrValue] = useState("");
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const invoiceRef = useRef(null);
  useEffect(() => {
    const formattedMonth = selectedMonth
      ? dayjs(selectedMonth).format("MMMM YYYY")
      : "[Select Month]";
    const formattedAdvs = selectedAdv.join(", ") || "[Select Advertiser]";

    const updatedText = `Hi Team,

Greetings from Click Orbits!!
Kindly find attached the invoice for ${formattedMonth}.
At the outset, we'd like to thank you for your continued support and relationship. 
It's a privilege for us to work with ${formattedAdvs} and a pleasure for us to provide you with the best of our services. 

For any clarification, kindly feel free to get in touch with us.`;

    setTextContent(updatedText);
  }, [selectedMonth, selectedAdv]);

  const selectedDate = selectedMonth?.$d
    ? new Date(selectedMonth.$d)
    : new Date();
  const month = selectedDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
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

  // Convert plain text into HTML (basic wrapping only)
  useEffect(() => {
    if (textContent.trim()) {
      const html = textContent
        .split("\n")
        .map((line) => <p>${line.trim()}</p>)
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
    setIsSubmitting(true);
    try {
      if (!invoiceRef.current) {
        alert("Invoice preview is not ready.");
        return;
      }

      // Generate canvas from the invoice DOM
      const canvas = await html2canvas(invoiceRef.current, { scale: 1 }); // Scale 1 for smaller size
      const imgData = canvas.toDataURL("image/png");

      // Create PDF from canvas image
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output("blob"); // 📌 Actual file, not base64
      const fileName = `Invoice-${Date.now()}.pdf`;

      // Email HTML content
      const EmailTemplate = () => (
        <div>
          <p>Hi Team,</p>
          <p>Greetings from Click Orbits!!</p>
          <p>
            Kindly find attached the invoice for <strong>{month}</strong>.
          </p>
          <p>
            At the outset, we'd like to thank you for your continued support and
            relationship. It's a privilege for us to work with{" "}
            <strong>{selectedAdv}</strong> and a pleasure for us to provide you
            with the best of our services.
          </p>
          <p>
            For any clarification, kindly feel free to get in touch with us.
          </p>
        </div>
      );
      const htmlContent = ReactDOMServer.renderToStaticMarkup(
        <EmailTemplate />
      );

      // Clean email lists
      const toList = toEmails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const ccList = ccEmails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const bccList = bccEmails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      // Create FormData payload
      const formData = new FormData();
      formData.append("to", JSON.stringify(toList));
      formData.append("cc", JSON.stringify(ccList));
      formData.append("bcc", JSON.stringify(bccList));
      formData.append("subject", subject);
      formData.append("text", textContent);
      formData.append("html", htmlContent);
      formData.append("attachment", pdfBlob, fileName); // ✅ actual file, no base64
      // for (let [key, value] of formData.entries()) {
      //   if (value instanceof Blob) {
      //     console.log(
      //       `${key}: [Blob] name=${value.name}, type=${value.type}, size=${value.size}`
      //     );
      //   } else {
      //     console.log(`${key}: ${value}`);
      //   }
      // }

      // Send request
      const response = await fetch(`${apiUrl}/email`, {
        method: "POST",
        body: formData,
      });

      // if (!response.ok) throw new Error("Failed to send email");
      alert("✅ Invoice emailed successfully!");
      // 👉 Open the PDF in new browser tab
      const pdfURL = URL.createObjectURL(pdfBlob);
      window.open(pdfURL, "_blank");
    } catch (error) {
      console.error("❌ Error sending PDF:", error);
      alert("Failed to send invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto my-8 p-8 bg-white shadow-2xl rounded-2xl border border-gray-200">
      <h1 className="text-4xl font-bold text-center text-blue-800 mb-10">
        📩 Validation Form
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Advertisers */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Advertisers
          </label>
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

        {/* To */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            To
          </label>
          <Input
            value={toEmails}
            onChange={(e) => setToEmails(e.target.value)}
            placeholder="Comma-separated emails"
          />
        </div>

        {/* CC */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            CC
          </label>
          <Input
            value={ccEmails}
            onChange={(e) => setCcEmails(e.target.value)}
            placeholder="Comma-separated emails"
          />
        </div>

        {/* BCC */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            BCC
          </label>
          <Input
            value={bccEmails}
            onChange={(e) => setBccEmails(e.target.value)}
            placeholder="Comma-separated emails"
          />
        </div>

        {/* Subject */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Subject
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>

        {/* Text Content */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Plain Text
          </label>
          <Input.TextArea
            rows={8}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Plain text message"
          />
        </div>

        {/* Address */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Address
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
          />
        </div>

        {/* File Upload */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Attachment
          </label>
          <Upload
            beforeUpload={() => false}
            onChange={handleAttachmentChange}
            maxCount={1}>
            <Button icon={<UploadOutlined />}>Attach File</Button>
          </Upload>
          {attachmentName && (
            <p className="mt-2 text-sm text-green-600 font-medium">
              Attached: {attachmentName}
            </p>
          )}
        </div>

        {/* Currency & Value */}
        <div className="col-span-1 md:col-span-2 flex flex-wrap items-center gap-6">
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
              className="w-52"
              value={inrValue}
              onChange={(e) => setInrValue(e.target.value)}
              placeholder="INR Rate (e.g., 83.5)"
            />
          )}
        </div>

        {/* Month Picker */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Month
          </label>
          <DatePicker
            picker="month"
            className="w-full"
            onChange={(date) => setSelectedMonth(date)}
            placeholder="Select month"
          />
        </div>

        {/* Calculated Result */}
        {calculatedResult && (
          <div className="col-span-1 md:col-span-2 p-4 bg-green-100 text-green-800 text-lg rounded-lg text-center">
            Total Payout:{" "}
            <strong>
              {isINR ? "₹" : "$"}
              {calculatedResult}
            </strong>
          </div>
        )}

        {/* Hidden Invoice for PDF */}
        <div className="hidden">
          <Input.TextArea rows={4} value={htmlContent} readOnly />
        </div>
        <div className="hidden">
          <div
            ref={invoiceRef}
            style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
            <InvoiceComponent
              selectedAdvertisers={selectedAdv}
              amount={calculatedResult}
              isINR={isINR}
              selectedMonth={selectedMonth}
              address={address}
            />
          </div>
        </div>

        {/* Preview Invoice */}
        {showPreview && (
          <div className="col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-lg mt-6 shadow">
            <InvoiceComponent
              selectedAdvertisers={selectedAdv}
              amount={calculatedResult}
              isINR={isINR}
              selectedMonth={selectedMonth}
              address={address}
            />
          </div>
        )}

        {/* Preview Toggle */}
        <div className="col-span-1 md:col-span-2 text-center mt-4">
          <Button type="default" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "Hide Invoice Preview" : "Show Invoice Preview"}
          </Button>
        </div>

        {/* Submit Button */}
        <div className="col-span-1 md:col-span-2 text-center mt-8">
          <Button
            type="primary"
            size="large"
            className="px-10"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Validation;
