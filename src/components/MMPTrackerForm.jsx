import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Button, message } from "antd";
import Swal from "sweetalert2";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const MMPTrackerForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [tracker, setTracker] = useState("");
  const [trackers, setTrackers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);

  // Function to fetch all MMP trackers
  const fetchTrackers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-mmptracker`);
      if (response.data && response.data.success) {
        setTrackers(response.data.data);
      } else {
        console.error("Unexpected API response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching trackers:", error);
    }
  };

  // Fetch trackers on component mount
  useEffect(() => {
    fetchTrackers();
  }, []);

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!tracker.trim()) return;
    const trimmedTracker = tracker.trim();
    if (!trimmedTracker) return;

    try {
      if (editId !== null) {
        const response = await axios.post(
          `${apiUrl}/update-mmptracker/${editId}`,
          {
            user_id: user?.id,
            mmptext: trimmedTracker,
          }
        );
        if (response.data.success === true) {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Tracker updated successfully",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchTrackers();
          setEditId(null);
        }
      } else {
        const response = await axios.post(`${apiUrl}/add-mmptracker`, {
          user_id: user?.id,
          mmptext: trimmedTracker,
        });
        if (response.data.success === true) {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Tracker added successfully",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchTrackers();
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        Swal.fire({
          icon: "error",
          title: "Duplicate Tracker!",
          text: "Tracker already exists. Please use a different one.",
        });
      } else {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong. Please try again later.",
        });
      }
    }

    setTracker("");
  };

  // Function to handle edit button click
  const handleEdit = (record) => {
    setTracker(record.mmptext);
    setEditId(record.id);
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
      title: "Tracker",
      dataIndex: "mmptext",
      key: "mmptext",
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
      <h2 className="text-lg font-bold mb-4">Add MMP Tracker</h2>
      <InputField label="MMP Tracker" value={tracker} onChange={setTracker} />
      <Button type="primary" className="mt-2" onClick={handleSubmit}>
        {editIndex !== null ? "Update" : "Submit"}
      </Button>

      {/* Data Table */}
      {trackers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">Tracker List</h3>
          <Table
            columns={columns}
            dataSource={trackers}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      )}
    </div>
  );
};

export default MMPTrackerForm;
