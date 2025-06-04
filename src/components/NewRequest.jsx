import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, message, Select } from "antd";
import axios from "axios";
import { subscribeToNotifications } from "./Socket";
import { notification } from "antd";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

const { Option } = Select;

const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";

const NewRequest = () => {
  const user = useSelector((state) => state.auth.user);
  const username = user?.username || null;
  const [requests, setRequests] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [editingRequest, setEditingRequest] = useState(null);
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    fetchRequests();

    subscribeToNotifications((data) => {
      if (data?.id !== null) {
        fetchRequests();
      }
    });
  }, []);
  const filteredRequests = requests.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    )
  );
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getPubRequestss/${username}`);
      const result = res.data?.data;

      if (Array.isArray(result)) {
        setRequests(result);
      } else {
        console.error("Expected an array but got:", result);
        setRequests([]); // Fallback to empty array
      }
    } catch (error) {
      message.error("Failed to fetch requests");
      setRequests([]); // Also fallback on error
    }
  };

  const handleUpdateClick = (record) => {
    setEditingRequest(record);
    setNewLink(record.adv_res || "");
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${apiUrl}/updateAdvRes`, {
        id,
        adv_res: status,
      });
      // Swal.fire({
      //   icon: "success",
      //   title: "Updated!",
      //   text: `Status updated to "${status}"`,
      // });

      fetchRequests(); // Refresh data
    } catch (error) {
      console.error("Failed to update status:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update status",
      });
    }
  };

  const columns = [
    { title: "Publisher", dataIndex: "pub_name", key: "pub_name" }, // Directly using the name from the API response
    { title: "Campaign", dataIndex: "campaign_name", key: "campaign_name" },
    { title: "PUB Payout $", dataIndex: "payout", key: "payout" },
    { title: "OS", dataIndex: "os", key: "os" },
    {
      title: "PID",
      dataIndex: "pid",
      key: "pid",
    },
    {
      title: "PUB ID",
      dataIndex: "pub_id",
      key: "pub_id",
    },
    {
      title: "Geo",
      dataIndex: "geo",
      key: "geo",
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Select
          defaultValue={record.adv_res}
          style={{ width: 120 }}
          onChange={(value) => handleStatusUpdate(record.id, value)}>
          {[
            "waiting",
            "shared",
            "rejected",
            "Handshake Pending",
            "in-use",
            "poor performance",
          ].map((status) => (
            <Option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Option>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">All Campaign Requests</h2>

      <Input
        placeholder="Search across all fields..."
        className="mb-4"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
      />

      <Table dataSource={filteredRequests} columns={columns} rowKey="id" />
    </div>
  );
};

export default NewRequest;
