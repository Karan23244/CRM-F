// // export default LoginForm;
// import { useEffect, useState } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";
// import { useNavigate } from "react-router-dom";
// import { List } from "antd";

// const Listoffer = () => {
//   const [campaigns, setCampaigns] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   // EDIT MODAL STATE
//   const [showModal, setShowModal] = useState(false);
//   const [editData, setEditData] = useState(null);

//   // ---------------- FETCH CAMPAIGNS ----------------
//   // const fetchCampaigns = async () => {
//   //   try {
//   //     const res = await axios.get("http://localhost:5500/api/campaigns");
//   //     setCampaigns(res.data.data || []);
//   //   } catch {
//   //     Swal.fire("Error", "Failed to load campaigns", "error");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const fetchCampaigns = async () => {
//     const res = await axios.get("http://localhost:5500/api/campaigns");

//     const normalized = (res.data.data || []).map((c) => ({
//       ...c,
//       is_active: Number(c.is_active) // 🔥 force number
//     }));

//     setCampaigns(normalized);
//   };
// console.log("data",campaigns);
//   useEffect(() => {
//     fetchCampaigns();
//   }, []);

//   // ---------------- DELETE ----------------
//   const handleDelete = async (id) => {
//     const confirm = await Swal.fire({
//       title: "Delete campaign?",
//       text: "This action cannot be undone",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#dc2626"
//     });

//     if (!confirm.isConfirmed) return;

//     await axios.delete(`http://localhost:5500/api/campaigns/${id}`);
//     Swal.fire("Deleted", "Campaign removed", "success");
//     fetchCampaigns();
//   };

//   // ---------------- STATUS TOGGLE ----------------
//   const toggleStatus = async (c) => {
//     await axios.put(
//       `http://localhost:5500/api/campaigns/${c.id}/status`,
//       { is_active: c.is_active ? 0 : 1 }
//     );
//     console.log("Status toggled");
//     fetchCampaigns();
//   };

//   // ---------------- OPEN EDIT MODAL ----------------
//   const openEditModal = (campaign) => {
//     setEditData(campaign);
//     setShowModal(true);
//   };

//   // ---------------- UPDATE ----------------
//   const handleUpdate = async () => {
//     try {
//       await axios.put(
//         `http://localhost:5500/api/campaigns/${editData.id}`,
//         editData
//       );

//       Swal.fire("Updated", "Campaign updated successfully", "success");
//       setShowModal(false);
//       fetchCampaigns();
//     } catch {
//       Swal.fire("Error", "Update failed", "error");
//     }
//   };

//   // if (loading) return <p className="text-center mt-10">Loading...</p>;

//   return (
//     <>

//     <div className="p-6 bg-white rounded shadow">
//       <h2 className="text-xl font-bold mb-4">Campaigns</h2>

//       <table className="w-full border">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="border p-2">#</th>
//             <th className="border p-2">Title</th>
//             <th className="border p-2">Category</th>
//             <th className="border p-2">Payout</th>
//             <th className="border p-2">Status</th>
//             <th className="border p-2">Actions</th>
//           </tr>
//         </thead>

//         <tbody>
//           {campaigns.map((c, i) => (
//             <tr key={c.id} className="text-center">
//               <td className="border p-2">{i + 1}</td>
//               <td className="border p-2">{c.title}</td>
//               <td className="border p-2">{c.categories}</td>
//               <td className="border p-2">{c.payout}</td>

//               <td className="border p-2">
//   <button
//     onClick={() => toggleStatus(c)}
//     className={`px-3 py-1 text-white rounded ${
//       Number(c.is_active) === 1 ? "bg-green-600" : "bg-gray-500"
//     }`}
//   >
//     {Number(c.is_active) === 1 ? "Active" : "Inactive"}
//   </button>
// </td>

//               <td className="border p-2 space-x-2">
//                 <button
//                   onClick={() => openEditModal(c)}
//                   className="bg-blue-600 text-white px-3 py-1 rounded"
//                 >
//                   Edit
//                 </button>

//                 <button
//                   onClick={() => handleDelete(c.id)}
//                   className="bg-red-600 text-white px-3 py-1 rounded"
//                 >
//                   Delete
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {/* ================= EDIT MODAL ================= */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
//           <div className="bg-white p-6 rounded w-[400px]">
//             <h3 className="text-lg font-bold mb-4">Edit Campaign</h3>

//             <input
//               className="w-full border p-2 mb-2"
//               value={editData.title}
//               onChange={(e) =>
//                 setEditData({ ...editData, title: e.target.value })
//               }
//               placeholder="Title"
//             />

//             <input
//               className="w-full border p-2 mb-2"
//               value={editData.categories}
//               onChange={(e) =>
//                 setEditData({ ...editData, categories: e.target.value })
//               }
//               placeholder="Category"
//             />

//             <input
//               className="w-full border p-2 mb-4"
//               value={editData.payout}
//               onChange={(e) =>
//                 setEditData({ ...editData, payout: e.target.value })
//               }
//               placeholder="Payout"
//             />

//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="px-4 py-2 border rounded"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={handleUpdate}
//                 className="px-4 py-2 bg-blue-600 text-white rounded"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//     </>
//   );
// };

// export default Listoffer;
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Modal, Form, Input, Switch, Space, Card, Tag } from "antd";
import StyledTable from "../../Utils/StyledTable";
const apiUrl = import.meta.env.VITE_API_URL4;

const Listdeals = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form] = Form.useForm();

  // ---------------- FETCH CAMPAIGNS ----------------
  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/campaigns`);
      console.log("Fetched campaigns:", res.data);
      const normalized = (res.data.data || []).map((c) => ({
        ...c,
        is_active: Number(c.is_active),
      }));
      setCampaigns(normalized);
    } catch {
      Swal.fire("Error", "Failed to load campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ---------------- STATUS TOGGLE ----------------
  const toggleStatus = async (campaign) => {
    try {
      await axios.put(`${apiUrl}/api/campaigns/${campaign.id}/status`, {
        is_active: campaign.is_active === 1 ? 0 : 1,
      });
      fetchCampaigns();
    } catch {
      Swal.fire("Error", "Status update failed", "error");
    }
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Campaign?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    await axios.delete(`${apiUrl}/api/campaigns/${id}`);
    Swal.fire("Deleted", "Campaign removed", "success");
    fetchCampaigns();
  };

  // ---------------- EDIT ----------------
  const openEditModal = (campaign) => {
    setEditData(campaign);
    form.setFieldsValue(campaign);
    setOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const res = await axios.put(
        `${apiUrl}/api/campaigns/${editData.id}`,
        values,
        {
          withCredentials: true,
        }
      );
      console.log("Update response:", res);
      Swal.fire("Updated", "Campaign updated successfully", "success");
      setOpen(false);
      fetchCampaigns();
    } catch (err) {
      console.log("Update error:", err);
      Swal.fire("Error", "Update failed", "error");
    }
  };

  // ---------------- TABLE COLUMNS ----------------
  const columns = [
    {
      title: "#",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Title",
      dataIndex: "title",
    },
    {
      title: "Category",
      dataIndex: "categories",
      render: (cat) => <Tag color="purple">{cat}</Tag>,
    },
    {
      title: "Payout",
      dataIndex: "payout",
      render: (p) => <Tag color="#2F5D99">{p}</Tag>,
    },
    {
      title: "Status",
      render: (campaign) => (
        <Switch
          checked={campaign.is_active === 1}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => toggleStatus(campaign)}
          style={{
            backgroundColor: campaign.is_active === 1 ? "#2F5D99" : undefined,
          }}
        />
      ),
    },
    {
      title: "Actions",
      render: (campaign) => (
        <Space>
          <Button
            type="primary"
            size="small"
            className="!bg-[#2F5D99]"
            onClick={() => openEditModal(campaign)}>
            Edit
          </Button>
          <Button danger size="small" onClick={() => handleDelete(campaign.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card className="shadow-md rounded-xl">
      <StyledTable
        title="Campaign Management"
        dataSource={campaigns}
        columns={columns}
        loading={loading}
      />

      {/* ================= EDIT MODAL ================= */}
      <Modal
        open={open}
        title="Edit Campaign"
        onCancel={() => setOpen(false)}
        onOk={handleUpdate}
        okText="Save Changes">
        <Form layout="vertical" form={form}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Category"
            name="categories"
            rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Payout" name="payout" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Listdeals;
