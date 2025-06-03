import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Table, Button, Input } from "antd";
import Swal from "sweetalert2";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

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

  useEffect(() => {
    fetchPids();
  }, []);

  const handleSubmit = async () => {
    const trimmedPid = pid.trim();
    if (!trimmedPid) return;

    try {
      if (editIndex !== null) {
        const response = await axios.post(`${apiUrl}/update-pid/${editId}`, {
          user_id: user?.id,
          pid: trimmedPid,
        });

        if (response.data.success) {
          Swal.fire("Updated!", "PID updated successfully.", "success");
          fetchPids();
          setEditIndex(null);
          setEditId(null);
        } else {
          Swal.fire("Error!", "Failed to update PID.", "error");
        }
      } else {
        const response = await axios.post(`${apiUrl}/add-pid`, {
          user_id: user?.id,
          pid: trimmedPid,
        });

        if (response.status === 500) {
          Swal.fire("Warning", "PID already exists!", "warning");
        } else if (response.data.success) {
          Swal.fire("Success!", "PID added successfully.", "success");
          fetchPids();
        } else {
          Swal.fire("Error!", "Failed to add PID.", "error");
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        Swal.fire("Warning", "PID already exists!", "warning");
      } else {
        console.error("Error:", error);
        Swal.fire("Error", "Something went wrong. Please try again.", "error");
      }
    }

    setPid("");
  };

  const handleEdit = (record) => {
    setPid(record.pid);
    setEditId(record.id);
  };

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
      render: (text, record) => (
        <Button type="primary" onClick={() => handleEdit(record)}>
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

      {pids.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">PID List</h3>
          <Table
            columns={columns}
            dataSource={pids}
            rowKey={(record) => record.id}
            pagination={{ pageSize: 10 }}
          />
        </div>
      )}
    </div>
  );
};

export default PIDForm;
