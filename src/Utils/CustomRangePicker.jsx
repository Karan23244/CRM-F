import React, { useEffect, useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const CustomRangePicker = ({
  value,
  onChange,
  className = "w-full sm:w-[250px]",
  placement = "bottomLeft",
  allowClear = true,
  defaultToCurrentMonth = true,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (dates) => {
    if ((!dates || dates.length === 0) && defaultToCurrentMonth) {
      onChange([dayjs().startOf("month"), dayjs().endOf("month")]);
    } else {
      onChange(dates);
    }
  };

  return (
    <RangePicker
      value={value}
      onChange={handleChange}
      allowClear={allowClear}
      placement={placement}
      placeholder={["Start Date", "End Date"]}
      className={className}
      popupMatchSelectWidth={false}
      getPopupContainer={() => document.body}
      dropdownClassName={isMobile ? "mobile-range-picker" : ""}
    />
  );
};

export default CustomRangePicker;
