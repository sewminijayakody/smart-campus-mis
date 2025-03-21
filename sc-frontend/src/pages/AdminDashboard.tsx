// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaGraduationCap,
  FaUserTie,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import axios from "axios";
import io from "socket.io-client";
import { useUser } from "../context/UserContext"; // Import UserContext
import userImage from "../assets/images/Picture9.png";

// Define the Event interface
interface Event {
  id: number;
  title: string;
  location: string;
  time: string;
  date: string;
  registeredUsers?: number;
}

// Define the Announcement interface
interface Announcement {
  id: number;
  message: string;
  date: string;
  sender_name?: string; // Optional, based on backend response
}

const socket = io(`${import.meta.env.VITE_API}`, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // Access user data from UserContext
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalLecturers, setTotalLecturers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Fetch events
          const eventsResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/events`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log(
            "Fetched events for AdminDashboard:",
            eventsResponse.data
          );
          setEvents(eventsResponse.data);

          // Fetch total students
          const studentsResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/students`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Fetched students for count:", studentsResponse.data);
          setTotalStudents(studentsResponse.data.length);

          // Fetch total lecturers
          const lecturersResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/lecturers`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Fetched lecturers for count:", lecturersResponse.data);
          setTotalLecturers(lecturersResponse.data.length);

          // Fetch announcements
          const announcementsResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/announcements`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const sortedAnnouncements = announcementsResponse.data.sort(
            (a: any, b: any) =>
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
          );
          const formattedAnnouncements: Announcement[] =
            sortedAnnouncements.map((item: any) => ({
              id: item.id,
              message: item.message,
              date: new Date(item.sent_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              sender_name: item.sender_name,
            }));
          setAnnouncements(formattedAnnouncements);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // WebSocket for real-time announcement updates
    socket.on("receiveAnnouncement", (data: any) => {
      console.log("Received new announcement via WebSocket:", data);
      setAnnouncements((prev) => [
        {
          id: data.id,
          message: data.message,
          date: new Date(data.sent_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          sender_name: data.sender_name,
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("receiveAnnouncement");
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  // Navigation handlers for tabs
  const handleRegisterUsers = () => navigate("/register-users");
  const handleNewsfeed = () => navigate("/newsfeed");
  const handleUploadFiles = () => navigate("/admin-file-upload");
  const handleReportGeneration = () => navigate("/report-generation");
  const handleInquiries = () => navigate("/admin-inquiries");
  const handleChat = () => navigate("/chat");
  const handleScheduleEvents = () => {
    console.log("Attempting to navigate to /schedule-events for admin");
    navigate("/schedule-events");
  };
  const handleRequests = () => navigate("/requests");

  // Navigation for container clicks
  const handleStudentsClick = () => navigate("/manage-students");
  const handleLecturersClick = () => navigate("/manage-lecturers");

  // Navigation for admin profile
  const handleProfileClick = () => navigate("/admin-profile");

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
    setSelectedDate(newDate);
  };

  const getMonthName = (date: Date) =>
    date.toLocaleString("default", { month: "long" });
  const getYear = (date: Date) => date.getFullYear();
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Left Side Panel */}
      <div className="w-full md:w-1/5 bg-[#D8F3E3] p-6 shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Hello, Admin!</h1>
        <div className="space-y-2">
          <button
            onClick={handleRegisterUsers}
            className="w-full bg-[#E7FFED] p-2 rounded-lg text-left hover:bg-green-100 transition duration-300 text-gray-700"
          >
            Register User Accounts
          </button>
          <button
            onClick={handleNewsfeed}
            className="w-full bg-[#E7FFED] p-2 rounded-lg text-left hover:bg-green-100 transition duration-300 text-gray-700"
          >
            Newsfeed
          </button>
          <button
            onClick={handleUploadFiles}
            className="w-full bg-[#E7FFED] p-2 rounded-lg text-left hover:bg-green-100 transition duration-300 text-gray-700"
          >
            Upload Files
          </button>
          <button
            onClick={handleReportGeneration}
            className="w-full bg-[#E7FFED] p-2 rounded-lg text-left hover:bg-green-100 transition duration-300 text-gray-700"
          >
            Report Generation
          </button>
          <button
            onClick={handleInquiries}
            className="w-full bg-[#E7FFED] p-2 rounded-lg text-left hover:bg-green-100 transition duration-300 text-gray-700"
          >
            Inquiries
          </button>
          <button
            onClick={handleChat}
            className="w-full bg-[#E7FFED] p-2 rounded-lg text-left hover:bg-green-100 transition duration-300 text-gray-700"
          >
            Chat
          </button>
          <button
            onClick={handleScheduleEvents}
            className="w-full bg-[#E7FFED] p-2 rounded-lg text-left hover:bg-green-100 transition duration-300 text-gray-700"
          >
            Schedule Events
          </button>
          <button
            onClick={handleRequests}
            className="w-full bg-[#E7FFED] p-2 rounded-lg text-left hover:bg-green-100 transition duration-300 text-gray-700"
          >
            Requests
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white p-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600 transition duration-300 mt-4"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:w-4/5 p-6 flex flex-col space-y-6">
        {/* Top Section: Containers and Calendar */}
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* Containers and Announcements */}
          <div className="w-full md:w-2/3 flex flex-col space-y-6">
            {/* Top Containers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={handleStudentsClick}
                className="bg-pink-100 p-4 rounded-lg shadow-md cursor-pointer hover:bg-pink-200 transition duration-300 flex items-center space-x-4"
              >
                <FaGraduationCap className="text-3xl text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">
                    Total Students
                  </h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {loading ? "Loading..." : totalStudents}
                  </p>
                </div>
              </div>
              <div
                onClick={handleLecturersClick}
                className="bg-yellow-100 p-4 rounded-lg shadow-md cursor-pointer hover:bg-yellow-200 transition duration-300 flex items-center space-x-4"
              >
                <FaUserTie className="text-3xl text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">
                    Total Lecturers
                  </h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {loading ? "Loading..." : totalLecturers}
                  </p>
                </div>
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Announcements
              </h2>
              <div className="space-y-2">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="bg-blue-800 text-white p-2 rounded-lg text-sm"
                    >
                      <p>{announcement.message}</p>
                      <p className="text-xs mt-1">{announcement.date}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No announcements available.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Admin Icon and Events */}
          <div className="w-full md:w-1/3 flex flex-col space-y-4">
            {/* Admin User Icon */}
            <div className="flex justify-end">
              <button
                onClick={handleProfileClick}
                className="bg-gray-200 text-gray-800 p-2 rounded-full hover:bg-gray-300 transition duration-300"
              >
                <img
                  src={user?.imageUrl || userImage}
                  alt="Admin Profile"
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    console.error("Image load error:", e);
                    e.currentTarget.src = userImage; // Fallback to default image on error
                  }}
                />
              </button>
            </div>

            {/* Events Section */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Events</h2>
              <div className="flex flex-col space-y-4">
                {/* Custom Calendar */}
                <div className="bg-[#E7FFED] p-4 rounded-lg shadow-md border-45 border-[#D8F3E3] flex justify-center">
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
                            currentMonth.getMonth() ===
                              selectedDate.getMonth() &&
                            currentMonth.getFullYear() ===
                              selectedDate.getFullYear();
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

                {/* Event Details */}
                {filteredEvents.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No events for this date
                  </p>
                ) : (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-blue-800 text-white p-2 rounded-lg text-sm"
                    >
                      <p>{event.time}</p>
                      <p>{event.title}</p>
                      <p>Location: {event.location}</p>
                      <p>
                        No of Registered Participants:{" "}
                        {event.registeredUsers || 0}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
