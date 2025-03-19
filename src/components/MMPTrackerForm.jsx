import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Button, message } from "antd";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

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

    try {
      if (editIndex !== null) {
        // Update existing tracker
        const response = await axios.post(
          `${apiUrl}/update-mmptracker/${editId}`,
          {
            user_id: user?.id,
            mmptext: tracker,
          }
        );
        if (response.data.success === true) {
          alert("Tracker updated successfully");
          fetchTrackers(); // Refresh the tracker list
          setEditIndex(null);
          setEditId(null);
        }
      } else {
        // Add new tracker
        const response = await axios.post(`${apiUrl}/add-mmptracker`, {
          user_id: user?.id,
          mmptext: tracker,
        });
        if (response.data.success === true) {
          alert("Tracker added successfully");
          fetchTrackers(); // Refresh the tracker list
        }
      }
    } catch (error) {
      console.error("Error submitting tracker:", error);
      message.error("An error occurred while submitting the tracker");
    }
    setTracker("");
  };

  // Function to handle edit button click
  const handleEdit = (index) => {
    setTracker(trackers[index].mmptext);
    setEditIndex(index);
    setEditId(trackers[index].id);
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
      render: (_, __, index) => (
        <Button type="primary" onClick={() => handleEdit(index)}>
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
