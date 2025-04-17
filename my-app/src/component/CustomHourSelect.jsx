import { useState } from "react";

const CustomHourSelect = ({ scheduledTime, setScheduledTime }) => {
  const [open, setOpen] = useState(false);

  const hours = [...Array(24)].map((_, i) => {
    const hour24 = i.toString().padStart(2, "0");
    const hour12 = i % 12 === 0 ? 12 : i % 12;
    const ampm = i < 12 ? "AM" : "PM";
    return {
      label: `${hour12}:00 ${ampm}`,
      value: `${hour24}:00`,
    };
  });

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          border: "1px solid #ccc",
          padding: "8px",
          cursor: "pointer",
          background: "#fff",
          borderRadius: "5px",
          marginTop: "10px",
        }}
      >
        {scheduledTime
          ? hours.find((h) => h.value === scheduledTime)?.label
          : "Select Time"}
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            maxHeight: "180px",
            overflowY: "auto",
            border: "1px solid #ccc",
            background: "#fff",
            zIndex: 100,
          }}
        >
          {hours.map((hour) => (
            <div
              key={hour.value}
              onClick={() => {
                setScheduledTime(hour.value);
                setOpen(false);
              }}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                backgroundColor: scheduledTime === hour.value ? "#f4c806" : "#fff",}}
            >
              {hour.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default CustomHourSelect;