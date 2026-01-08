import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import StyledTable from "../../Utils/StyledTable";

const apiUrl = import.meta.env.VITE_API_URL4;
const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- FETCH CATEGORIES ----------------
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/categories`);
      setCategories(res.data.data || []);
    } catch (error) {
      Swal.fire("Error", "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ---------------- DELETE CATEGORY ----------------
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Category?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${apiUrl}/api/categories/${id}`);
      Swal.fire("Deleted", "Category deleted successfully", "success");
      fetchCategories();
    } catch (error) {
      Swal.fire("Error", "Failed to delete category", "error");
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Loading categories...</p>;
  }
  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      render: (icon, record) => (
        <div className="flex justify-center items-center">
          <img
            src={icon}
            alt={record.categore}
            className="w-full max-w-[120px] h-[80px] object-contain"
          />
        </div>
      ),
    },
    {
      title: "Category Name",
      dataIndex: "categore",
      key: "categore",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <button
          onClick={() => handleDelete(record.id)}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
          Delete
        </button>
      ),
      align: "center",
    },
  ];
  return (
    <div className="w-full mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Categories</h2>
      {/* Table Component */}
      <StyledTable
        className="mt-5 bg-white"
        dataSource={categories}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        bordered
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default CategoryList;
