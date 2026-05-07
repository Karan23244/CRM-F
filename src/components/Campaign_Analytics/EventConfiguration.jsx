// // components/EventConfiguration.jsx
// import React from "react";
// import { Input, Button, Tooltip } from "antd";
// import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

// /**
//  * EventConfiguration
//  * @param {string[]} value    - array of event name strings
//  * @param {function} onChange - (updatedArray) => void
//  */
// const EventConfiguration = ({ value = ["E1", "E2"], onChange }) => {
//   const handleNameChange = (index, newName) => {
//     const updated = [...value];
//     updated[index] = newName;
//     onChange(updated);
//   };

//   const addEvent = () => {
//     onChange([...value, `E${value.length + 1}`]);
//   };

//   const removeEvent = (index) => {
//     const updated = value.filter((_, i) => i !== index);
//     onChange(updated);
//   };

//   return (
//     <div className="space-y-2">
//       {value.map((eventName, index) => {
//         const isDefault = index < 2;
//         return (
//           <div key={index} className="flex items-center gap-2">
//             <span className="text-xs font-mono text-gray-400 w-8">
//               E{index + 1}
//             </span>
//             <Input
//               value={eventName}
//               onChange={(e) => handleNameChange(index, e.target.value)}
//               placeholder={`Event ${index + 1} name`}
//               className="flex-1"
//               size="middle"
//             />
//             {!isDefault && (
//               <Tooltip title="Remove event">
//                 <Button
//                   type="text"
//                   danger
//                   icon={<DeleteOutlined />}
//                   size="small"
//                   onClick={() => removeEvent(index)}
//                 />
//               </Tooltip>
//             )}
//           </div>
//         );
//       })}

//       <Button
//         type="dashed"
//         icon={<PlusOutlined />}
//         onClick={addEvent}
//         className="w-full mt-2"
//         size="middle">
//         Add More Event
//       </Button>

//       <p className="text-xs text-gray-400 mt-1">
//         Stored as:{" "}
//         <code className="bg-gray-100 px-1 rounded text-gray-600">
//           {JSON.stringify(value)}
//         </code>
//       </p>
//     </div>
//   );
// };

// export default EventConfiguration;

// components/EventConfiguration.jsx
import React from "react";
import { Input, Button, Tooltip, Card, Badge, Divider } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

const EventConfiguration = ({ value = ["Purchase", "Install"], onChange }) => {
  const handleNameChange = (index, newName) => {
    const updated = [...value];
    updated[index] = newName;
    onChange(updated);
  };

  const addEvent = () => {
    onChange([...value, `Event ${value.length + 1}`]);
  };

  const removeEvent = (index) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <Card
      className="rounded-3xl border-0 shadow-lg">

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {value.map((eventName, index) => {
          const isDefault = index < 2;

          return (
            <div
              key={index}
              className="
                group relative overflow-hidden
                bg-white border border-gray-200
                rounded-2xl p-5
              ">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">

                  {/* Event Label */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Event E{index + 1}
                    </h3>

                    <p className="text-xs text-gray-400">
                      Tracking configuration
                    </p>
                  </div>
                </div>

                {/* Delete */}
                {!isDefault && (
                  <Tooltip title="Remove event">
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      className="
                        opacity-70 group-hover:opacity-100
                        hover:bg-red-50
                        rounded-xl
                      "
                      onClick={() => removeEvent(index)}
                    />
                  </Tooltip>
                )}
              </div>

              {/* Large Input */}
              <Input
                value={eventName}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder={`Enter Event ${index + 1} Name`}
                size="large"
                className="
                  rounded-2xl h-14 text-base font-medium
                  hover:border-blue-400
                  focus:border-blue-500
                "
              />
            </div>
          );
        })}
      </div>

      {/* Add Event */}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addEvent}
        className="
          mt-6 w-full h-14
          rounded-2xl
          border-2 border-dashed
          border-blue-300
          text-blue-600
          font-semibold text-base
          hover:border-blue-500
          hover:text-blue-500
          hover:bg-blue-50
          transition-all
        ">
        Add New Event
      </Button>
    </Card>
  );
};

export default EventConfiguration;
