// src/pages/ScheduleClassesPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCalendarPlus } from "react-icons/fa";
import axios from "axios";
import { useUser } from "../context/UserContext";

interface Schedule {
  id: number;
  module: string;
  course: string;
  date: string;
  time: string;
  location: string;
  created_at: string;
  registeredUsers?: number;
}

const ScheduleClassesPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    date: "",
    time: "",
    location: "",
  });
  const [scheduleMessage, setScheduleMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user?.module) {
          console.error("No token or module found");
          return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/schedule`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { module: user.module },
          }
        );
        setSchedules(response.data);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [user?.module]);

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.module || !user?.course) {
      setScheduleMessage(
        "No module or course assigned. Please contact support."
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setScheduleMessage("Authentication failed. Please log in.");
        return;
      }

      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/schedule`,
        {
          module: user.module,
          course: user.course,
          date: newSchedule.date,
          time: newSchedule.time,
          location: newSchedule.location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedules([...schedules, response.data]);
      setScheduleMessage("Class scheduled successfully!");
      setNewSchedule({ date: "", time: "", location: "" });
    } catch (error) {
      console.error("Error scheduling class:", error);
      setScheduleMessage("Failed to schedule class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/lecturer-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Schedule Classes</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>

        <div className="bg-[#E8E9E9] p-6 rounded-lg shadow-md border-2 border-gray-300 mb-6">
          <form onSubmit={handleScheduleClass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={newSchedule.date}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, date: e.target.value })
                }
                className="mt-1 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <input
                type="time"
                value={newSchedule.time}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, time: e.target.value })
                }
                className="mt-1 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={newSchedule.location}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, location: e.target.value })
                }
                className="mt-1 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700"
                placeholder="Enter location"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#FF7700] text-white py-2 rounded-lg shadow-md hover:bg-orange-600 transition flex items-center justify-center space-x-2"
              disabled={loading}
            >
              <FaCalendarPlus />
              <span>{loading ? "Scheduling..." : "Schedule Class"}</span>
            </button>
          </form>
          {scheduleMessage && (
            <p
              className={`mt-4 text-center ${
                scheduleMessage.includes("successfully")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {scheduleMessage}
            </p>
          )}
        </div>

        <div className="bg-[#D8EAF3] p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Scheduled Classes</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading schedules...</p>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-gray-500">No classes scheduled yet.</p>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-[#E7FFFF] p-4 rounded-lg flex items-start space-x-4"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-md font-medium">{schedule.module}</h3>
                  <p className="text-sm text-gray-600">{schedule.location}</p>
                  <p className="text-sm">{schedule.time}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(schedule.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    Registered Students: {schedule.registeredUsers || 0}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleClassesPage;
