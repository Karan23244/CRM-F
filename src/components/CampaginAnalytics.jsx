// import React, { useState } from "react";
// import CampaignDashboard from "./CampainDashboard";
// import Comparison from "./Comparison"; // Assuming this is the second component you want to toggle

// const CampaginAnalytics = () => {
//   const [activeComponent, setActiveComponent] = useState("A"); // Default is A

//   return (
//     <div className="flex flex-col min-h-screen bg-gray-50 px-4 py-6">
//       <div className="mb-6 flex justify-start gap-4">
//         <button
//           onClick={() => setActiveComponent("A")}
//           className={`px-4 py-2 rounded-full font-semibold transition ${
//             activeComponent === "A"
//               ? "bg-blue-600 text-white"
//               : "bg-blue-100 text-blue-700 hover:bg-blue-200"
//           }`}>
//           Campaign Dashboard
//         </button>
//         <button
//           onClick={() => setActiveComponent("B")}
//           className={`px-4 py-2 rounded-full font-semibold transition ${
//             activeComponent === "B"
//               ? "bg-blue-600 text-white"
//               : "bg-blue-100 text-blue-700 hover:bg-blue-200"
//           }`}>
//           Comparison
//         </button>
//       </div>

//       <div className="w-full">
//         {activeComponent === "A" ? <CampaignDashboard /> : <Comparison />}
//       </div>
//     </div>
//   );
// };

import React from "react";

const ComingSoon = () => {
  return (
    <div className="flex items-center justify-center min-h-screen text-white px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl text-black md:text-6xl font-bold mb-4 animate-pulse">
          Coming Soon
        </h1>
        <p className="text-lg text-black md:text-xl mb-8">
          We're working hard to bring something amazing. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;


// export default CampaginAnalytics;
