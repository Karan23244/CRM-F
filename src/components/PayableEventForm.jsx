import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Button, Input } from "antd";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const PayableEventForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [event, setEvent] = useState("");
  const [events, setEvents] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all payable events
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/get-paybleevernt`);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (data && data.success) setEvents(data.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async () => {
    const trimmedEvent = event.trim();
    if (!trimmedEvent) return;

    try {
      if (editId !== null) {
        const response = await axios.post(`${apiUrl}/update-event/${editId}`, {
          user_id: user?.id,
          payble_event: trimmedEvent,
        });

        if (response.data.success === true) {
          Swal.fire(
            "Updated!",
            "Payable Event updated successfully",
            "success"
          );
          fetchEvents();
          setEditIndex(null);
          setEditId(null);
        } else {
          Swal.fire("Error", "Failed to update Payable Event", "error");
        }
      } else {
        const response = await axios.post(`${apiUrl}/add-paybleevernt`, {
          user_id: user?.id,
          payble_event: trimmedEvent,
        });

        if (response.status === 500) {
          Swal.fire("Duplicate", "Payable Event already exists!", "warning");
        } else if (response.data.success) {
          Swal.fire("Added!", "Payable Event added successfully", "success");
          fetchEvents();
        } else {
          Swal.fire("Error", "Failed to add Payable Event", "error");
        }
      }
    } catch (error) {
      Swal.fire(
        "Error",
        "Something went wrong. Please try again later.",
        "error"
      );
    }

    setEvent("");
  };

  const handleEdit = (record) => {
    setEvent(record.payble_event);
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
      title: "Event",
      dataIndex: "payble_event",
      key: "payble_event",
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

  const filteredEvents = events.filter((ev) =>
    ev.payble_event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="m-6 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-lg font-bold mb-3 text-gray-800">
        Add Payable Event
      </h2>

      {/* Floating label style input */}
      <div className="relative w-full sm:w-96 mb-4">
        <Input
          id="event"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          className="pt-4 pb-1 !rounded-lg shadow-sm focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500"
          placeholder="Add Payable Event"
        />
        <Button type="primary" className="mt-3" onClick={handleSubmit}>
          {editIndex !== null ? "Update" : "Submit"}
        </Button>
      </div>

      {/* Event Table with Search */}
      {events.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-700">Event List</h3>
            <div className="relative mt-4 sm:mt-0 w-full sm:w-72">
              <Input
                placeholder="Search Event..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 !rounded-lg shadow-sm focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500"
              />
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredEvents}
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

export default PayableEventForm;
