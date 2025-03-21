// src/pages/AnnouncementsPage.tsx
import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { useUser } from "../context/UserContext"; // Import useUser to access role

// Define the Announcement interface for the frontend
interface Announcement {
  id: number;
  message: string;
  date: string;
}

// Define the backend response interface for type safety
interface BackendAnnouncement {
  id: number;
  message: string;
  sent_at: string;
  sender_name: string;
}

const socket = io(`${import.meta.env.VITE_API}`, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const AnnouncementsPage = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // Get user from context to check role
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Fetch initial announcements from backend and sort by sent_at (newest first)
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get<BackendAnnouncement[]>(
            `${import.meta.env.VITE_API_URL}/announcements`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          // Sort announcements by sent_at in descending order (newest first)
          const sortedAnnouncements = response.data.sort(
            (a, b) =>
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
          );
          const fetchedAnnouncements: Announcement[] = sortedAnnouncements.map(
            (item) => ({
              id: item.id,
              message: item.message,
              date: `📅 Sent on: ${new Date(
                item.sent_at
              ).toLocaleDateString()}`,
            })
          );
          setAnnouncements(fetchedAnnouncements);
        }
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };
    fetchAnnouncements();
  }, []);

  // Handle WebSocket updates (newest announcement gets prepended, so order remains correct)
  useEffect(() => {
    socket.on("receiveAnnouncement", (data: BackendAnnouncement) => {
      setAnnouncements((prev) => [
        {
          id: data.id,
          message: data.message,
          date: `📅 Sent on: ${new Date(data.sent_at).toLocaleDateString()}`,
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("receiveAnnouncement");
    };
  }, []);

  // Navigate based on user role
  const handleBack = () => {
    if (user?.role === "lecturer") {
      navigate("/lecturer-dashboard");
    } else {
      navigate("/student-dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack} // Use dynamic handler
            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-2xl font-semibold ml-4">Announcements</h2>
        </div>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-yellow-100 p-4 rounded-lg shadow-sm"
            >
              <p className="text-sm text-gray-700">{announcement.message}</p>
              <p className="text-xs text-gray-500 mt-1">{announcement.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
