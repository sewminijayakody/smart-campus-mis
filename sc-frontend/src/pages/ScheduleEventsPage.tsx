// src/pages/ScheduleEventsPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import axios from "axios";

const ScheduleEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  console.log(
    "Rendering ScheduleEventsPage at /schedule-events, selected date:",
    date
  );

  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !time || !location || !date) {
      setError("All fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required.");
        return;
      }

      // Format the date as YYYY-MM-DD using local date components
      const formattedDate = date
        .toLocaleDateString("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "-"); // Converts to YYYY-MM-DD format
      console.log("Formatted date for submission:", formattedDate);

      const eventData = {
        title,
        location,
        time,
        date: formattedDate, // Use the formatted local date
      };
      console.log("Sending event data:", eventData);

      await axios.post(`${import.meta.env.VITE_API_URL}/events`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setError(null);
      alert("Event scheduled successfully!");
      navigate("/admin-dashboard");
    } catch (error: any) {
      console.error(
        "Axios error details:",
        error.response ? error.response.data : error.message
      );
      setError("Failed to schedule event. Please try again.");
    }
  };

  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
    );
  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    console.log("Date selected (local time):", newDate);
    console.log("Date selected (ISO string):", newDate.toISOString());
    setDate(newDate);
  };

  const getMonthName = (date: Date) =>
    date.toLocaleString("default", { month: "long" });
  const getYear = (date: Date) => date.getFullYear();
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Schedule New Event</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
            aria-label="Back to Admin Dashboard"
          >
            <FaArrowLeft />
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <div className="bg-[#E7FFED] p-4 rounded-lg shadow-md border-45 border-[#D8F3E3] mt-2 flex justify-center">
                <div className="w-full max-w-sm">
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={handlePrevMonth}
                      className="text-xxs font-medium text-gray-600 hover:text-[#FF7700]"
                    >
                      <FaArrowLeft />
                    </button>
                    <h3 className="text-xxs font-medium">
                      {getMonthName(currentMonth)} {getYear(currentMonth)}
                    </h3>
                    <button
                      onClick={handleNextMonth}
                      className="text-xxs font-medium text-gray-600 hover:text-[#FF7700]"
                    >
                      <FaArrowRight />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                      <div
                        key={day}
                        className="text-xxs font-semibold text-gray-600"
                      >
                        {day}
                      </div>
                    ))}
                    {Array.from(
                      { length: getFirstDayOfMonth(currentMonth) },
                      (_, i) => (
                        <div key={`empty-${i}`} />
                      )
                    )}
                    {Array.from(
                      { length: getDaysInMonth(currentMonth) },
                      (_, i) => {
                        const day = i + 1;
                        const isSelected =
                          day === date.getDate() &&
                          currentMonth.getMonth() === date.getMonth() &&
                          currentMonth.getFullYear() === date.getFullYear();
                        const isToday =
                          day === new Date().getDate() &&
                          currentMonth.getMonth() === new Date().getMonth() &&
                          currentMonth.getFullYear() ===
                            new Date().getFullYear();
                        return (
                          <div
                            key={day}
                            className={`text-xxs p-1 rounded-full cursor-pointer ${
                              isSelected
                                ? "bg-[#FF7700] text-white"
                                : isToday
                                ? "bg-orange-300"
                                : "hover:bg-gray-200"
                            }`}
                            onClick={() => handleDateSelect(day)}
                          >
                            {day}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 p-2 w-full border rounded-lg bg-gray-100 text-gray-700"
                placeholder="e.g., Guest Lecture on AI"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 p-2 w-full border rounded-lg bg-gray-100 text-gray-700"
                placeholder="e.g., 10:00 AM - 12:00 PM"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 p-2 w-full border rounded-lg bg-gray-100 text-gray-700"
                placeholder="e.g., Conference Hall"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#FF7700] text-white p-2 rounded-lg hover:bg-orange-600 transition"
            >
              Schedule Event
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEventsPage;
