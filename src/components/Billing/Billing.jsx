import { useSelector } from "react-redux";
import { useState } from "react";
import { Select } from "antd";
import ValidationPublisher from "./ValidationPublisher";
import ValidationAdvertiser from "./ValidationAdvertiser";
import ValidationPublisherExternal from "./ValidationPublisherExternal";
const { Option } = Select;

export default function Billing() {
  const { user } = useSelector((state) => state.auth);
  const roles = user?.role || [];

  const isAdmin = roles.includes("admin");
  const isPublisher =
    roles.includes("publisher") || roles.includes("publisher_manager");
  const isAdvertiser =
    roles.includes("advertiser") || roles.includes("advertiser_manager");
  const isPublisherExternal = roles.includes("publisher_external");
  const [mode, setMode] = useState("publisher");

  if (isAdmin) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <div className="mb-4">
          <Select value={mode} onChange={setMode} style={{ width: 240 }}>
            <Option value="publisher">Publisher Billing</Option>
            <Option value="advertiser">Advertiser Billing</Option>
          </Select>
        </div>

        {mode === "publisher" ? (
          <ValidationPublisher />
        ) : (
          <ValidationAdvertiser />
        )}
      </div>
    );
  }

  if (isPublisher) return <ValidationPublisher />;
  if (isAdvertiser) return <ValidationAdvertiser />;
  if (isPublisherExternal) {
    return <ValidationPublisherExternal />;
  }
  return <div>No billing access</div>;
}
