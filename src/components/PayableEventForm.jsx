import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Button } from "antd";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

const PayableEventForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [event, setEvent] = useState("");
  const [events, setEvents] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);

  // Fetch all payable events
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/get-paybleevernt`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.success) {
        setEvents(data.data);
      } else {
        console.error("Unexpected API response:", data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };
  useEffect(() => {
    fetchEvents();
  }, []);

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!event.trim()) return;

    try {
      if (editIndex !== null) {
        const response = await axios.post(`${apiUrl}/update-event/${editId}`, {
          user_id: user?.id,
          payble_event: event,
        });
        if (response.data.success === true) {
          const updatedEvents = [...events];
          updatedEvents[editIndex] = response.data;
          setEvents(updatedEvents);
          setEditIndex(null);
          fetchEvents();
          setEditId(null);
        }
      } else {
        const response = await axios.post(`${apiUrl}/add-paybleevernt`, {
          user_id: user?.id,
          payble_event: event,
        });
        if (response.data.success === true) {
          setEvents([...events, response.data]);
          fetchEvents();
        }
      }
    } catch (error) {
      console.error("Error submitting event:", error);
    }
    setEvent("");
  };

  // Function to handle edit button click
  const handleEdit = (index) => {
    setEvent(events[index].payble_event);
    setEditIndex(index);
    setEditId(events[index].id);
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
      title: "Event",
      dataIndex: "payble_event",
      key: "payble_event",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record, index) => (
        <Button type="primary" onClick={() => handleEdit(index)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className=" m-6 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-lg font-bold mb-4">Add Payable Event</h2>
      <InputField label="Payable Event" value={event} onChange={setEvent} />
      <Button type="primary" className="mt-2" onClick={handleSubmit}>
        {editIndex !== null ? "Update" : "Submit"}
      </Button>

      {/* Data Table */}
      {events.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">Event List</h3>
          <Table
            columns={columns}
            dataSource={events}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      )}
    </div>
  );
};

export default PayableEventForm;
