import React, { useState, useEffect } from "react";
import InputField from "../InputField";
import axios from "axios";
import { Table, Button } from "antd";
import { useSelector } from "react-redux";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const ReviewForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);

  // Fetch all reviews
  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-reviews`);
      if (response.data && response.data.success) {
        setReviews(response.data.data);
      } else {
        console.error("Unexpected API response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!review.trim()) return;

    try {
      if (editIndex !== null) {
        // Update existing review
        const response = await axios.post(
          `${apiUrl}/update-reviews/${editId}`,
          {
            user_id: user?.id,
            review_text: review,
          }
        );
        if (response.data.success) {
          Swal.fire("Success", "Review updated successfully", "success");
          fetchReviews();
          setEditIndex(null);
          setEditId(null);
        } else {
          Swal.fire("Error", "Failed to update review", "error");
        }
      } else {
        // Add new review
        const response = await axios.post(`${apiUrl}/add-reviews`, {
          user_id: user?.id,
          review_text: review,
        });
        if (response.data.success) {
          Swal.fire("Success", "Review added successfully", "success");
          fetchReviews();
        } else {
          Swal.fire("Error", "Failed to add review", "error");
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      Swal.fire(
        "Error",
        "An error occurred while submitting the review",
        "error"
      );
    }

    setReview("");
  };

  const handleEdit = (record) => {
    setReview(record.review_text);
    setEditId(record.id);
    setEditIndex(true);
  };

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Review",
      dataIndex: "review_text",
      key: "review_text",
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
      <h2 className="text-lg font-bold mb-4">Add Review</h2>
      <InputField label="Review" value={review} onChange={setReview} />
      <Button type="primary" className="mt-2" onClick={handleSubmit}>
        {editIndex !== null ? "Update" : "Submit"}
      </Button>

      {reviews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">Review List</h3>
          <Table
            columns={columns}
            dataSource={reviews}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewForm;
