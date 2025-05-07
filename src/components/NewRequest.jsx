import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, message } from "antd";
import axios from "axios";
import { subscribeToNotifications } from "./Socket";
import { notification } from "antd";
import { useSelector } from "react-redux";

const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";

const NewRequest = () => {
  const user = useSelector((state) => state.auth.user);
  const username = user?.username || null;
  console.log(username);
  const [requests, setRequests] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    fetchRequests();

    subscribeToNotifications((data) => {
      console.log(data);
      if (data?.id !== null) {
        fetchRequests();
      }
    });
  }, []);

  console.log(requests);
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
      message.success(`Status updated to "${status}"`);
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error("Failed to update status:", error);
      message.error("Failed to update status");
    }
  };
  

  const columns = [
    { title: "Publisher", dataIndex: "pub_name", key: "pub_name" }, // Directly using the name from the API response
    { title: "Campaign", dataIndex: "campaign_name", key: "campaign_name" },
    { title: "PUB Payout $", dataIndex: "payout", key: "payout" },
    { title: "OS", dataIndex: "os", key: "os" },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <div className="flex gap-2">
          {["waiting", "shared", "rejected"].map((status) => (
            <Button
              key={status}
              size="small"
              type={record.adv_res === status ? "default" : "primary"}
              disabled={record.adv_res === status}
              onClick={() => handleStatusUpdate(record.id, status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">All Campaign Requests</h2>
      <Table dataSource={requests} columns={columns} rowKey="id" />
    </div>
  );
};

export default NewRequest;
