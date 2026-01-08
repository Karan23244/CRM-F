// import { useEffect, useState } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";
// const apiUrl = import.meta.env.VITE_API_URL4;

// const DealList = () => {
//   const [deals, setDeals] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // modal state
//   const [showModal, setShowModal] = useState(false);
//   const [editDeal, setEditDeal] = useState(null);

//   // ---------------- FETCH DEALS ----------------
//   const fetchDeals = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/api/deals`);

//       // normalize is_active (IMPORTANT)
//       const normalized = (res.data.data || []).map((d) => ({
//         ...d,
//         is_active: Number(d.is_active),
//       }));

//       setDeals(normalized);
//     } catch {
//       Swal.fire("Error", "Failed to load deals", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDeals();
//   }, []);

//   // ---------------- TOGGLE STATUS ----------------
//   const toggleStatus = async (deal) => {
//     try {
//       await axios.put(
//         `http://localhost:5500/api/deals/${deal.id}/status`,
//         { is_active: deal.is_active === 1 ? 0 : 1 }
//       );
//       fetchDeals();
//     } catch {
//       Swal.fire("Error", "Failed to update status", "error");
//     }
//   };

//   // ---------------- DELETE ----------------
//   const handleDelete = async (id) => {
//     const confirm = await Swal.fire({
//       title: "Delete Deal?",
//       text: "This action cannot be undone",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#dc2626",
//     });

//     if (!confirm.isConfirmed) return;

//     try {
//       await axios.delete(`http://localhost:5500/api/deals/${id}`);
//       Swal.fire("Deleted", "Deal deleted successfully", "success");
//       fetchDeals();
//     } catch {
//       Swal.fire("Error", "Failed to delete deal", "error");
//     }
//   };

//   // ---------------- EDIT ----------------
//   const openEditModal = (deal) => {
//     setEditDeal({ ...deal });
//     setShowModal(true);
//   };

//   const handleUpdate = async () => {
//     try {
//       await axios.put(
//         `http://localhost:5500/api/deals/${editDeal.id}`,
//         editDeal
//       );
//       Swal.fire("Updated", "Deal updated successfully", "success");
//       setShowModal(false);
//       fetchDeals();
//     } catch {
//       Swal.fire("Error", "Failed to update deal", "error");
//     }
//   };

//   if (loading) {
//     return <p className="text-center mt-10">Loading deals...</p>;
//   }

//   return (
//     <div className="p-6 bg-white rounded shadow">
//       <h2 className="text-xl font-bold mb-4">Deals</h2>

//       <div className="overflow-x-auto">
//         <table className="w-full border">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="border p-2">#</th>
//               <th className="border p-2">Title</th>
//               <th className="border p-2">Offer</th>
//               <th className="border p-2">Payout</th>
//               <th className="border p-2">Status</th>
//               <th className="border p-2">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {deals.map((d, i) => (
//               <tr key={d.id} className="text-center">
//                 <td className="border p-2">{i + 1}</td>
//                 <td className="border p-2">{d.title}</td>
//                 <td className="border p-2">{d.offer}</td>
//                 <td className="border p-2">
//                   {d.discount_payout} {d.currency}
//                 </td>

//                 {/* STATUS */}
//                 <td className="border p-2">
//                   <button
//                     onClick={() => toggleStatus(d)}
//                     className={`px-3 py-1 text-white rounded text-sm ${
//                       d.is_active === 1
//                         ? "bg-green-600"
//                         : "bg-gray-500"
//                     }`}
//                   >
//                     {d.is_active === 1 ? "Active" : "Inactive"}
//                   </button>
//                 </td>

//                 {/* ACTIONS */}
//                 <td className="border p-2 space-x-2">
//                   <button
//                     onClick={() => openEditModal(d)}
//                     className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
//                   >
//                     Edit
//                   </button>

//                   <button
//                     onClick={() => handleDelete(d.id)}
//                     className="bg-red-600 text-white px-3 py-1 rounded text-sm"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}

//             {deals.length === 0 && (
//               <tr>
//                 <td colSpan="6" className="p-6 text-center text-gray-500">
//                   No deals found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* ================= EDIT MODAL ================= */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded w-[420px]">
//             <h3 className="text-lg font-bold mb-4">Edit Deal</h3>

//             <input
//               className="w-full border p-2 mb-2"
//               value={editDeal.title}
//               onChange={(e) =>
//                 setEditDeal({ ...editDeal, title: e.target.value })
//               }
//               placeholder="Title"
//             />

//             <input
//               className="w-full border p-2 mb-2"
//               value={editDeal.offer}
//               onChange={(e) =>
//                 setEditDeal({ ...editDeal, offer: e.target.value })
//               }
//               placeholder="Offer"
//             />

//             <input
//               className="w-full border p-2 mb-2"
//               value={editDeal.discount_payout}
//               onChange={(e) =>
//                 setEditDeal({
//                   ...editDeal,
//                   discount_payout: e.target.value,
//                 })
//               }
//               placeholder="Discount Payout"
//             />

//             <input
//               className="w-full border p-2 mb-4"
//               value={editDeal.geo}
//               onChange={(e) =>
//                 setEditDeal({ ...editDeal, geo: e.target.value })
//               }
//               placeholder="Geo"
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
//   );
// };

// export default DealList;

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Modal, Form, Input, Switch, Tag, Space, Card } from "antd";
import StyledTable from "../../Utils/StyledTable";

const apiUrl = import.meta.env.VITE_API_URL4;

const Listoffer = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [form] = Form.useForm();

  // ---------------- FETCH DEALS ----------------
  const fetchDeals = async () => {
    try {
      const res = await axios.get("https://api.steptosale.com/api/deals/", {
        withCredentials: true,
      });
      console.log(res);
      const normalized = (res.data.data || []).map((d) => ({
        ...d,
        status: Number(d.status),
      }));
      setDeals(normalized);
    } catch {
      Swal.fire("Error", "Failed to load deals", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // ---------------- STATUS TOGGLE ----------------
  const toggleStatus = async (deal) => {
    try {
      const res = await axios.put(`${apiUrl}/api/deals/${deal.id}/status/`, {
        withCredentials: true,
        status: deal.status === 1 ? 0 : 1,
      });
      console.log(res);
      fetchDeals();
    } catch {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Deal?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${apiUrl}/api/deals/${id}/`, {
        withCredentials: true,
      });
      Swal.fire("Deleted", "Deal deleted successfully", "success");
      fetchDeals();
    } catch {
      Swal.fire("Error", "Failed to delete deal", "error");
    }
  };

  // ---------------- EDIT ----------------
  const openEditModal = (deal) => {
    setEditDeal(deal);
    form.setFieldsValue(deal);
    setOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`${apiUrl}/api/deals/${editDeal.id}`, values);
      Swal.fire("Updated", "Deal updated successfully", "success");
      setOpen(false);
      fetchDeals();
    } catch {
      Swal.fire("Error", "Failed to update deal", "error");
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
      title: "Offer",
      dataIndex: "offer",
    },
    {
      title: "Payout",
      render: (d) => (
        <Tag color="#2F5D99">
          {d.discount_payout} {d.currency}
        </Tag>
      ),
    },
    {
      title: "Status",
      render: (deal) => (
        <Switch
          checked={deal.status === 1}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => toggleStatus(deal)}
          style={{
            backgroundColor: deal.status === 1 ? "#2F5D99" : undefined,
          }}
        />
      ),
    },
    {
      title: "Actions",
      render: (deal) => (
        <Space>
          <Button
            type="primary"
            size="small"
            className="!bg-[#2F5D99]"
            onClick={() => openEditModal(deal)}>
            Edit
          </Button>
          <Button danger size="small" onClick={() => handleDelete(deal.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card className="shadow-md rounded-xl">
      <StyledTable
        title="Deals Management"
        dataSource={deals}
        columns={columns}
        loading={loading}
      />

      {/* ================= EDIT MODAL ================= */}
      <Modal
        open={open}
        title="Edit Deal"
        onCancel={() => setOpen(false)}
        onOk={handleUpdate}
        okText="Save Changes">
        <Form layout="vertical" form={form}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Offer" name="offer" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Discount Payout"
            name="discount_payout"
            rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Geo" name="geo">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Listoffer;
