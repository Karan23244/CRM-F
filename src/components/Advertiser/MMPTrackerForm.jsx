import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Button, Input } from "antd";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const MMPTrackerForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [tracker, setTracker] = useState("");
  const [trackers, setTrackers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  useEffect(() => {
    fetchTrackers();
  }, []);

  const handleSubmit = async () => {
    const trimmed = tracker.trim();
    if (!trimmed) return;

    try {
      if (editId !== null) {
        const response = await axios.post(
          `${apiUrl}/update-mmptracker/${editId}`,
          {
            user_id: user?.id,
            mmptext: trimmed,
          }
        );
        if (response.data.success === true) {
          Swal.fire("Success!", "Tracker updated successfully", "success");
          fetchTrackers();
          setEditId(null);
        }
      } else {
        const response = await axios.post(`${apiUrl}/add-mmptracker`, {
          user_id: user?.id,
          mmptext: trimmed,
        });
        if (response.data.success === true) {
          Swal.fire("Success!", "Tracker added successfully", "success");
          fetchTrackers();
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        Swal.fire("Duplicate!", "Tracker already exists.", "error");
      } else {
        Swal.fire("Error", "Something went wrong. Try again later.", "error");
      }
    }

    setTracker("");
  };

  const handleEdit = (record) => {
    setTracker(record.mmptext);
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

  const filteredTrackers = trackers.filter((t) =>
    t.mmptext.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="m-6 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-lg font-bold mb-3 text-gray-800">Add MMP Tracker</h2>

      {/* Floating Label Input */}
      <div className="relative w-full sm:w-96 mb-4">
        <Input
          id="mmp"
          value={tracker}
          onChange={(e) => setTracker(e.target.value)}
          className="pt-4 pb-1 !rounded-lg shadow-sm focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500"
          placeholder="Add MMP Tracker"
        />
        <Button type="primary" className="mt-3" onClick={handleSubmit}>
          {editIndex !== null ? "Update" : "Submit"}
        </Button>
      </div>

      {/* Tracker List + Search */}
      {trackers.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-700">
              Tracker List
            </h3>
            <div className="relative mt-4 sm:mt-0 w-full sm:w-72">
              <Input
                placeholder="Search Tracker..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 !rounded-lg shadow-sm focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500"
              />
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredTrackers}
            rowKey="id"
            pagination={{
              pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            className="rounded-lg shadow-sm"
          />
        </div>
      )}
    </div>
  );
};

export default MMPTrackerForm;
