import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Button, Input } from "antd";
import {
  EditOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Swal from "sweetalert2";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const PayableEventForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [event, setEvent] = useState("");
  const [events, setEvents] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/get-paybleevernt`);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (data?.success) setEvents(data.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async () => {
    const trimmedEvent = event.trim();
    if (!trimmedEvent) return;

    try {
      let response;
      if (editId) {
        response = await axios.post(`${apiUrl}/update-event/${editId}`, {
          user_id: user?.id,
          payble_event: trimmedEvent,
        });

        if (response.data.success) {
          Swal.fire(
            "Updated!",
            "Payable Event updated successfully",
            "success"
          );
        } else {
          Swal.fire("Error", "Failed to update Payable Event", "error");
        }
      } else {
        response = await axios.post(`${apiUrl}/add-paybleevernt`, {
          user_id: user?.id,
          payble_event: trimmedEvent,
        });

        if (response.status === 500) {
          Swal.fire("Duplicate", "Payable Event already exists!", "warning");
        } else if (response.data.success) {
          Swal.fire("Added!", "Payable Event added successfully", "success");
        } else {
          Swal.fire("Error", "Failed to add Payable Event", "error");
        }
      }

      fetchEvents();
      setEvent("");
      setEditId(null);
    } catch (error) {
      Swal.fire(
        "Error",
        "Something went wrong. Please try again later.",
        "error"
      );
    }
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
      width: 70,
    },
    {
      title: "Payable Event",
      dataIndex: "payble_event",
      key: "payble_event",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          icon={<EditOutlined />}
          className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-md !border-none"
          size="small"
          onClick={() => handleEdit(record)}
        />
      ),
    },
  ];

  const filteredEvents = events.filter((ev) =>
    ev.payble_event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="m-6 p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Payable Events
      </h2>

      {/* Control Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col md:flex-row items-end gap-4 md:gap-6 lg:gap-4">
        {/* Input */}
        <div className="flex flex-col flex-grow w-full md:w-1/3">
          <Input
            placeholder="Enter Payable Event"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="!rounded-lg !h-11 shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            type="default"
            icon={editId ? <EditOutlined /> : <PlusOutlined />}
            onClick={handleSubmit}
            className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-8 !h-11 !border-none !shadow-md">
            {editId ? "Update" : "Add"}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <h3 className="text-md font-semibold text-gray-700 mb-2 sm:mb-0">
          Event List
        </h3>
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search Event..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="!rounded-lg !h-10 shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredEvents}
        rowKey="id"
        loading={loading}
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
  );
};

export default PayableEventForm;
