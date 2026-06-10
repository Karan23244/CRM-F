// import { useSelector } from "react-redux";
// import { useState } from "react";
// import { Select } from "antd";
// import ValidationPublisher from "./ValidationPublisher";
// import ValidationAdvertiser from "./ValidationAdvertiser";
// import ValidationPublisherExternal from "./ValidationPublisherExternal";
// const { Option } = Select;

// export default function Billing() {
//   const { user } = useSelector((state) => state.auth);
//   const roles = user?.role || [];

//   const isAdmin = roles.includes("admin");
//   const isPublisher =
//     roles.includes("publisher") || roles.includes("publisher_manager") || roles.includes("pub_executive");
//   const isAdvertiser =
//     roles.includes("advertiser") || roles.includes("advertiser_manager") || roles.includes("adv_executive");
//   const isPublisherExternal = roles.includes("publisher_external");
//   const [mode, setMode] = useState("publisher");

//   if (isAdmin) {
//     return (
//       <div className="p-6 bg-white rounded shadow">
//         <div className="mb-4">
//           <Select value={mode} onChange={setMode} style={{ width: 240 }}>
//             <Option value="publisher">Publisher Billing</Option>
//             <Option value="advertiser">Advertiser Billing</Option>
//           </Select>
//         </div>

//         {mode === "publisher" ? (
//           <ValidationPublisher />
//         ) : (
//           <ValidationAdvertiser />
//         )}
//       </div>
//     );
//   }

//   if (isPublisher) return <ValidationPublisher />;
//   if (isAdvertiser) return <ValidationAdvertiser />;
//   if (isPublisherExternal) {
//     return <ValidationPublisherExternal />;
//   }
//   return <div>No billing access</div>;
// }

import { useSelector } from "react-redux";
import { useState } from "react";
import { Select } from "antd";
import ValidationPublisher from "./ValidationPublisher";
import ValidationAdvertiser from "./ValidationAdvertiser";
import ValidationPublisherExternal from "./ValidationPublisherExternal";

const { Option } = Select;

export default function Billing() {
  const { user } = useSelector((state) => state.auth);
  const roles = user?.role || [];

  const isAdmin = roles.includes("admin");
  const isPublisher =
    roles.includes("publisher") ||
    roles.includes("publisher_manager") ||
    roles.includes("pub_executive");

  const isAdvertiser =
    roles.includes("advertiser") ||
    roles.includes("advertiser_manager") ||
    roles.includes("adv_executive");

  const isPublisherExternal = roles.includes("publisher_external");

  const [mode, setMode] = useState("publisher");

  if (isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center px-5 mb-3">
          <h2 className="text-xl font-semibold">Billing Validation</h2>

          <Select
            value={mode}
            onChange={setMode}
            style={{ width: 240, padding: "0px" }}>
            <Option value="publisher">Publisher Billing</Option>
            <Option value="advertiser">Advertiser Billing</Option>
          </Select>
        </div>

        {mode === "publisher" ? (
          <ValidationPublisher />
        ) : (
          <ValidationAdvertiser />
        )}
      </div>
    );
  }

  if (isPublisher) return <ValidationPublisher />;
  if (isAdvertiser) return <ValidationAdvertiser />;
  if (isPublisherExternal) return <ValidationPublisherExternal />;

  return (
    <div className="flex justify-center items-center h-40">
      <p className="text-gray-500">No billing access</p>
    </div>
  );
}
