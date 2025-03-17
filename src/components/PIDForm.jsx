import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Table, Button, Input, message } from "antd";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

const PIDForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [pid, setPid] = useState("");
  const [pids, setPids] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);

  // Function to fetch all PIDs
  const fetchPids = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-pid`);
      if (response.data && response.data.success) {
        setPids(response.data.data);
      } else {
        console.error("Unexpected API response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching PIDs:", error);
    }
  };

  // Fetch PIDs on component mount
  useEffect(() => {
    fetchPids();
  }, []);

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!pid.trim()) return;

    try {
      if (editIndex !== null) {
        // Update existing PID
        const response = await axios.post(`${apiUrl}/update-pid/${editId}`, {
          user_id: user?.id,
          pid: pid,
        });
        if (response.data.success) {
          message.success("PID updated successfully");
          fetchPids(); // Refresh the PID list
          setEditIndex(null);
          setEditId(null);
        } else {
          message.error("Failed to update PID");
        }
      } else {
        // Add new PID
        const response = await axios.post(`${apiUrl}/add-pid`, {
          user_id: user?.id,
          pid: pid,
        });
        if (response.data.success) {
          message.success("PID added successfully");
          fetchPids(); // Refresh the PID list
        } else {
          message.error("Failed to add PID");
        }
      }
    } catch (error) {
      console.error("Error submitting PID:", error);
      message.error("An error occurred while submitting the PID");
    }
    setPid("");
  };

  // Function to handle edit button click
  const handleEdit = (index) => {
    setPid(pids[index].pid);
    setEditIndex(index);
    setEditId(pids[index].id);
  };

  // Define table columns
  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "PID",
      dataIndex: "pid",
      key: "pid",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, __, index) => (
        <Button type="primary" onClick={() => handleEdit(index)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-lg font-bold mb-4">Add PID</h2>
      <Input
        placeholder="Enter PID"
        value={pid}
        onChange={(e) => setPid(e.target.value)}
      />
      <Button type="primary" className="m-6" onClick={handleSubmit}>
        {editIndex !== null ? "Update" : "Submit"}
      </Button>

      {/* Data Table */}
      {pids.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">PID List</h3>
          <Table
            columns={columns}
            dataSource={pids}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      )}
    </div>
  );
};

export default PIDForm;
