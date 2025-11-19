import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Input, Tooltip } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import StyledTable from "../../Utils/StyledTable";

const apiUrl =
  import.meta.env.VITE_API_URL;

const ReviewForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch reviews
  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-reviews`);
      if (response.data?.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // ✅ Handle submit / update
  const handleSubmit = async () => {
    if (!review.trim()) {
      Swal.fire("Warning", "Please enter a review", "warning");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        const res = await axios.post(`${apiUrl}/update-reviews/${editId}`, {
          user_id: user?.id,
          review_text: review,
        });
        if (res.data.success) {
          Swal.fire("Success", "Review updated successfully", "success");
        } else {
          Swal.fire("Error", "Failed to update review", "error");
        }
      } else {
        const res = await axios.post(`${apiUrl}/add-reviews`, {
          user_id: user?.id,
          review_text: review,
        });
        if (res.data.success) {
          Swal.fire("Success", "Review added successfully", "success");
        } else {
          Swal.fire("Error", "Failed to add review", "error");
        }
      }
      setReview("");
      setEditId(null);
      fetchReviews();
    } catch (error) {
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setReview(record.review_text);
    setEditId(record.id);
  };

  // ✅ Table Columns
  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Review",
      dataIndex: "review_text",
      key: "review_text",
      render: (text) => <span className="text-gray-800">{text}</span>,
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Tooltip title="Edit Review">
          <EditOutlined
            onClick={() => handleEdit(record)}
            className="text-[#2F5D99] hover:text-[#24487A] text-lg cursor-pointer"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="m-8 p-6 shadow-xl rounded-2xl ">
      <h2 className="text-xl font-semibold mb-6 text-[#2F5D99]">
        Manage Reviews
      </h2>

      {/* ✅ Input and Button in one line */}
      <div className="flex items-center gap-3 mb-6">
        <Input
          placeholder="Write your review..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="h-12 rounded-lg border-gray-300 focus:border-[#2F5D99] focus:ring-1 focus:ring-[#2F5D99] text-base"
        />
        <Button
          type="default"
          onClick={handleSubmit}
          loading={loading}
          className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-10 !py-5 !h-12 !text-lg !border-none !shadow-md">
          {editId ? "Update Review" : "Submit Review"}
        </Button>
      </div>

      {/* ✅ Styled Table */}
      <div className="rounded-lg overflow-hidden shadow">
        <StyledTable
          columns={columns}
          dataSource={reviews}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          className="custom-table"
        />
      </div>

      {/* ✅ Extra Table Styles */}
      <style jsx>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f2f6fc;
          color: #2f5d99;
          font-weight: 600;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f9fbff;
        }
      `}</style>
    </div>
  );
};

export default ReviewForm;
