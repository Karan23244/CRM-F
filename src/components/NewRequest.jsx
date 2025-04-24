import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, message } from "antd";
import axios from "axios";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const NewRequest = () => {
  const [requests, setRequests] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);
  console.log(requests);
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-allrequests`);
      setRequests(res.data?.data || []);
    } catch (error) {
      message.error("Failed to fetch requests");
    }
  };

  const handleUpdateClick = (record) => {
    setEditingRequest(record);
    setNewLink(record.adv_res || "");
  };

  const handleUpdateSubmit = async () => {
    try {
      const response = await axios.put(`${apiUrl}/updaterequest`, {
        id: editingRequest.id,
        adv_res: newLink,
      });
      alert("Link updated successfully");
      setEditingRequest(null);
      setNewLink("");
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update link");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Advertiser", dataIndex: "adv_name", key: "adv_name" }, // Directly using the name from the API response
    { title: "Campaign", dataIndex: "campaign_name", key: "campaign_name" },
    { title: "Payout", dataIndex: "payout", key: "payout" },
    { title: "OS", dataIndex: "os", key: "os" },
    {
      title: "Link",
      dataIndex: "adv_res",
      key: "adv_res",
      render: (text) => <p>{text || "Pending"}</p>,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Button type="link" onClick={() => handleUpdateClick(record)}>
          Update Link
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">All Campaign Requests</h2>
      <Table dataSource={requests} columns={columns} rowKey="id" />

      <Modal
        title="Update Link"
        open={!!editingRequest}
        onOk={handleUpdateSubmit}
        onCancel={() => setEditingRequest(null)}
        okText="Update">
        <Input
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="Enter new link"
        />
      </Modal>
    </div>
  );
};

export default NewRequest;
