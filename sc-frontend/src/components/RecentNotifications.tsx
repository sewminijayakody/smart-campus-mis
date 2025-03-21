import { FaBell, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io(`${import.meta.env.VITE_API}`, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const RecentNotifications = () => {
  const navigate = useNavigate();
  const [recentNotification, setRecentNotification] = useState({
    id: 1,
    message: "Assessment Submission Deadline",
    date: "Thursday, 18th February",
  });

  // Fetch the most recent notification from backend
  useEffect(() => {
    const fetchRecentNotification = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/notifications`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const notifications = response.data;
          if (notifications.length > 0) {
            // Sort by sent_at descending
            notifications.sort(
              (a: any, b: any) =>
                new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            );
            const latest = notifications[0]; // Now sorted by date
            setRecentNotification({
              id: latest.id,
              message: latest.message,
              date: new Date(latest.sent_at).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching recent notification:", err);
      }
    };
    fetchRecentNotification();
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    socket.on("receiveNotification", (data) => {
      setRecentNotification({
        id: data.id,
        message: data.message,
        date: new Date(data.sent_at).toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      });
    });

    return () => {
      socket.off("receiveNotification");
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm w-[300px] mt-5 ml-13 overflow-hidden">
      <div className="p-4 bg-[#D8EAF3]">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">
            Recent Notifications
          </h2>
          <FaBell className="text-xl text-gray-600" />
        </div>
        <div className="flex items-start mb-3">
          <div className="w-2 h-2 bg-[#E63D37] rounded-full mt-2 mr-3"></div>
          <div>
            <div className="text-md font-semibold text-gray-800">
              {recentNotification.message}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {recentNotification.date}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-blue-300"></div>
      <div
        className="bg-[#C7EDFF] p-3 flex justify-end items-center cursor-pointer hover:bg-gray-200"
        onClick={() => navigate("/notifications")}
      >
        <span className="text-blue-500 text-sm font-semibold mr-2">
          See More
        </span>
        <FaArrowRight className="text-blue-500 text-sm" />
      </div>
    </div>
  );
};

export default RecentNotifications;
