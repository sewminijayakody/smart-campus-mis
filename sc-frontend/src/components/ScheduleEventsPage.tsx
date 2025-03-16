// src/components/ScheduleEventsPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";

const ScheduleEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

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

      const eventData = {
        title,
        location,
        time,
        date: date.toISOString().split("T")[0], // Store as YYYY-MM-DD
      };

      await axios.post("http://localhost:5000/api/events", eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setError(null);
      alert("Event scheduled successfully!");
      navigate("/admin-dashboard"); // Redirect back to dashboard
    } catch (error) {
      console.error("Error scheduling event:", error);
      setError("Failed to schedule event. Please try again.");
    }
  };

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
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <Calendar
                onChange={(value) => setDate(value as Date)}
                value={date}
                className="border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
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
              <label className="block text-sm font-medium text-gray-700">Time</label>
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
              <label className="block text-sm font-medium text-gray-700">Location</label>
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