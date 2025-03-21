import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBell } from "react-icons/fa";
import io from "socket.io-client";
import axios from "axios";
import { useUser } from "../context/UserContext";

interface Notification {
  [x: string]: string | number | Date;
  id: number;
  type: string;
  sender: string;
  designation: string;
  message: string;
  color: string;
}

const socket = io(`${import.meta.env.VITE_API}`, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/notifications`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          let fetchedNotifications: Notification[] = response.data.map(
            (item: any) => ({
              id: item.id,
              type: item.type,
              sender: item.sender_name,
              designation: "Administrator",
              message: item.message,
              color: "bg-yellow-100",
            })
          );

          // Sort notifications by sent_at descending
          fetchedNotifications = fetchedNotifications.sort(
            (a, b) =>
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
          );
          setNotifications(fetchedNotifications);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    socket.on("receiveNotification", (data: any) => {
      setNotifications((prev) => [
        {
          id: data.id,
          type: data.type,
          sender: data.sender_name,
          designation: "Administrator",
          message: data.message,
          color: "bg-yellow-100",
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("receiveNotification");
    };
  }, []);

  const handleBack = () => {
    if (user?.role === "lecturer") {
      navigate("/lecturer-dashboard");
    } else {
      navigate("/student-dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-center">
      <div className="w-full max-w-3xl bg-blue-100 p-6 rounded-lg shadow-md space-y-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-2xl font-semibold text-center">Notifications</h2>
          <div className="w-10"></div>
        </div>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex flex-col p-4 rounded-lg shadow-md space-y-2 ${notification.color}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FaBell className="text-gray-700" />
                <h3 className="font-semibold text-gray-700">
                  {notification.type} Notification
                </h3>
              </div>
              <div className="text-sm text-gray-600">
                <span>{notification.sender}</span>
                <span className="text-gray-400 ml-1">
                  ({notification.designation})
                </span>
              </div>
            </div>
            <p className="text-gray-800">{notification.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
