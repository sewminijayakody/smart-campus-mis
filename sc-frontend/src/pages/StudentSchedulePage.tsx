// src/pages/StudentSchedulePage.tsx (full updated code)
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import axios from "axios";
import { useUser } from "../context/UserContext";

interface Schedule {
  id: number;
  module: string;
  course: string;
  date: string; // Stored as YYYY-MM-DD
  time: string;
  location: string;
  registered?: boolean;
  registeredUsers?: number;
}

const StudentSchedulePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(
    (location.state?.selectedDate as Date) || new Date()
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [registeredSchedules, setRegisteredSchedules] = useState<number[]>(
    () => {
      const saved = localStorage.getItem("registeredSchedules");
      return saved ? JSON.parse(saved) : [];
    }
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [renderKey, setRenderKey] = useState(Date.now());
  const [loading, setLoading] = useState<boolean>(true);

  // Sync state from location or localStorage
  useEffect(() => {
    const state = location.state as {
      selectedDate?: Date;
      registeredSchedules?: number[];
    };
    if (state?.selectedDate) {
      setSelectedDate(state.selectedDate);
    }
    if (state?.registeredSchedules) {
      setRegisteredSchedules(state.registeredSchedules);
      localStorage.setItem(
        "registeredSchedules",
        JSON.stringify(state.registeredSchedules)
      );
    } else {
      fetchUserRegistrations();
    }
  }, [location]);

  // Fetch schedules for the student's course
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user?.course) {
          console.error("No token or course found");
          return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/schedule`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { course: user.course },
          }
        );
        const fetchedSchedules = response.data.map((schedule: Schedule) => ({
          ...schedule,
          registered: registeredSchedules.includes(schedule.id),
        }));
        setSchedules(fetchedSchedules);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [user?.course, registeredSchedules]);

  // Fetch user's registered schedules from backend
  const fetchUserRegistrations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !user?.id) {
        console.error("No token or user ID found");
        return;
      }
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/schedule/registrations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const userRegistrations = response.data;
      setRegisteredSchedules(userRegistrations);
      localStorage.setItem(
        "registeredSchedules",
        JSON.stringify(userRegistrations)
      );
    } catch (error) {
      console.error("Error fetching user registrations:", error);
    }
  };

  // Handle schedule registration
  const handleRegister = async (scheduleId: number) => {
    try {
      if (registeredSchedules.includes(scheduleId)) {
        console.log(`Already registered for schedule ${scheduleId}`);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token || !user?.id) {
        console.error("No token or user ID found");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/schedule/register`,
        { scheduleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedRegisteredSchedules = [...registeredSchedules, scheduleId];
      setRegisteredSchedules(updatedRegisteredSchedules);
      localStorage.setItem(
        "registeredSchedules",
        JSON.stringify(updatedRegisteredSchedules)
      );

      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) =>
          schedule.id === scheduleId
            ? { ...schedule, registered: true }
            : schedule
        )
      );
      setRenderKey(Date.now()); // Force re-render
    } catch (error) {
      console.error("Error registering for schedule:", error);
    }
  };

  // Handle month navigation
  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
    );

  // Handle date selection
  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(newDate);
  };

  // Filter schedules for the selected date
  const filteredSchedules = schedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date);
    return scheduleDate.toDateString() === selectedDate.toDateString();
  });

  const handleBack = () => {
    navigate("/student-dashboard", {
      state: { selectedDate, registeredSchedules },
    });
  };

  const getMonthName = (date: Date) =>
    date.toLocaleString("default", { month: "long" });
  const getYear = (date: Date) => date.getFullYear();
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  return (
    <div
      className="min-h-screen bg-gray-50 p-6 text-black relative"
      key={renderKey}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6 mt-8 -ml-15">
          Scheduled Classes
        </h1>
        <div className="absolute top-6 right-6">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>
        <div className="flex space-x-6 mt-6">
          <div className="w-1/3 relative">
            <div className="bg-[#E7FFED] p-4 rounded-lg shadow-md border-45 border-[#D8F3E3] mt-16 flex justify-center">
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
                        day === selectedDate.getDate() &&
                        currentMonth.getMonth() === selectedDate.getMonth() &&
                        currentMonth.getFullYear() ===
                          selectedDate.getFullYear();
                      const isToday =
                        day === new Date().getDate() &&
                        currentMonth.getMonth() === new Date().getMonth() &&
                        currentMonth.getFullYear() === new Date().getFullYear();
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
          <div className="w-2/3">
            <div
              className="bg-[#D8EAF3] p-4 rounded-lg shadow-md space-y-4 border border-[#D8EAF3] ml-11 mt-16"
              key={renderKey}
            >
              {loading ? (
                <p className="text-sm text-gray-500">Loading schedules...</p>
              ) : filteredSchedules.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No scheduled classes for {selectedDate.toDateString()}
                </p>
              ) : (
                filteredSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="bg-[#E7FFFF] p-4 rounded-lg flex items-start space-x-4"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h3 className="text-md font-medium">{schedule.module}</h3>
                      <p className="text-sm text-gray-600">
                        {schedule.location}
                      </p>
                      <p className="text-sm">{schedule.time}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(schedule.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {schedule.registered ? (
                        <p className="text-sm text-green-600">Registered</p>
                      ) : (
                        <button
                          onClick={() => handleRegister(schedule.id)}
                          className="mt-2 px-4 py-1 bg-[#FF7700] text-white rounded-lg hover:bg-orange-600 transition"
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSchedulePage;
